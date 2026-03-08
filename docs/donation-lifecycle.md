# Donation Lifecycle

Full end-to-end flow from food detection to confirmed pickup.

## Overview

```
Bin detects low freshness
    → Alert created (pending)
    → Store manager approves (approved_by_store)
    → Donation router ranks food banks (routed)
    → Food bank accepts (accepted)
    → Food bank confirms pickup (picked_up → completed)
```

## The 7 Stages

| # | Stage | Status | Actor | API Endpoint |
|---|-------|--------|-------|-------------|
| 1 | Detection | `pending` | System | POST /telemetry/ingest (auto) |
| 2 | Store Approval | `approved_by_store` | Store Manager | POST /alerts/:id/approve |
| 3 | Routing | `routed` | System | (triggered by approve) |
| 4 | Food Bank Response | `accepted` | Food Bank | POST /alerts/:id/respond |
| 5 | Pickup Scheduled | `accepted` | Both dashboards | — |
| 6 | Pickup Confirmed | `completed` | Food Bank | POST /alerts/:id/confirm-pickup |
| 7 | Expired / Cancelled | `expired`/`cancelled` | System/Store | — |

## Alert Status Enum

```
pending → approved_by_store → routed → accepted → picked_up → completed
                                                                    ↗
pending → expired (timeout)
pending → cancelled (store manager)
```

## Database Columns on `donation_alerts`

| Column | Type | Set At |
|--------|------|--------|
| `status` | alert_status enum | Every stage |
| `approved_by_user_id` | UUID → users | Stage 2 |
| `approved_at` | TIMESTAMPTZ | Stage 2 |
| `resolved_at` | TIMESTAMPTZ | Stage 4 (accept) |
| `picked_up_at` | TIMESTAMPTZ | Stage 6 |
| `completed_at` | TIMESTAMPTZ | Stage 6 |

## What Happens at Each Stage

### Stage 1: Detection
- Bin sends telemetry every 2 hours
- Freshness scoring mock evaluates the reading
- If freshness < 0.7, a `donation_alert` is created with `status = 'pending'`

### Stage 2: Store Approval
- Store manager sees the pending alert on their dashboard
- They click **"Approve Donation"** to confirm the food is ready for donation
- This prevents false alarms from triggering unnecessary food bank notifications
- `POST /api/v1/alerts/:alertId/approve`

### Stage 3: Routing
- Immediately after approval, the system calls `mockRouteDonation()`
- Food banks are ranked by distance, capacity, and availability
- Top 3 food banks get `donation_alert_recipients` records
- Alert status → `routed`

### Stage 4: Food Bank Response
- Food bank coordinator sees incoming donation on their dashboard
- They click **Accept** or **Decline**
- If accepted: alert status → `accepted`, pickup is scheduled
- If declined: next food bank is notified (TODO: implement cascade)
- `POST /api/v1/alerts/:alertId/respond`

### Stage 5: Pickup Scheduled
- Store manager dashboard shows "Pickup incoming" on the alert
- Food bank dashboard shows "Go pick up" with store location
- Both parties coordinate the physical pickup

### Stage 6: Pickup Confirmed
- Food bank coordinator clicks **"Confirm Pickup"**
- Alert status → `completed`
- Food bank `current_inventory_kg` is updated automatically
- `POST /api/v1/alerts/:alertId/confirm-pickup`

### Stage 7: Expired / Cancelled
- If no response within expiry window → `expired`
- If store manager cancels → `cancelled`

## Auth0 Integration Points

All lifecycle endpoints have `TODO: [AUTH0]` markers. When Auth0 is integrated:

1. `POST /alerts/:id/approve` — verify JWT, check `role === 'store_manager'`, derive store_id from user profile
2. `POST /alerts/:id/respond` — verify JWT, check `role === 'food_bank_coordinator'`, derive food_bank_id from user profile
3. `POST /alerts/:id/confirm-pickup` — same as respond
4. `GET /stores/:id/bins` — verify the user belongs to the requesting store's org
5. `GET /food-banks/:id/donations` — verify the user belongs to the requesting food bank's org

## Frontend Dashboard Routes

### Store Manager (`/store-dashboard/*`)
- `/store-dashboard` — Overview with stats and pending approvals
- `/store-dashboard/bins` — Bins grid
- `/store-dashboard/alerts` — Alerts with Approve button
- `/store-dashboard/settings` — Store settings (requires Auth0)

### Food Bank (`/food-bank-dashboard/*`)
- `/food-bank-dashboard` — Overview with capacity gauge
- `/food-bank-dashboard/donations` — Accept / Decline / Confirm Pickup
- `/food-bank-dashboard/inventory` — Inventory management
- `/food-bank-dashboard/settings` — Food bank settings (requires Auth0)

### Landing
- `/login` — Role selection cards (→ Auth0 login redirect later)
