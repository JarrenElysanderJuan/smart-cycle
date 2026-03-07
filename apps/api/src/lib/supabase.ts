import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from monorepo root (two levels up from apps/api/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@smart-cycle/shared';
import { EnvSchema } from '../schemas/telemetry.schema.js';

/**
 * Validate environment variables at import time.
 * The app will crash on startup if these are missing — by design.
 */
const env = EnvSchema.parse(process.env);

/**
 * Supabase client with service role key.
 * Used for telemetry ingestion and background jobs (bypasses RLS).
 *
 * ⚠️ NEVER expose this client to the frontend or include the service role key in client bundles.
 */
export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export { env };
