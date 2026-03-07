import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

/**
 * Zod schema for food bank registration.
 * Includes all distribution-algorithm-relevant fields.
 */
const CreateFoodBankSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  contact_email: z.string().email(),
  contact_phone: z.string().max(30).optional(),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip_code: z.string().min(1).max(20),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity_kg: z.number().nonnegative().optional(),
  operating_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
  })).optional(),
  dietary_restrictions: z.array(z.string()).optional(),
  accepted_food_types: z.array(z.string()).optional(),
  pickup_capability: z.boolean().default(false),
  max_pickup_distance_km: z.number().nonnegative().optional(),
  avg_weekly_demand_kg: z.number().nonnegative().optional(),
  current_inventory_kg: z.number().nonnegative().default(0),
  service_area_radius_km: z.number().nonnegative().optional(),
  priority_score: z.number().min(0).max(1).default(0.5),
});

const UpdateFoodBankSchema = CreateFoodBankSchema.partial().omit({ organization_id: true });

/**
 * POST /api/v1/food-banks
 *
 * Register a new food bank with distribution-relevant data.
 * TODO: Add Auth0 JWT + admin role check
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateFoodBankSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid food bank registration payload',
      details: parseResult.error.issues,
    });
    return;
  }

  const payload = parseResult.data;

  const { data: foodBank, error } = await supabaseAdmin
    .from('food_banks')
    .insert({
      organization_id: payload.organization_id,
      name: payload.name,
      contact_email: payload.contact_email,
      contact_phone: payload.contact_phone ?? null,
      address: payload.address ?? null,
      city: payload.city,
      state: payload.state,
      zip_code: payload.zip_code,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      capacity_kg: payload.capacity_kg ?? null,
      operating_hours: payload.operating_hours ?? null,
      dietary_restrictions: payload.dietary_restrictions ?? null,
      accepted_food_types: payload.accepted_food_types ?? null,
      pickup_capability: payload.pickup_capability,
      max_pickup_distance_km: payload.max_pickup_distance_km ?? null,
      avg_weekly_demand_kg: payload.avg_weekly_demand_kg ?? null,
      current_inventory_kg: payload.current_inventory_kg,
      service_area_radius_km: payload.service_area_radius_km ?? null,
      priority_score: payload.priority_score,
    })
    .select()
    .single();

  if (error || !foodBank) {
    console.error('Failed to register food bank:', error);
    res.status(500).json({ error: 'Failed to register food bank' });
    return;
  }

  res.status(201).json({ data: foodBank });
});

/**
 * GET /api/v1/food-banks
 *
 * List all food banks. Used by the distribution algorithm to cache locally.
 * Returns all distribution-relevant fields.
 * TODO: Add Auth0 JWT middleware + org scoping
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const cursor = req.query.cursor as string | undefined;
  const activeOnly = req.query.active !== 'false'; // default: active only

  let query = supabaseAdmin
    .from('food_banks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: foodBanks, error } = await query;

  if (error) {
    console.error('Failed to list food banks:', error);
    res.status(500).json({ error: 'Failed to list food banks' });
    return;
  }

  const nextCursor = foodBanks && foodBanks.length === limit
    ? foodBanks[foodBanks.length - 1]?.created_at
    : null;

  res.json({ data: foodBanks ?? [], next_cursor: nextCursor });
});

/**
 * GET /api/v1/food-banks/:foodBankId
 */
router.get('/:foodBankId', async (req: Request, res: Response): Promise<void> => {
  const foodBankId = req.params.foodBankId as string;

  const { data: foodBank, error } = await supabaseAdmin
    .from('food_banks')
    .select('*')
    .eq('id', foodBankId)
    .single();

  if (error || !foodBank) {
    res.status(404).json({ error: `Food bank not found: ${foodBankId}` });
    return;
  }

  res.json({ data: foodBank });
});

/**
 * PATCH /api/v1/food-banks/:foodBankId
 *
 * Update food bank data (inventory, priority, etc.)
 */
router.patch('/:foodBankId', async (req: Request, res: Response): Promise<void> => {
  const foodBankId = req.params.foodBankId as string;
  const parseResult = UpdateFoodBankSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid update payload', details: parseResult.error.issues });
    return;
  }

  const { data: foodBank, error } = await supabaseAdmin
    .from('food_banks')
    .update(parseResult.data)
    .eq('id', foodBankId)
    .select()
    .single();

  if (error || !foodBank) {
    res.status(404).json({ error: `Food bank not found: ${foodBankId}` });
    return;
  }

  res.json({ data: foodBank });
});

/**
 * GET /api/v1/food-banks/distribution/snapshot
 *
 * Returns a compact snapshot of all active food banks with only
 * the fields needed for the distribution algorithm.
 * Designed to be cached locally by the API server.
 */
router.get('/distribution/snapshot', async (_req: Request, res: Response): Promise<void> => {
  const { data: foodBanks, error } = await supabaseAdmin
    .from('food_banks')
    .select(`
      id, name, latitude, longitude,
      capacity_kg, current_inventory_kg,
      avg_weekly_demand_kg, priority_score,
      pickup_capability, max_pickup_distance_km,
      service_area_radius_km,
      accepted_food_types, dietary_restrictions,
      operating_hours, is_active
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch distribution snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch distribution snapshot' });
    return;
  }

  res.json({
    data: foodBanks ?? [],
    cached_at: new Date().toISOString(),
    count: foodBanks?.length ?? 0,
  });
});

export default router;
