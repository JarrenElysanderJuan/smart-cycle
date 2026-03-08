import { describe, it, expect } from 'vitest';
import { mockScoreFreshness, scoreToAlertPriority } from '../src/mocks/freshness-scorer.mock.js';

describe('mockScoreFreshness', () => {
  it('returns 1.0 for ideal conditions (low temp, no gas)', () => {
    const score = mockScoreFreshness({
      temperature_c: 2,
      gas_ppm: 0,
      weight_kg: 10,
      time_delta_hours: 2,
    });
    expect(score).toBe(1);
  });

  it('returns a low score for high temperature and gas', () => {
    const score = mockScoreFreshness({
      temperature_c: 30,
      gas_ppm: 400,
      weight_kg: 10,
      time_delta_hours: 2,
    });
    expect(score).toBeLessThan(0.2);
  });

  it('clamps to 0 for extreme values', () => {
    const score = mockScoreFreshness({
      temperature_c: 50,
      gas_ppm: 1000,
      weight_kg: 5,
      time_delta_hours: 24,
    });
    expect(score).toBe(0);
  });

  it('returns scores between 0 and 1', () => {
    const testCases = [
      { temperature_c: 5, gas_ppm: 50, weight_kg: 10, time_delta_hours: 2 },
      { temperature_c: 15, gas_ppm: 150, weight_kg: 20, time_delta_hours: 6 },
      { temperature_c: 25, gas_ppm: 300, weight_kg: 5, time_delta_hours: 12 },
    ];

    for (const input of testCases) {
      const score = mockScoreFreshness(input);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

describe('scoreToAlertPriority', () => {
  it('returns critical for scores < 0.3', () => {
    expect(scoreToAlertPriority(0.1)).toBe('critical');
    expect(scoreToAlertPriority(0.29)).toBe('critical');
  });

  it('returns high for scores 0.3–0.5', () => {
    expect(scoreToAlertPriority(0.3)).toBe('high');
    expect(scoreToAlertPriority(0.49)).toBe('high');
  });

  it('returns medium for scores 0.5–0.7', () => {
    expect(scoreToAlertPriority(0.5)).toBe('medium');
    expect(scoreToAlertPriority(0.69)).toBe('medium');
  });

  it('returns null for scores >= 0.7 (no alert)', () => {
    expect(scoreToAlertPriority(0.7)).toBeNull();
    expect(scoreToAlertPriority(1.0)).toBeNull();
  });
});
