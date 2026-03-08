import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../lib/supabase.js';
import { mockScoreFreshness, scoreToAlertPriority, mockRouteDonation } from '../mocks/index.js';

const router = Router();

/**
 * POST /api/v1/demo/create-bin
 *
 * Creates a demo bin for a given store.  Skips API-key generation
 * (the key is returned but won't be needed for demo telemetry).
 */
router.post('/create-bin', async (req: Request, res: Response): Promise<void> => {
  const { store_id, label } = req.body as { store_id?: string; label?: string };

  if (!store_id) {
    res.status(400).json({ error: 'store_id is required' });
    return;
  }

  // Look up the store to get the organization_id
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id, organization_id, address, city, state')
    .eq('id', store_id)
    .single();

  if (!store) {
    res.status(404).json({ error: 'Store not found' });
    return;
  }

  const binLabel = label ?? `Bin-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const rawApiKey = `sc_bin_demo_${crypto.randomBytes(16).toString('hex')}`;
  const apiKeyHash = await bcrypt.hash(rawApiKey, 10);

  const { data: bin, error } = await supabaseAdmin
    .from('bins')
    .insert({
      organization_id: store.organization_id,
      store_id: store.id,
      label: binLabel,
      store_address: `${store.address}, ${store.city}, ${store.state}`,
      api_key_hash: apiKeyHash,
      status: 'online',
      location_description: 'Back of store — produce section',
    })
    .select('id, label, status, store_address')
    .single();

  if (error || !bin) {
    console.error('Failed to create demo bin:', error);
    res.status(500).json({ error: 'Failed to create bin' });
    return;
  }

  res.status(201).json({
    data: bin,
    api_key: rawApiKey,
    message: `Bin "${binLabel}" created for your store`,
  });
});

/**
 * POST /api/v1/demo/simulate-telemetry
 *
 * Simulates a telemetry reading from a bin.
 * Accepts a `scenario` parameter:
 *  - "ripe"     → high weight, decaying → generates alert
 *  - "critical" → very high weight, very decayed → critical alert
 *  - "normal"   → low weight, fresh → no alert
 *
 * Skips bin API-key authentication entirely.
 */
router.post('/simulate-telemetry', async (req: Request, res: Response): Promise<void> => {
  const { bin_id, scenario } = req.body as { bin_id?: string; scenario?: string };

  if (!bin_id) {
    res.status(400).json({ error: 'bin_id is required' });
    return;
  }

  // Verify bin exists
  const { data: bin } = await supabaseAdmin
    .from('bins')
    .select('id, label, store_id')
    .eq('id', bin_id)
    .single();

  if (!bin) {
    res.status(404).json({ error: 'Bin not found' });
    return;
  }

  // Generate telemetry based on scenario
  let temperature_c = 4;
  let gas_ppm = 50;
  let weight_kg = 5;
  let battery_level = 85;

  switch (scenario) {
    case 'critical':
      temperature_c = 28;
      gas_ppm = 800;
      weight_kg = 45;
      battery_level = 20;
      break;
    case 'ripe':
      temperature_c = 18;
      gas_ppm = 400;
      weight_kg = 30;
      battery_level = 60;
      break;
    case 'normal':
    default:
      temperature_c = 4;
      gas_ppm = 50;
      weight_kg = 5;
      battery_level = 95;
      break;
  }

  // Score freshness
  const freshnessScore = mockScoreFreshness({
    temperature_c,
    gas_ppm,
    weight_kg,
    time_delta_hours: 2,
  });

  // Persist reading
  const { data: reading, error: insertError } = await supabaseAdmin
    .from('bin_telemetry_readings')
    .insert({
      bin_id,
      recorded_at: new Date().toISOString(),
      temperature_c,
      gas_ppm,
      weight_kg,
      battery_level,
      freshness_score: freshnessScore,
    })
    .select('id')
    .single();

  if (insertError || !reading) {
    console.error('Failed to insert telemetry:', insertError);
    res.status(500).json({ error: 'Failed to insert telemetry' });
    return;
  }

  // Update bin status
  await supabaseAdmin
    .from('bins')
    .update({ last_seen_at: new Date().toISOString(), status: 'online' })
    .eq('id', bin_id);

  // Check alert threshold
  const alertPriority = scoreToAlertPriority(freshnessScore);
  let alertId: string | null = null;

  if (alertPriority !== null) {
    const expiryHours = alertPriority === 'critical' ? 4 : alertPriority === 'high' ? 8 : 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

    const { data: alert } = await supabaseAdmin
      .from('donation_alerts')
      .insert({
        telemetry_reading_id: reading.id,
        bin_id,
        priority: alertPriority,
        estimated_weight_kg: weight_kg,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    alertId = alert?.id ?? null;
  }

  res.json({
    message: `Telemetry simulated (${scenario ?? 'normal'})`,
    reading_id: reading.id,
    freshness_score: freshnessScore,
    alert_generated: alertPriority !== null,
    alert_priority: alertPriority,
    alert_id: alertId,
    telemetry: { temperature_c, gas_ppm, weight_kg, battery_level },
  });
});

/**
 * POST /api/v1/demo/approve-alert
 *
 * Approves a pending alert and routes it to food banks.
 * No JWT required — for demo use only.
 */
router.post('/approve-alert', async (req: Request, res: Response): Promise<void> => {
  const { alert_id } = req.body as { alert_id?: string };

  if (!alert_id) {
    res.status(400).json({ error: 'alert_id is required' });
    return;
  }

  // Fetch the alert
  const { data: alert, error: alertError } = await supabaseAdmin
    .from('donation_alerts')
    .select(`
      *,
      bins!inner ( id, label, store_address, latitude, longitude, organization_id, store_id )
    `)
    .eq('id', alert_id)
    .single();

  if (alertError || !alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  if (alert.status !== 'pending') {
    res.status(409).json({ error: `Alert already '${alert.status}'` });
    return;
  }

  // Approve
  await supabaseAdmin
    .from('donation_alerts')
    .update({
      status: 'approved_by_store',
      approved_at: new Date().toISOString(),
    })
    .eq('id', alert_id);

  // Route to food banks
  const { data: foodBanks } = await supabaseAdmin
    .from('food_banks')
    .select('id, name, latitude, longitude, capacity_kg, is_active')
    .eq('is_active', true);

  let routedCount = 0;

  if (foodBanks && foodBanks.length > 0) {
    const bin = alert.bins as unknown as {
      latitude: number | null; longitude: number | null;
    };

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

    const topRecipients = ranked.slice(0, 3);
    routedCount = topRecipients.length;

    if (topRecipients.length > 0) {
      await supabaseAdmin
        .from('donation_alert_recipients')
        .insert(
          topRecipients.map((r) => ({
            donation_alert_id: alert_id,
            food_bank_id: r.food_bank_id,
          }))
        );
    }

    await supabaseAdmin
      .from('donation_alerts')
      .update({ status: 'routed' })
      .eq('id', alert_id);
  }

  res.json({
    message: 'Alert approved and routed',
    alert_id,
    status: routedCount > 0 ? 'routed' : 'approved_by_store',
    routed_to_food_banks: routedCount,
  });
});

/**
 * POST /api/v1/demo/make-admin
 *
 * Sets a user's role to admin in the user_profiles table.
 * For hackathon setup only.
 */
router.post('/make-admin', async (req: Request, res: Response): Promise<void> => {
  const { auth0_id } = req.body as { auth0_id?: string };

  if (!auth0_id) {
    res.status(400).json({ error: 'auth0_id is required' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from('user_profiles')
    .upsert(
      {
        auth0_id,
        role: 'admin',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth0_id' }
    )
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ message: 'Admin role assigned', data });
});

export default router;
