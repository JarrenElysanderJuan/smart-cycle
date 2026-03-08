import { createClient } from '@supabase/supabase-js';
import type { Database } from '@smart-cycle/shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for frontend use (uses anon key, RLS enforced).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/** Base URL for the backend API */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
