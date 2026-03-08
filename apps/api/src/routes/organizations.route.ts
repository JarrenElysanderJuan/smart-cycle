import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(255),
});

/**
 * POST /api/v1/organizations
 *
 * Create a new organization (auto-generates slug, defaults to free tier).
 * Called during onboarding when a new store/food bank registers.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateOrgSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    return;
  }

  const { name } = parseResult.data;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .insert({ name, slug, subscription_tier: 'free' })
    .select('id, name, slug')
    .single();

  if (error) {
    console.error('Failed to create organization:', error);
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ data });
});

export default router;
