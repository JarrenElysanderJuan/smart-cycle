/**
 * Mock Freshness Scoring Engine
 *
 * OWNER: Freshness Scoring Team (external)
 * STATUS: 🟡 Mocked — see docs/mock-contracts.md for the real contract
 *
 * This stub returns a deterministic score based on simple linear interpolation.
 * The real implementation will use ML models trained on decay curves.
 */

export interface FreshnessScorerInput {
  readonly temperature_c: number;
  readonly gas_ppm: number;
  readonly weight_kg: number;
  readonly time_delta_hours: number;
}

export type FreshnessScore = number; // 0.0 – 1.0

/**
 * Computes a mock freshness score.
 *
 * - Higher temperature → lower score (food decays faster)
 * - Higher gas_ppm → lower score (ethylene = decomposition)
 * - time_delta_hours is currently unused in the mock but will matter in the real impl
 *
 * @returns A score between 0.0 (spoiled) and 1.0 (perfectly fresh)
 */
export function mockScoreFreshness(input: FreshnessScorerInput): FreshnessScore {
  // Temperature factor: ideal range 0–4°C, decays toward 0 at 32°C+
  const tempFactor = Math.max(0, Math.min(1, 1 - (input.temperature_c - 2) / 30));

  // Gas factor: 0 ppm = fresh, 500+ ppm = spoiled
  const gasFactor = Math.max(0, Math.min(1, 1 - input.gas_ppm / 500));

  // Simple average (real impl would weight these differently)
  const raw = (tempFactor + gasFactor) / 2;

  // Round to 2 decimal places
  return Math.round(raw * 100) / 100;
}

/**
 * Determines the alert priority based on freshness score.
 */
export function scoreToAlertPriority(
  score: FreshnessScore
): 'critical' | 'high' | 'medium' | 'low' | null {
  if (score < 0.3) return 'critical';
  if (score < 0.5) return 'high';
  if (score < 0.7) return 'medium';
  // Score >= 0.7 means food is still reasonably fresh — no alert needed
  return null;
}
