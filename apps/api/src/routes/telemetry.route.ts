import { Router } from 'express';
import type { Request, Response } from 'express';
import { BinTelemetryPayloadSchema } from '../schemas/telemetry.schema.js';
import { authenticateBinApiKey } from '../middleware/bin-auth.middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { mockScoreFreshness, scoreToAlertPriority } from '../mocks/index.js';

const router = Router();

/**
 * POST /api/v1/telemetry
 *
 * Receives telemetry data from an IoT smart bin.
 * Pipeline: validate API key → validate payload → score freshness → persist → maybe alert
 */
router.post(
  '/',
  authenticateBinApiKey,
  async (req: Request, res: Response): Promise<void> => {
    // 1. Validate payload with Zod
    const parseResult = BinTelemetryPayloadSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid telemetry payload',
        details: parseResult.error.issues,
      });
      return;
    }

    const payload = parseResult.data;

    // 2. Compute freshness score (MOCK)
    // time_delta_hours: use 2 hours as default since bins report every 2 hours
    const freshnessScore = mockScoreFreshness({
      temperature_c: payload.temperature_c,
      gas_ppm: payload.gas_ppm,
      weight_kg: payload.weight_kg,
      time_delta_hours: 2,
    });

    // 3. Persist telemetry reading
    const { data: reading, error: insertError } = await supabaseAdmin
      .from('bin_telemetry_readings')
      .insert({
        bin_id: payload.bin_id,
        recorded_at: payload.timestamp,
        temperature_c: payload.temperature_c,
        gas_ppm: payload.gas_ppm,
        weight_kg: payload.weight_kg,
        battery_level: payload.battery_level,
        freshness_score: freshnessScore,
      })
      .select('id')
      .single();

    if (insertError || !reading) {
      console.error('Failed to insert telemetry reading:', insertError);
      res.status(500).json({ error: 'Failed to persist telemetry reading' });
      return;
    }

    // 4. Update bin's last_seen_at
    await supabaseAdmin
      .from('bins')
      .update({ last_seen_at: new Date().toISOString(), status: 'online' })
      .eq('id', payload.bin_id);

    // 5. Check if a donation alert should be generated
    const alertPriority = scoreToAlertPriority(freshnessScore);

    if (alertPriority !== null) {
      // Calculate expiry: higher priority = shorter window
      const expiryHours = alertPriority === 'critical' ? 4 : alertPriority === 'high' ? 8 : 24;
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

      const { error: alertError } = await supabaseAdmin
        .from('donation_alerts')
        .insert({
          telemetry_reading_id: reading.id,
          bin_id: payload.bin_id,
          priority: alertPriority,
          estimated_weight_kg: payload.weight_kg,
          status: 'pending',
          expires_at: expiresAt,
        });

      if (alertError) {
        console.error('Failed to create donation alert:', alertError);
        // Don't fail the whole request — the telemetry was already saved
      }
    }

    res.status(201).json({
      message: 'Telemetry received',
      reading_id: reading.id,
      freshness_score: freshnessScore,
      alert_generated: alertPriority !== null,
      alert_priority: alertPriority,
    });
  }
);

export default router;
