import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/v1/alerts
 *
 * List donation alerts with optional filters.
 * TODO: Add Auth0 JWT middleware + org scoping
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor as string | undefined;
  const status = req.query.status as 'pending' | 'accepted' | 'expired' | 'cancelled' | undefined;
  const priority = req.query.priority as 'low' | 'medium' | 'high' | 'critical' | undefined;

  let query = supabaseAdmin
    .from('donation_alerts')
    .select(`
      id,
      bin_id,
      priority,
      estimated_weight_kg,
      status,
      expires_at,
      created_at,
      resolved_at,
      bins!inner ( id, label, store_address, organization_id )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: alerts, error } = await query;

  if (error) {
    console.error('Failed to list alerts:', error);
    res.status(500).json({ error: 'Failed to list alerts' });
    return;
  }

  const nextCursor = alerts && alerts.length === limit
    ? alerts[alerts.length - 1]?.created_at
    : null;

  res.json({
    data: alerts ?? [],
    next_cursor: nextCursor,
  });
});

/**
 * GET /api/v1/alerts/:alertId
 *
 * Get a single alert with its recipients.
 * TODO: Add Auth0 JWT middleware
 */
router.get('/:alertId', async (req: Request, res: Response): Promise<void> => {
  const alertId = req.params.alertId as string;

  const { data: alert, error } = await supabaseAdmin
    .from('donation_alerts')
    .select(`
      *,
      bins ( id, label, store_address, latitude, longitude ),
      bin_telemetry_readings ( temperature_c, gas_ppm, weight_kg, freshness_score, recorded_at ),
      donation_alert_recipients (
        id,
        food_bank_id,
        notified_at,
        response,
        responded_at,
        food_banks ( id, name, contact_email, address )
      )
    `)
    .eq('id', alertId as string)
    .single();

  if (error || !alert) {
    res.status(404).json({ error: `Alert not found: ${alertId}` });
    return;
  }

  res.json({ data: alert });
});

/**
 * POST /api/v1/alerts/:alertId/respond
 *
 * Accept or decline a donation alert (food bank coordinator action).
 * TODO: Add Auth0 JWT middleware + coordinator role check
 */
router.post('/:alertId/respond', async (req: Request, res: Response): Promise<void> => {
  const alertId = req.params.alertId as string;
  const { response: responseValue, food_bank_id } = req.body as {
    response?: string;
    food_bank_id?: string;
  };

  if (!responseValue || !['accepted', 'declined'].includes(responseValue)) {
    res.status(400).json({ error: 'response must be "accepted" or "declined"' });
    return;
  }

  if (!food_bank_id) {
    res.status(400).json({ error: 'food_bank_id is required' });
    return;
  }

  // Update the recipient's response
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from('donation_alert_recipients')
    .update({
      response: responseValue as 'accepted' | 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('donation_alert_id', alertId as string)
    .eq('food_bank_id', food_bank_id)
    .select()
    .single();

  if (recipientError || !recipient) {
    res.status(404).json({ error: 'Alert recipient not found' });
    return;
  }

  // If accepted, update the alert status
  if (responseValue === 'accepted') {
    await supabaseAdmin
      .from('donation_alerts')
      .update({
        status: 'accepted',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId as string);
  }

  res.json({
    message: `Alert ${responseValue}`,
    recipient,
  });
});

export default router;
