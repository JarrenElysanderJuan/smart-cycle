# API Reference

> All endpoints are versioned under `/api/v1/`. Auth via Auth0 JWT (dashboard) or per-bin API key (telemetry).

---

## Telemetry

### `POST /api/v1/telemetry`

**Auth:** Per-bin API key (`Authorization: Bearer <bin_api_key>`)

Receives telemetry data from a smart bin.

**Request Body:**
```json
{
  "bin_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-07T18:00:00Z",
  "temperature_c": 4.2,
  "gas_ppm": 12.5,
  "weight_kg": 23.1,
  "battery_level": 87
}
```

**Responses:**

| Status | Description |
|---|---|
| `201` | Reading stored successfully |
| `400` | Validation error (Zod) — returns `{ error: string, details: ZodIssue[] }` |
| `401` | Invalid or missing API key |
| `404` | `bin_id` not registered |

---

## Bins

### `GET /api/v1/bins`
**Auth:** Auth0 JWT (admin, store_manager)  
Lists all bins for the authenticated user's organization. Paginated via cursor.

### `POST /api/v1/bins`
**Auth:** Auth0 JWT (admin only)  
Registers a new bin. Returns the generated API key (shown **once**).

### `GET /api/v1/bins/:binId`
**Auth:** Auth0 JWT (admin, store_manager)  
Get bin details including status and last telemetry timestamp.

### `PATCH /api/v1/bins/:binId`
**Auth:** Auth0 JWT (admin only)  
Update bin metadata (label, location, status).

### `POST /api/v1/bins/:binId/rotate-key`
**Auth:** Auth0 JWT (admin only)  
Rotate the bin's API key. Returns the new key (shown **once**). Old key is immediately invalidated.

---

## Donation Alerts

### `GET /api/v1/alerts`
**Auth:** Auth0 JWT (admin, store_manager, food_bank_coordinator)  
List donation alerts. Filtered by status, priority, date range. Scoped to user's org.

### `GET /api/v1/alerts/:alertId`
**Auth:** Auth0 JWT  
Get alert details including matched food banks and their responses.

### `POST /api/v1/alerts/:alertId/respond`
**Auth:** Auth0 JWT (food_bank_coordinator)  
Accept or decline a donation alert.

**Request Body:**
```json
{
  "response": "accepted"
}
```

---

## Health

### `GET /health`
**Auth:** None  
Returns `200 OK` with service status.

---

*This document will be updated as new endpoints are added. See `.agent/rules.md` §11 for documentation maintenance policy.*
