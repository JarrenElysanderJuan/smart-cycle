import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { mockRouteDonation } from '../mocks/index.js';

const router = Router();

/**
 * POST /api/v1/alerts/:alertId/approve
 *
 * Store manager approves a pending alert for donation.
 * Transitions: pending → approved_by_store → routed
 *
 * After approval, the donation router is called to rank and notify food banks.
 *
 * TODO: [AUTH0] Add Auth0 JWT middleware. Extract user ID from JWT claims.
 * TODO: [AUTH0] Verify the user has role 'store_manager' and belongs to the
 *       same organization as the bin that triggered this alert.
 */
router.post('/:alertId/approve', async (req: Request, res: Response): Promise<void> => {
  const alertId = req.params.alertId as string;

  // TODO: [AUTH0] Replace with real user ID from JWT: req.auth.payload.sub
  const userId = req.body.user_id as string | undefined;

  // 1. Fetch the alert and ensure it's in 'pending' status
  const { data: alert, error: alertError } = await supabaseAdmin
    .from('donation_alerts')
    .select(`
      *,
      bins!inner ( id, label, store_address, latitude, longitude, organization_id, store_id )
    `)
    .eq('id', alertId)
    .single();

  if (alertError || !alert) {
    res.status(404).json({ error: `Alert not found: ${alertId}` });
    return;
  }

  if (alert.status !== 'pending') {
    res.status(409).json({
      error: `Alert is already '${alert.status}', can only approve 'pending' alerts`,
    });
    return;
  }

  // 2. Transition to approved_by_store
  const { error: updateError } = await supabaseAdmin
    .from('donation_alerts')
    .update({
      status: 'approved_by_store',
      approved_by_user_id: userId ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (updateError) {
    console.error('Failed to approve alert:', updateError);
    res.status(500).json({ error: 'Failed to approve alert' });
    return;
  }

  // 3. Run the donation router (mock) to find food bank candidates
  const bin = alert.bins as unknown as {
    id: string; label: string; latitude: number | null;
    longitude: number | null; organization_id: string;
  };

  // Fetch active food banks for routing
  const { data: foodBanks } = await supabaseAdmin
    .from('food_banks')
    .select('id, name, latitude, longitude, capacity_kg, is_active')
    .eq('is_active', true);

  if (foodBanks && foodBanks.length > 0) {
    const ranked = mockRouteDonation(
      {
        id: alert.id,
        bin_latitude: bin.latitude ?? 0,
        bin_longitude: bin.longitude ?? 0,
        estimated_weight_kg: alert.estimated_weight_kg,
        priority: alert.priority,
      },
      foodBanks.map((fb) => ({
        id: fb.id,
        name: fb.name,
        latitude: fb.latitude ?? 0,
        longitude: fb.longitude ?? 0,
        capacity_kg: fb.capacity_kg ?? 0,
        is_active: fb.is_active,
      }))
    );

    // Create recipient records for top 3 food banks
    const topRecipients = ranked.slice(0, 3);

    if (topRecipients.length > 0) {
      await supabaseAdmin
        .from('donation_alert_recipients')
        .insert(
          topRecipients.map((r) => ({
            donation_alert_id: alertId,
            food_bank_id: r.food_bank_id,
          }))
        );
    }

    // 4. Transition to routed
    await supabaseAdmin
      .from('donation_alerts')
      .update({ status: 'routed' })
      .eq('id', alertId);
  }

  res.json({
    message: 'Alert approved and routed to food banks',
    alert_id: alertId,
    status: foodBanks && foodBanks.length > 0 ? 'routed' : 'approved_by_store',
  });
});

/**
 * POST /api/v1/alerts/:alertId/confirm-pickup
 *
 * Food bank coordinator confirms they physically picked up the donation.
 * Transitions: accepted → picked_up → completed
 *
 * Also updates the food bank's current_inventory_kg.
 *
 * TODO: [AUTH0] Add Auth0 JWT middleware. Verify user has role 'food_bank_coordinator'.
 * TODO: [AUTH0] Derive food_bank_id from the authenticated user's profile.
 */
router.post('/:alertId/confirm-pickup', async (req: Request, res: Response): Promise<void> => {
  const alertId = req.params.alertId as string;
  const { food_bank_id } = req.body as { food_bank_id?: string };

  if (!food_bank_id) {
    res.status(400).json({ error: 'food_bank_id is required' });
    return;
  }

  // 1. Verify the alert is in 'accepted' status
  const { data: alert, error: alertError } = await supabaseAdmin
    .from('donation_alerts')
    .select('id, status, estimated_weight_kg')
    .eq('id', alertId)
    .single();

  if (alertError || !alert) {
    res.status(404).json({ error: `Alert not found: ${alertId}` });
    return;
  }

  if (alert.status !== 'accepted') {
    res.status(409).json({
      error: `Alert is '${alert.status}', can only confirm pickup for 'accepted' alerts`,
    });
    return;
  }

  // 2. Verify this food bank actually accepted this alert
  const { data: recipient } = await supabaseAdmin
    .from('donation_alert_recipients')
    .select('id, response')
    .eq('donation_alert_id', alertId)
    .eq('food_bank_id', food_bank_id)
    .single();

  if (!recipient || recipient.response !== 'accepted') {
    res.status(403).json({ error: 'This food bank has not accepted this alert' });
    return;
  }

  const now = new Date().toISOString();

  // 3. Mark as picked_up → completed
  await supabaseAdmin
    .from('donation_alerts')
    .update({
      status: 'completed',
      picked_up_at: now,
      completed_at: now,
    })
    .eq('id', alertId);

  // 4. Update food bank inventory (add the donated weight)
  const { data: foodBank } = await supabaseAdmin
    .from('food_banks')
    .select('current_inventory_kg')
    .eq('id', food_bank_id)
    .single();

  if (foodBank) {
    const newInventory = (foodBank.current_inventory_kg ?? 0) + alert.estimated_weight_kg;
    await supabaseAdmin
      .from('food_banks')
      .update({ current_inventory_kg: newInventory })
      .eq('id', food_bank_id);
  }

  res.json({
    message: 'Pickup confirmed — donation completed',
    alert_id: alertId,
    added_kg: alert.estimated_weight_kg,
  });
});

/**
 * GET /api/v1/stores/:storeId/bins
 *
 * Returns bins belonging to a specific store.
 *
 * TODO: [AUTH0] Verify the requesting user belongs to the same org as the store.
 */
router.get('/stores/:storeId/bins', async (req: Request, res: Response): Promise<void> => {
  const storeId = req.params.storeId as string;

  const { data: bins, error } = await supabaseAdmin
    .from('bins')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch store bins:', error);
    res.status(500).json({ error: 'Failed to fetch store bins' });
    return;
  }

  res.json({ data: bins ?? [] });
});

/**
 * GET /api/v1/stores/:storeId/alerts
 *
 * Returns alerts triggered by bins belonging to a specific store.
 *
 * TODO: [AUTH0] Verify the requesting user belongs to the same org as the store.
 */
router.get('/stores/:storeId/alerts', async (req: Request, res: Response): Promise<void> => {
  const storeId = req.params.storeId as string;

  // First get bin IDs for this store
  const { data: bins } = await supabaseAdmin
    .from('bins')
    .select('id')
    .eq('store_id', storeId);

  if (!bins || bins.length === 0) {
    res.json({ data: [] });
    return;
  }

  const binIds = bins.map((b) => b.id);

  const { data: alerts, error } = await supabaseAdmin
    .from('donation_alerts')
    .select(`
      *,
      bins ( id, label, store_address ),
      donation_alert_recipients (
        id, food_bank_id, response, responded_at,
        food_banks ( id, name )
      )
    `)
    .in('bin_id', binIds)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch store alerts:', error);
    res.status(500).json({ error: 'Failed to fetch store alerts' });
    return;
  }

  res.json({ data: alerts ?? [] });
});

/**
 * GET /api/v1/food-banks/:foodBankId/donations
 *
 * Returns donation alerts where this food bank is a recipient.
 * Includes alert details, bin info, and response status.
 *
 * TODO: [AUTH0] Verify the requesting user belongs to the same org as the food bank.
 */
router.get('/food-banks/:foodBankId/donations', async (req: Request, res: Response): Promise<void> => {
  const foodBankId = req.params.foodBankId as string;
  const status = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('donation_alert_recipients')
    .select(`
      id, response, notified_at, responded_at,
      donation_alerts (
        id, status, priority, estimated_weight_kg,
        created_at, expires_at, approved_at, picked_up_at,
        bins ( id, label, store_address, latitude, longitude,
               stores ( id, name, city, state ) )
      )
    `)
    .eq('food_bank_id', foodBankId)
    .order('notified_at', { ascending: false })
    .limit(50);

  if (status === 'pending') {
    query = query.eq('response', 'pending');
  } else if (status === 'accepted') {
    query = query.eq('response', 'accepted');
  }

  const { data: donations, error } = await query;

  if (error) {
    console.error('Failed to fetch food bank donations:', error);
    res.status(500).json({ error: 'Failed to fetch food bank donations' });
    return;
  }

  res.json({ data: donations ?? [] });
});

export default router;
