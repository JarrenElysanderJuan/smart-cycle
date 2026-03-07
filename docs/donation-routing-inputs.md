# Donation Routing Algorithm — Input Data Specification

This document outlines the data structures available to the Donation Routing Engine. The routing algorithm's job is to take a newly triggered **Donation Alert** (from a grocery store bin) and a list of **Active Food Banks** in the network, and return a ranked list of the best food banks to notify.

Since the routing engine may be written in any language (Python, Go, Node, etc.), this specification describes the data in a language-agnostic, JSON-compatible format.

---

## 1. The Donation Alert Input

When a bin triggers an alert (because food is nearing its freshness limit or the bin is full), the routing engine receives the following data object representing the alert and its physical origin.

### `AlertData` Object

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Unique identifier for the donation alert. |
| `priority` | `String` | Severity of the alert (`low`, `medium`, `high`, `critical`). Critical usually implies the food will spoil very soon. |
| `expires_at` | `Timestamp` | ISO-8601 timestamp after which the donation is no longer viable. |
| `estimated_weight_kg` | `Float` | The current weight of the food in the bin. |
| `freshness_score` | `Float` | The calculated freshness of the food (0.0 to 1.0, where 1.0 is perfectly fresh). |

### `OriginData` Object (Nested inside Alert)
The physical location where the food is currently waiting.

| Field | Type | Description |
|---|---|---|
| `store_name` | `String` | Name of the grocery store (e.g., "Whole Foods Market"). |
| `store_type` | `String` | Type of store (e.g., "supermarket", "bakery", "produce_market"). Useful for inferring food types. |
| `latitude` | `Float` | Geographical latitude of the store. |
| `longitude` | `Float` | Geographical longitude of the store. |
| `address` | `String` | Full street address of the store. |

---

## 2. The Food Bank Candidates Input

The routing engine will receive an array of active food banks in the network. The algorithm must filter, score, and rank these candidates based on how well they match the alert.

### `FoodBank` Object

#### General & Location
| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Unique identifier for the food bank. |
| `name` | `String` | Name of the food bank. |
| `latitude` | `Float` | Geographical latitude. |
| `longitude` | `Float` | Geographical longitude. |

#### Logistics & Capabilities
| Field | Type | Description |
|---|---|---|
| `pickup_capability` | `Boolean` | `true` if the food bank has vehicles/volunteers to pick up the donation. `false` if the donation must be delivered to them. |
| `max_pickup_distance_km` | `Float` | If `pickup_capability` is true, the maximum distance (in kilometers) they are willing to drive. |
| `service_area_radius_km` | `Float` | The maximum distance (in kilometers) from which they will accept deliveries. |
| `operating_hours` | `Object` | Key-value pairs of days and open/close times (e.g., `{"monday": {"open": "09:00", "close": "17:00"}}`). |

#### Capacity & Needs
| Field | Type | Description |
|---|---|---|
| `capacity_kg` | `Float` | Maximum physical storage capacity of the food bank. |
| `current_inventory_kg` | `Float` | Current amount of food stored. (Available space = `capacity_kg - current_inventory_kg`). |
| `avg_weekly_demand_kg` | `Float` | Historical data on how much food this location distributes per week. |
| `priority_score` | `Float` | An administrative score (0.0 to 1.0) indicating how badly this food bank needs donations right now. Higher is more urgent. |

#### Food Matching
| Field | Type | Description |
|---|---|---|
| `accepted_food_types` | `Array<String>` | Types of food they accept (e.g., `["produce", "bakery", "canned"]`). |
| `dietary_restrictions` | `Array<String>` | Specialized diets they cater to (e.g., `["halal", "kosher", "vegan"]`). |

---

## Example Output Expected from Routing Engine

The routing engine should output an ordered array of matches. The backend will use this to notify the food banks in order (e.g., notify the 1st, wait 15 minutes, notify the 2nd).

```json
[
  {
    "food_bank_id": "uuid-of-best-match",
    "rank": 1,
    "match_reason": "Distance: 2.1km, High Demand, Can Pickup"
  },
  {
    "food_bank_id": "uuid-of-second-best-match",
    "rank": 2,
    "match_reason": "Distance: 5.4km, Capacity Available"
  }
]
```

## Key Algorithm Considerations
When writing the routing logic, the team should consider:
1. **Hard Constraints**: Filter out food banks where `available_capacity < alert.estimated_weight_kg`.
2. **Logistics**: If the food bank has `pickup_capability = true`, ensure the distance between the store and food bank is `<= max_pickup_distance_km`.
3. **Soft Constraints**: Weight the final score by distance, the food bank's current `priority_score`, and their `avg_weekly_demand_kg`.
