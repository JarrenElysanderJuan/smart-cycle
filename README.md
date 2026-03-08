# ♻️ Smart Cycle

**B2B Smart Food Waste Prevention Platform**

Smart Cycle connects grocery stores to local food banks using IoT smart bins that monitor food freshness in real-time. When food approaches spoilage, the system automatically routes potential donations to nearby food banks — reducing waste and fighting hunger.

---

## 🏗️ Architecture

```
IoT Smart Bins → Express API → Supabase PostgreSQL → Next.js Dashboards
                     ↕                                      ↕
              Auth0 (RBAC)                           Role-Based Views
```

| Layer | Technology |
|-------|-----------|
| **Database** | Supabase PostgreSQL |
| **Backend API** | Node.js / Express / TypeScript |
| **Frontend** | Next.js 15 + Tailwind CSS v4 |
| **Auth** | Auth0 (JWT + RBAC) |
| **IoT Auth** | Per-bin API keys (bcrypt hashed) |

## 📁 Project Structure

```
smart-cycle/
├── apps/
│   ├── api/              # Express REST API (port 3001)
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/# Rate limiter, request logger, bin auth
│   │   │   ├── mocks/    # Freshness scoring & donation routing stubs
│   │   │   ├── lib/      # Supabase client
│   │   │   └── schemas/  # Zod validation schemas
│   │   └── tests/        # Vitest unit tests
│   └── web/              # Next.js dashboard (port 3000)
│       └── src/app/
│           ├── (store)/store-dashboard/      # 🏪 Store Manager portal
│           ├── (food-bank)/food-bank-dashboard/ # 🏦 Food Bank portal
│           ├── login/                         # Role selection
│           ├── bins/                          # Bin management
│           ├── alerts/                        # Alert management
│           ├── stores/register/               # Store registration
│           └── food-banks/register/           # Food bank registration
├── packages/
│   └── shared/           # Shared TypeScript types (database.types.ts)
├── docs/                 # Project documentation
│   ├── architecture.md
│   ├── donation-lifecycle.md
│   ├── donation-routing-inputs.md
│   ├── database.md
│   ├── data-flow.md
│   ├── api-reference.md
│   ├── mock-contracts.md
│   └── onboarding.md
└── .github/workflows/    # CI pipeline
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9.0.0
- A **Supabase** project (database)
- An **Auth0** tenant (authentication — optional for local dev)

### 1. Clone & Install

```bash
git clone https://github.com/JarrenElysanderJuan/smart-cycle.git
cd smart-cycle
npm install
```

### 2. Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

**Root `.env`** (used by the API):
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://api.smart-cycle.com

# Server
PORT=3001
NODE_ENV=development
```

**Frontend `.env`** (`apps/web/.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Set up the python virtual environment

Create the virtual environment:

```bash
python -m venv .venv
```

Activate it:

```bash
. venv/bin/activate
```

Then, install the requirements:

```bash
pip install requirements.txt
```

### 4. Run Locally

Open **two terminals** in the project root:

```bash
# Terminal 1: Start the API server
npm run dev --workspace=apps/api

# Terminal 2: Start the Next.js dashboard
npm run dev --workspace=apps/web
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

> **Tip:** Visit [http://localhost:3000/login](http://localhost:3000/login) to see the role-selection landing page.

### 5. Run Tests

```bash
npm run test --workspace=apps/api
```

### 6. Build for Production

```bash
npm run build --workspace=apps/web
```

---

## 🔄 Donation Lifecycle

The full flow from food detection to confirmed pickup:

```
🗑️ Bin detects low freshness
   → ⚙️ Alert created (pending)
   → 🏪 Store manager approves (approved_by_store)
   → 🔀 Router ranks food banks (routed)
   → 🏦 Food bank accepts (accepted)
   → 🚚 Food bank confirms pickup (completed)
```

See [docs/donation-lifecycle.md](docs/donation-lifecycle.md) for the full 7-stage breakdown.

---

## 🖥️ Dashboards

| Role | URL | Features |
|------|-----|----------|
| **Admin** | `/` | Full overview of all bins, alerts, and stats |
| **Store Manager** | `/store-dashboard` | My bins, approve donations, track pickups |
| **Food Bank** | `/food-bank-dashboard` | Accept donations, manage inventory, confirm pickups |
| **Landing** | `/login` | Role selection |

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/telemetry/ingest` | POST | Bin telemetry ingestion |
| `/api/v1/bins` | GET/POST | List/create bins |
| `/api/v1/alerts` | GET | List donation alerts |
| `/api/v1/alerts/:id/approve` | POST | Store manager approves donation |
| `/api/v1/alerts/:id/respond` | POST | Food bank accepts/declines |
| `/api/v1/alerts/:id/confirm-pickup` | POST | Food bank confirms pickup |
| `/api/v1/stores` | GET/POST | List/create stores |
| `/api/v1/stores/:id/bins` | GET | Bins for a store |
| `/api/v1/stores/:id/alerts` | GET | Alerts from a store |
| `/api/v1/food-banks` | GET/POST | List/create food banks |
| `/api/v1/food-banks/:id/donations` | GET | Donations for a food bank |

See [docs/api-reference.md](docs/api-reference.md) for full details.

---

## 🔐 Auth0 Integration (Pending)

Auth0 is configured but not yet wired into the codebase. All integration points are marked with `TODO: [AUTH0]` comments. To find them:

```bash
grep -r "TODO: \[AUTH0\]" apps/
```

When ready to integrate:
1. **Backend:** Install `express-oauth2-jwt-bearer`, create JWT validation middleware
2. **Frontend:** Install `@auth0/nextjs-auth0`, wrap app in `UserProvider`
3. **Route gating:** Redirect users to role-specific dashboards after login

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [architecture.md](docs/architecture.md) | System overview, tech stack, security model |
| [donation-lifecycle.md](docs/donation-lifecycle.md) | Full 7-stage donation flow |
| [donation-routing-inputs.md](docs/donation-routing-inputs.md) | Inputs for the routing algorithm |
| [database.md](docs/database.md) | Schema, tables, enums |
| [data-flow.md](docs/data-flow.md) | Telemetry ingestion pipeline |
| [api-reference.md](docs/api-reference.md) | REST API endpoints |
| [mock-contracts.md](docs/mock-contracts.md) | Mocked service interfaces |
| [onboarding.md](docs/onboarding.md) | New developer setup guide |

---

## 🧪 CI/CD

GitHub Actions runs on every push and PR:
- TypeScript type checking
- Unit tests (Vitest)
- Next.js production build

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 👥 Team

Built for a B2B hackathon. External teams handle:
- **Freshness Scoring** — currently mocked (see [mock-contracts.md](docs/mock-contracts.md))
- **Donation Routing** — currently mocked (see [donation-routing-inputs.md](docs/donation-routing-inputs.md))

---

## 📄 License

Private — Hackathon project.
