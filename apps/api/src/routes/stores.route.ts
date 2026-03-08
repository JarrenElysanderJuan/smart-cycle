import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

/**
 * Zod schema for store registration.
 */
const CreateStoreSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip_code: z.string().min(1).max(20),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  contact_name: z.string().min(1).max(255),
  contact_email: z.string().email(),
  contact_phone: z.string().max(30).optional(),
  store_type: z.enum(['grocery', 'warehouse', 'specialty']).default('grocery'),
  operating_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
  })).optional(),
  average_daily_waste_kg: z.number().nonnegative().optional(),
});

const UpdateStoreSchema = CreateStoreSchema.partial().omit({ organization_id: true });

/**
 * POST /api/v1/stores
 *
 * Register a new grocery store.
 * TODO: Add Auth0 JWT + admin role check
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateStoreSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid store registration payload',
      details: parseResult.error.issues,
    });
    return;
  }

  const payload = parseResult.data;

  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .insert({
      organization_id: payload.organization_id,
      name: payload.name,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      zip_code: payload.zip_code,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      contact_name: payload.contact_name,
      contact_email: payload.contact_email,
      contact_phone: payload.contact_phone ?? null,
      store_type: payload.store_type,
      operating_hours: payload.operating_hours ?? null,
      average_daily_waste_kg: payload.average_daily_waste_kg ?? null,
    })
    .select()
    .single();

  if (error || !store) {
    console.error('Failed to register store:', error);
    res.status(500).json({ error: 'Failed to register store' });
    return;
  }

  res.status(201).json({ data: store });
});

/**
 * GET /api/v1/stores
 *
 * List all stores with pagination.
 * TODO: Add Auth0 JWT middleware + org scoping
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor as string | undefined;

  let query = supabaseAdmin
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: stores, error } = await query;

  if (error) {
    console.error('Failed to list stores:', error);
    res.status(500).json({ error: 'Failed to list stores' });
    return;
  }

  const nextCursor = stores && stores.length === limit
    ? stores[stores.length - 1]?.created_at
    : null;

  res.json({ data: stores ?? [], next_cursor: nextCursor });
});

/**
 * GET /api/v1/stores/:storeId
 */
router.get('/:storeId', async (req: Request, res: Response): Promise<void> => {
  const storeId = req.params.storeId as string;

  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error || !store) {
    res.status(404).json({ error: `Store not found: ${storeId}` });
    return;
  }

  res.json({ data: store });
});

/**
 * PATCH /api/v1/stores/:storeId
 */
router.patch('/:storeId', async (req: Request, res: Response): Promise<void> => {
  const storeId = req.params.storeId as string;
  const parseResult = UpdateStoreSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid update payload', details: parseResult.error.issues });
    return;
  }

  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .update(parseResult.data)
    .eq('id', storeId)
    .select()
    .single();

  if (error || !store) {
    res.status(404).json({ error: `Store not found: ${storeId}` });
    return;
  }

  res.json({ data: store });
});

export default router;
