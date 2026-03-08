import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase.js';

const execPromise = util.promisify(exec);
const router = Router();

/**
 * POST /api/v1/demo/camera/classify
 *
 * Spawns the partner's python script to capture and classify an image.
 * Maps the result to a freshness score & generates alerts if ripe or rotten.
 */
router.post('/classify', async (req: Request, res: Response): Promise<void> => {
  const { bin_id } = req.body;
  
  if (!bin_id) {
    res.status(400).json({ error: 'bin_id is required' });
    return;
  }

  try {
    // The python script expects to be run from the classification folder since it loads 'models/best_model.pth'
    const classificationDir = path.resolve(process.cwd(), '../../partner_files/classification');
    const pythonExecutable = path.resolve(process.cwd(), '../../.venv/Scripts/python.exe');
    
    // Spawn python script using the virtual environment
    const { stdout, stderr } = await execPromise(`"${pythonExecutable}" camera.py`, { cwd: classificationDir });
    
    // The python script might print download logs (e.g. ResNet weights). We only want the last line.
    const lines = stdout.trim().split('\n').filter(line => line.trim().length > 0);
    const lastLine = lines.pop();
    const prediction = lastLine ? lastLine.trim().toLowerCase() : '';

    // Mapping classes: 'unripe', 'ripe', 'overripe', 'rotten'
    let freshnessScore = 1.0;
    let alertPriority: 'low' | 'medium' | 'high' | 'critical' | null = null;

    if (prediction.includes('unripe')) {
      freshnessScore = 1.0;
    } else if (prediction.includes('ripe') && !prediction.includes('overripe')) {
      freshnessScore = 0.4;
      alertPriority = 'high';
    } else if (prediction.includes('overripe')) {
      freshnessScore = 0.1;
      alertPriority = 'critical';
    } else if (prediction.includes('rotten')) {
      freshnessScore = 0.0;
      alertPriority = 'critical';
    } else {
      res.status(500).json({ error: `Script returned unrecognized prediction: ${prediction}` });
      return;
    }

    // Insert telemetry reading mapped from prediction
    const { data: reading, error: insertError } = await supabaseAdmin
      .from('bin_telemetry_readings')
      .insert({
        bin_id,
        temperature_c: 20.0,
        gas_ppm: alertPriority ? 15.0 : 2.0,
        weight_kg: 10.0,
        battery_level: 95,
        freshness_score: freshnessScore,
        recorded_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !reading) {
      console.error('Failed to insert telemetry for camera demo:', insertError);
      res.status(500).json({ error: 'Failed to insert telemetry' });
      return;
    }

    // Update bin status
    await supabaseAdmin
      .from('bins')
      .update({ last_seen_at: new Date().toISOString(), status: 'online' })
      .eq('id', bin_id);

    // Create alert if priority is valid
    let alertId: string | null = null;
    if (alertPriority) {
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const { data: alert } = await supabaseAdmin
        .from('donation_alerts')
        .insert({
          telemetry_reading_id: reading.id,
          bin_id,
          priority: alertPriority,
          estimated_weight_kg: 10.0,
          status: 'pending',
          expires_at: expiresAt,
        })
        .select('id')
        .single();

      alertId = alert?.id ?? null;
      console.log(`🚨 Camera classification yielded ${prediction}. Generated alert ${alertId}`);
    } else {
      console.log(`✅ Camera classification yielded ${prediction}. Bin is optimal.`);
    }

    res.json({
      message: 'Camera classification complete',
      prediction,
      freshness_score: freshnessScore,
      alert_generated: alertPriority !== null,
      alert_priority: alertPriority,
      alert_id: alertId,
      reading_id: reading.id,
    });

  } catch (err: any) {
    console.error('Camera classification failed:', err);
    res.status(500).json({ error: err.message || 'Classification execution failed' });
  }
});

export default router;
