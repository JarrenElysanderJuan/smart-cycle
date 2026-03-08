/**
 * Mock Donation Routing Engine
 *
 * OWNER: Donation Routing Team (external)
 * STATUS: 🟡 Mocked — see docs/mock-contracts.md for the real contract
 *
 * This stub routes by simple straight-line distance (haversine).
 * The real implementation will factor in capacity, response history, and traffic.
 */

export interface DonationAlertForRouting {
  readonly id: string;
  readonly bin_latitude: number;
  readonly bin_longitude: number;
  readonly estimated_weight_kg: number;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface FoodBankCandidate {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly capacity_kg: number;
  readonly is_active: boolean;
}

export interface RoutedFoodBank {
  readonly food_bank_id: string;
  readonly rank: number;
  readonly match_reason: string;
}

/**
 * Haversine distance in km between two lat/lng points.
 */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Routes a donation alert to the nearest eligible food banks.
 *
 * Mock logic:
 * 1. Filter: active + has capacity for the estimated weight
 * 2. Sort by haversine distance (nearest first)
 * 3. Return top candidates
 *
 * @param maxRecipients Maximum number of food banks to route to (default: 3)
 */
export function mockRouteDonation(
  alert: DonationAlertForRouting,
  candidates: ReadonlyArray<FoodBankCandidate>,
  maxRecipients: number = 3
): ReadonlyArray<RoutedFoodBank> {
  return candidates
    .filter((fb) => fb.is_active && fb.capacity_kg >= alert.estimated_weight_kg)
    .map((fb) => ({
      food_bank_id: fb.id,
      name: fb.name,
      distance: haversineKm(
        alert.bin_latitude,
        alert.bin_longitude,
        fb.latitude,
        fb.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxRecipients)
    .map((fb, i) => ({
      food_bank_id: fb.food_bank_id,
      rank: i + 1,
      match_reason: `proximity (mock) — ${fb.distance.toFixed(1)} km`,
    }));
}
