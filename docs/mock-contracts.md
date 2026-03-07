# Mock Contracts

> These modules are **owned by external teams**. We define the interface contracts here and use mock/stub implementations until the real modules are delivered.

---

## 1. Freshness Scoring Engine

**Owner:** Freshness Scoring Team  
**Status:** 🟡 Mocked

### Contract

```typescript
/**
 * Computes a freshness score for a bin's contents based on sensor data.
 *
 * @param input - Telemetry data and time context
 * @returns A freshness score between 0.0 (spoiled) and 1.0 (perfectly fresh)
 *
 * Business rules (to be implemented by the scoring team):
 * - Higher temperature → faster decay → lower score
 * - Higher gas_ppm (ethylene/decomposition) → lower score
 * - Rapid weight decrease may indicate removal, not spoilage
 * - time_delta_hours is time since the bin was last restocked (or first reading)
 */
interface FreshnessScorerInput {
  readonly temperature_c: number;
  readonly gas_ppm: number;
  readonly weight_kg: number;
  readonly time_delta_hours: number;
}

type FreshnessScore = number; // 0.0 – 1.0

function scoreFreshness(input: FreshnessScorerInput): FreshnessScore;
```

### Mock Implementation

```typescript
/** Returns a simple linear decay based on temperature and gas. */
function mockScoreFreshness(input: FreshnessScorerInput): FreshnessScore {
  const tempFactor = Math.max(0, 1 - (input.temperature_c - 2) / 30);
  const gasFactor = Math.max(0, 1 - input.gas_ppm / 500);
  return Math.round(((tempFactor + gasFactor) / 2) * 100) / 100;
}
```

### Integration Points
- Called in the telemetry ingestion pipeline after validation
- Result stored in `bin_telemetry_readings.freshness_score`
- Thresholds for donation alert generation:
  - `< 0.3` → `critical` priority alert
  - `0.3–0.5` → `high` priority
  - `0.5–0.7` → `medium` priority

---

## 2. Donation Routing Engine

**Owner:** Donation Routing Team  
**Status:** 🟡 Mocked

### Contract

```typescript
/**
 * Selects and ranks food banks that should receive a donation alert.
 *
 * @param alert - The donation alert to route
 * @param candidates - All active food banks for the organization
 * @returns Ordered list of food banks to notify (best match first)
 *
 * Business rules (to be implemented by the routing team):
 * - Consider proximity (bin lat/lng vs food bank lat/lng)
 * - Consider remaining capacity (capacity_kg)
 * - Consider historical response rates
 * - Handle tie-breaking (TBD by routing team)
 */
interface DonationAlertForRouting {
  readonly id: string;
  readonly bin_latitude: number;
  readonly bin_longitude: number;
  readonly estimated_weight_kg: number;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

interface FoodBankCandidate {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly capacity_kg: number;
  readonly is_active: boolean;
}

interface RoutedFoodBank {
  readonly food_bank_id: string;
  readonly rank: number;
  readonly match_reason: string;
}

function routeDonation(
  alert: DonationAlertForRouting,
  candidates: ReadonlyArray<FoodBankCandidate>
): ReadonlyArray<RoutedFoodBank>;
```

### Mock Implementation

```typescript
/** Simple proximity-based routing: sorts by straight-line distance. */
function mockRouteDonation(
  alert: DonationAlertForRouting,
  candidates: ReadonlyArray<FoodBankCandidate>
): ReadonlyArray<RoutedFoodBank> {
  return candidates
    .filter(fb => fb.is_active && fb.capacity_kg >= alert.estimated_weight_kg)
    .map(fb => ({
      food_bank_id: fb.id,
      rank: 0, // will be set after sort
      match_reason: 'proximity (mock)',
      _distance: haversine(alert.bin_latitude, alert.bin_longitude, fb.latitude, fb.longitude),
    }))
    .sort((a, b) => a._distance - b._distance)
    .map((fb, i) => ({ food_bank_id: fb.food_bank_id, rank: i + 1, match_reason: fb.match_reason }));
}
```

### Integration Points
- Called by the alert generator after a donation alert is created
- Output persisted to `donation_alert_recipients` table
- Maximum recipients per alert: configurable (default: 3)

---

## How to Replace Mocks with Real Implementations

1. **Implement the contract** exactly as defined above (same types, same function signature).
2. **Export the real function** from the module.
3. **Swap the import** in the telemetry pipeline — the mock and real functions are interchangeable because they share the same interface.
4. **Feature flag (recommended):** Use an env var like `USE_REAL_SCORER=true` to toggle between mock and real at runtime during transition.
5. **Run the existing unit tests** — they validate contract compliance, not implementation details.
