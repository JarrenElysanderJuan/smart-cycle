import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/v1/bins/:binId/telemetry
 *
 * Get telemetry history for a specific bin.
 * Supports time-range filtering and pagination.
 * TODO: Add Auth0 JWT middleware + org scoping
 */
router.get('/:binId/telemetry', async (req: Request, res: Response): Promise<void> => {
  const { binId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const since = req.query.since as string | undefined;
  const until = req.query.until as string | undefined;

  let query = supabaseAdmin
    .from('bin_telemetry_readings')
    .select('id, recorded_at, temperature_c, gas_ppm, weight_kg, battery_level, freshness_score, ingested_at')
    .eq('bin_id', binId as string)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gte('recorded_at', since);
  }
  if (until) {
    query = query.lte('recorded_at', until);
  }

  const { data: readings, error } = await query;

  if (error) {
    console.error('Failed to fetch telemetry:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry readings' });
    return;
  }

  res.json({ data: readings ?? [] });
});

export default router;
