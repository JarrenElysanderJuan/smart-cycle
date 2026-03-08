import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { CreateBinSchema } from '../schemas/telemetry.schema.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/v1/bins
 *
 * Register a new bin. Returns the generated API key (shown ONCE).
 * TODO: Add Auth0 JWT + admin role check middleware
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateBinSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid bin registration payload',
      details: parseResult.error.issues,
    });
    return;
  }

  const payload = parseResult.data;

  // Generate a secure API key for this bin
  const rawApiKey = `sc_bin_${crypto.randomBytes(32).toString('hex')}`;
  const apiKeyHash = await bcrypt.hash(rawApiKey, 12);

  const { data: bin, error } = await supabaseAdmin
    .from('bins')
    .insert({
      organization_id: payload.organization_id,
      label: payload.label,
      location_description: payload.location_description ?? null,
      store_address: payload.store_address ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      api_key_hash: apiKeyHash,
      status: 'online',
    })
    .select('id, label, organization_id, status, created_at')
    .single();

  if (error || !bin) {
    console.error('Failed to register bin:', error);
    res.status(500).json({ error: 'Failed to register bin' });
    return;
  }

  // Return the API key — this is the ONLY time it will be shown
  res.status(201).json({
    message: 'Bin registered successfully',
    bin,
    api_key: rawApiKey,
    warning: 'Store this API key securely. It will not be shown again.',
  });
});

/**
 * GET /api/v1/bins
 *
 * List all bins. Supports cursor-based pagination.
 * TODO: Add Auth0 JWT middleware + org scoping
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor as string | undefined;

  let query = supabaseAdmin
    .from('bins')
    .select('id, label, organization_id, status, last_seen_at, store_address, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: bins, error } = await query;

  if (error) {
    console.error('Failed to list bins:', error);
    res.status(500).json({ error: 'Failed to list bins' });
    return;
  }

  const nextCursor = bins && bins.length === limit
    ? bins[bins.length - 1]?.created_at
    : null;

  res.json({
    data: bins ?? [],
    next_cursor: nextCursor,
  });
});

/**
 * GET /api/v1/bins/:binId
 *
 * Get a single bin's details.
 * TODO: Add Auth0 JWT middleware + org scoping
 */
router.get('/:binId', async (req: Request, res: Response): Promise<void> => {
  const { binId } = req.params;

  const { data: bin, error } = await supabaseAdmin
    .from('bins')
    .select('id, label, organization_id, status, last_seen_at, store_address, latitude, longitude, location_description, installed_at, created_at')
    .eq('id', binId as string)
    .single();

  if (error || !bin) {
    res.status(404).json({ error: `Bin not found: ${binId}` });
    return;
  }

  res.json({ data: bin });
});

/**
 * POST /api/v1/bins/:binId/rotate-key
 *
 * Rotate a bin's API key. Returns the new key (shown ONCE).
 * TODO: Add Auth0 JWT + admin role check middleware
 */
router.post('/:binId/rotate-key', async (req: Request, res: Response): Promise<void> => {
  const { binId } = req.params;

  const newApiKey = `sc_bin_${crypto.randomBytes(32).toString('hex')}`;
  const newHash = await bcrypt.hash(newApiKey, 12);

  const { data: bin, error } = await supabaseAdmin
    .from('bins')
    .update({ api_key_hash: newHash })
    .eq('id', binId as string)
    .select('id, label')
    .single();

  if (error || !bin) {
    res.status(404).json({ error: `Bin not found: ${binId}` });
    return;
  }

  res.json({
    message: 'API key rotated successfully',
    bin_id: bin.id,
    api_key: newApiKey,
    warning: 'Store this API key securely. It will not be shown again.',
  });
});

export default router;
