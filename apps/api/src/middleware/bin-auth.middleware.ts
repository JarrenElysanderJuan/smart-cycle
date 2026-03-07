import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Middleware: Authenticate a bin by its unique API key.
 *
 * Expects: Authorization: Bearer <api-key>
 * On success: attaches `req.binId` (the authenticated bin's UUID)
 * On failure: returns 401
 */
export async function authenticateBinApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer " prefix

  // Extract bin_id from the request body to look up the correct bin
  const binId = req.body?.bin_id as string | undefined;

  if (!binId) {
    res.status(400).json({ error: 'bin_id is required in the request body' });
    return;
  }

  // Fetch the bin's API key hash from DB
  const { data: bin, error } = await supabaseAdmin
    .from('bins')
    .select('id, api_key_hash, organization_id, status')
    .eq('id', binId)
    .single();

  if (error || !bin) {
    res.status(404).json({ error: `Bin not found: ${binId}` });
    return;
  }

  // Verify the API key against the stored hash
  const isValid = await bcrypt.compare(apiKey, bin.api_key_hash);

  if (!isValid) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  // Attach bin info to the request for downstream handlers
  (req as BinAuthenticatedRequest).binId = bin.id;
  (req as BinAuthenticatedRequest).organizationId = bin.organization_id;

  next();
}

/**
 * Extended Request type with authenticated bin info.
 */
export interface BinAuthenticatedRequest extends Request {
  binId: string;
  organizationId: string;
}
