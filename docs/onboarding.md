# Developer Onboarding

> Get up and running with the Smart Cycle platform in 15 minutes.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 20.x | Runtime |
| **npm** | ≥ 10.x | Package manager |
| **Git** | Latest | Version control |
| **Supabase CLI** | Latest | Local development & migrations |
| **Auth0 Account** | — | Authentication provider |

---

## 1. Clone & Install

```bash
git clone https://github.com/<org>/smart-cycle.git
cd smart-cycle
npm install
```

---

## 2. Environment Setup

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

**Required variables:**

| Variable | Description | Where to find |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Supabase Dashboard → Settings → API |
| `AUTH0_DOMAIN` | Auth0 tenant domain (e.g., `yourapp.auth0.com`) | Auth0 Dashboard → Applications |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | Auth0 Dashboard → Applications |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | Auth0 Dashboard → Applications |
| `AUTH0_AUDIENCE` | Auth0 API audience identifier | Auth0 Dashboard → APIs |

---

## 3. Database Setup

Migrations are managed via Supabase:

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Run all migrations
supabase db push
```

---

## 4. Start Development Servers

```bash
# Backend API
cd apps/api && npm run dev

# Frontend (in a separate terminal)
cd apps/web && npm run dev
```

---

## 5. Test a Bin Telemetry POST

```bash
curl -X POST http://localhost:3000/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <bin-api-key>" \
  -d '{
    "bin_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-03-07T18:00:00Z",
    "temperature_c": 4.2,
    "gas_ppm": 12.5,
    "weight_kg": 23.1,
    "battery_level": 87
  }'
```

---

## Project Structure

See [architecture.md](./architecture.md) for the full system diagram.  
See [`.agent/rules.md`](../.agent/rules.md) §8 for the directory layout.

---

## Key Documentation

| Document | What it covers |
|---|---|
| [architecture.md](./architecture.md) | System design & tech stack |
| [data-flow.md](./data-flow.md) | Telemetry pipeline & offline detection |
| [api-reference.md](./api-reference.md) | All API endpoints |
| [mock-contracts.md](./mock-contracts.md) | Interfaces for externally-owned modules |
| [database.md](./database.md) | Schema & relationships |
