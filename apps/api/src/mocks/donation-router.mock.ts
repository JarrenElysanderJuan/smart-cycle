/**
 * Donation Routing Engine
 *
 * Ported from partner_files/rank_food_banks.py
 * Uses Haversine distance with road adjustment factor,
 * capacity filtering, pickup/service area checks,
 * and weighted scoring: (priority × 100) + (demand × 0.05) − (distance × 2)
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
  /** Current inventory — used to compute available capacity */
  readonly current_inventory_kg?: number;
  /** Whether this food bank can pick up donations */
  readonly pickup_capability?: boolean;
  /** Max pickup distance in km (only relevant if pickup_capability is true) */
  readonly max_pickup_distance_km?: number;
  /** Service area radius in km (only relevant if pickup_capability is false) */
  readonly service_area_radius_km?: number;
  /** Internal priority score (higher = more important) */
  readonly priority_score?: number;
  /** Average weekly demand in kg (higher = more need) */
  readonly avg_weekly_demand_kg?: number;
}

export interface RoutedFoodBank {
  readonly food_bank_id: string;
  readonly rank: number;
  readonly match_reason: string;
}

// ---------------------------------------------------------------------------
// Haversine distance with road-adjustment factor
// Ported from: calculate_routing_distance() in rank_food_banks.py
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371.0;
const ROAD_FACTOR = 1.3; // roads aren't straight lines

function calculateRoutingDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  // square of half the chord length
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

  // angular distance
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Haversine distance × road factor
  return EARTH_RADIUS_KM * c * ROAD_FACTOR;
}

// ---------------------------------------------------------------------------
// Travel time estimate
// Ported from: get_travel_time_mins() in rank_food_banks.py
// ---------------------------------------------------------------------------

export function getTravelTimeMins(distanceKm: number): number {
  // assumes average speed of 40 km/h
  return (distanceKm / 40.0) * 60.0;
}

// ---------------------------------------------------------------------------
// Main ranking function
// Ported from: generate_ranking() in rank_food_banks.py
// ---------------------------------------------------------------------------

/**
 * Defaults for fields the Python algorithm expects but that may not exist
 * in our database yet.  This lets us integrate gracefully without requiring
 * schema changes right now — callers can omit the new fields and still get
 * reasonable routing.
 */
const DEFAULTS = {
  current_inventory_kg: 0,
  pickup_capability: false,
  max_pickup_distance_km: 100000000000,   // generous default so nothing is filtered
  service_area_radius_km: 100000000000,   // generous default
  priority_score: 1.0,
  avg_weekly_demand_kg: 100,
};

export function mockRouteDonation(
  alert: DonationAlertForRouting,
  candidates: ReadonlyArray<FoodBankCandidate>,
  maxRecipients: number = 3
): ReadonlyArray<RoutedFoodBank> {
  interface ScoredCandidate {
    bank: FoodBankCandidate;
    score: number;
    distKm: number;
    canPickup: boolean;
  }

  console.log(`\n🔀 ── DONATION ROUTING ──────────────────────────`);
  console.log(`   Alert ID: ${alert.id}`);
  console.log(`   Origin:   (${alert.bin_latitude}, ${alert.bin_longitude})`);
  console.log(`   Weight:   ${alert.estimated_weight_kg} kg | Priority: ${alert.priority}`);
  console.log(`   Candidates: ${candidates.length} food bank(s)`);
  console.log(`   ─────────────────────────────────────────────`);

  const validCandidates: ScoredCandidate[] = [];

  for (const bank of candidates) {
    const tag = `   [${bank.name}]`;

    if (!bank.is_active) {
      console.log(`${tag} ❌ SKIP — inactive`);
      continue;
    }

    // Available capacity check (Python: capacity_kg − current_inventory_kg)
    const currentInventory = bank.current_inventory_kg ?? DEFAULTS.current_inventory_kg;
    const availableCap = bank.capacity_kg - currentInventory;
    if (availableCap < alert.estimated_weight_kg) {
      console.log(`${tag} ❌ SKIP — insufficient capacity (${availableCap} kg avail, need ${alert.estimated_weight_kg} kg)`);
      continue;
    }

    // Distance calculation with road adjustment
    const distKm = calculateRoutingDistance(
      alert.bin_latitude,
      alert.bin_longitude,
      bank.latitude,
      bank.longitude
    );

    console.log(`${tag} 📍 lat=${bank.latitude}, lng=${bank.longitude} → ${distKm.toFixed(1)} km`);

    // Pickup / service-area radius check
    const canPickup = bank.pickup_capability ?? DEFAULTS.pickup_capability;
    if (canPickup) {
      const maxPickupDist = bank.max_pickup_distance_km ?? DEFAULTS.max_pickup_distance_km;
      if (distKm > maxPickupDist) {
        console.log(`${tag} ❌ SKIP — too far for pickup (${distKm.toFixed(1)} km > max ${maxPickupDist} km)`);
        continue;
      }
    } else {
      const serviceRadius = bank.service_area_radius_km ?? DEFAULTS.service_area_radius_km;
      if (distKm > serviceRadius) {
        console.log(`${tag} ❌ SKIP — outside service area (${distKm.toFixed(1)} km > radius ${serviceRadius} km)`);
        continue;
      }
    }

    // Weighted score: (priority × 100) + (demand × 0.05) − (distance × 2)
    const priorityScore = bank.priority_score ?? DEFAULTS.priority_score;
    const weeklyDemand = bank.avg_weekly_demand_kg ?? DEFAULTS.avg_weekly_demand_kg;
    const score = priorityScore * 100 + weeklyDemand * 0.05 - distKm * 2;

    console.log(`${tag} ✅ PASS — score=${score.toFixed(1)} (priority=${priorityScore}, demand=${weeklyDemand}, dist=${distKm.toFixed(1)}, pickup=${canPickup})`);

    validCandidates.push({ bank, score, distKm, canPickup });
  }

  // Sort by score descending (highest first)
  validCandidates.sort((a, b) => b.score - a.score);

  const results = validCandidates.slice(0, maxRecipients).map((item, index) => ({
    food_bank_id: item.bank.id,
    rank: index + 1,
    match_reason: `Distance: ${item.distKm.toFixed(1)}km, Priority: ${item.bank.priority_score ?? DEFAULTS.priority_score
      }, Pickup: ${item.canPickup}`,
  }));

  console.log(`   ─────────────────────────────────────────────`);
  console.log(`   Results: ${results.length} routed (of ${validCandidates.length} valid)`);
  results.forEach((r) => console.log(`   #${r.rank} → ${r.food_bank_id} — ${r.match_reason}`));
  console.log(`🔀 ── END ROUTING ─────────────────────────────\n`);

  return results;
}
