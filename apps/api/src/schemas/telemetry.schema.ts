import { z } from 'zod';

/**
 * Zod schema for validating incoming bin telemetry payloads.
 * Matches the hardware contract exactly.
 */
export const BinTelemetryPayloadSchema = z.object({
  bin_id: z.string().uuid('bin_id must be a valid UUID'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 string' }),
  temperature_c: z.number().finite('temperature_c must be a finite number'),
  gas_ppm: z.number().nonnegative('gas_ppm must be non-negative').finite(),
  weight_kg: z.number().nonnegative('weight_kg must be non-negative').finite(),
  battery_level: z
    .number()
    .int('battery_level must be an integer')
    .min(0, 'battery_level must be >= 0')
    .max(100, 'battery_level must be <= 100'),
});

export type BinTelemetryPayload = z.infer<typeof BinTelemetryPayloadSchema>;

/**
 * Zod schema for bin registration (admin creates a new bin).
 */
export const CreateBinSchema = z.object({
  organization_id: z.string().uuid(),
  label: z.string().min(1, 'label is required').max(255),
  location_description: z.string().max(500).optional(),
  store_address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CreateBinPayload = z.infer<typeof CreateBinSchema>;

/**
 * Zod schema for environment variable validation.
 * App crashes on startup if these are missing.
 */
export const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
