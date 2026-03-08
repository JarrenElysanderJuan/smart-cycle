import { describe, it, expect } from 'vitest';
import { BinTelemetryPayloadSchema, CreateBinSchema, EnvSchema } from '../src/schemas/telemetry.schema.js';

describe('BinTelemetryPayloadSchema', () => {
  it('validates a correct payload', () => {
    const payload = {
      bin_id: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: '2026-03-07T18:00:00Z',
      temperature_c: 4.2,
      gas_ppm: 12.5,
      weight_kg: 23.1,
      battery_level: 87,
    };
    const result = BinTelemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID bin_id', () => {
    const payload = {
      bin_id: 'not-a-uuid',
      timestamp: '2026-03-07T18:00:00Z',
      temperature_c: 4.2,
      gas_ppm: 12.5,
      weight_kg: 23.1,
      battery_level: 87,
    };
    const result = BinTelemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects battery_level > 100', () => {
    const payload = {
      bin_id: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: '2026-03-07T18:00:00Z',
      temperature_c: 4.2,
      gas_ppm: 12.5,
      weight_kg: 23.1,
      battery_level: 101,
    };
    const result = BinTelemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects negative weight', () => {
    const payload = {
      bin_id: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: '2026-03-07T18:00:00Z',
      temperature_c: 4.2,
      gas_ppm: 12.5,
      weight_kg: -1,
      battery_level: 50,
    };
    const result = BinTelemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects invalid ISO timestamp', () => {
    const payload = {
      bin_id: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: 'not-a-date',
      temperature_c: 4.2,
      gas_ppm: 12.5,
      weight_kg: 23.1,
      battery_level: 50,
    };
    const result = BinTelemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const payload = { bin_id: '550e8400-e29b-41d4-a716-446655440000' };
    const result = BinTelemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe('CreateBinSchema', () => {
  it('validates a correct bin creation payload', () => {
    const payload = {
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      label: 'Dairy Aisle — Store #42',
      latitude: 40.7128,
      longitude: -74.006,
    };
    const result = CreateBinSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects empty label', () => {
    const payload = {
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      label: '',
    };
    const result = CreateBinSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe('EnvSchema', () => {
  it('validates a correct env config', () => {
    const env = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      SUPABASE_ANON_KEY: 'test-anon-key',
      PORT: '3001',
      NODE_ENV: 'development',
    };
    const result = EnvSchema.safeParse(env);
    expect(result.success).toBe(true);
  });

  it('uses default PORT when not provided', () => {
    const env = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      SUPABASE_ANON_KEY: 'test-anon-key',
    };
    const result = EnvSchema.safeParse(env);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3001);
    }
  });
});
