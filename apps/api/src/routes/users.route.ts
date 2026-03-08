import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const CreateProfileSchema = z.object({
  auth0_id: z.string().min(1),
  role: z.enum(['store_manager', 'food_bank_coordinator', 'admin']),
  store_id: z.string().uuid().optional(),
  food_bank_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
});

/**
 * POST /api/v1/users/profile
 *
 * Creates or updates a user profile with role + entity associations.
 * Called during onboarding so users get immediate dashboard access.
 */
router.post('/profile', async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid payload', details: parseResult.error.issues });
    return;
  }

  const { auth0_id, role, store_id, food_bank_id, organization_id } = parseResult.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- user_profiles not in generated types yet
  const { data, error } = await (supabaseAdmin as any)
    .from('user_profiles')
    .upsert(
      {
        auth0_id,
        role,
        store_id: store_id ?? null,
        food_bank_id: food_bank_id ?? null,
        organization_id: organization_id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth0_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to save user profile:', error);
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ data });
});

/**
 * GET /api/v1/users/profile/:auth0Id
 *
 * Retrieves a user profile by Auth0 ID.
 * Used by frontend getUserClaims as a fallback when JWT claims are missing.
 */
router.get('/profile/:auth0Id', async (req: Request, res: Response): Promise<void> => {
  const { auth0Id } = req.params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- user_profiles table not yet in generated types
  const { data, error } = await (supabaseAdmin as any)
    .from('user_profiles')
    .select('*')
    .eq('auth0_id', auth0Id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  res.json({ data });
});

export default router;
