# iTtEk POS

> **Manage. Monitor. Grow.**
> A multi-tenant Shop Management & Point-of-Sale SaaS platform for retail businesses.

This repository is a monorepo containing the iTtEk POS backend API and web
frontend. It is being built **module by module** — this first milestone is the
**full-stack scaffold** with a working end-to-end multi-tenant authentication
flow (business registration → JWT login → authenticated dashboard).

## Monorepo layout

```
ittek-pos/
├── apps/
│   ├── backend/          # Express + TypeScript + Mongoose API (clean architecture)
│   └── frontend/         # Next.js (App Router) + TypeScript + Tailwind
├── docs/                 # Architecture, database and API documentation
├── docker-compose.yml    # Local dev stack: Mongo, Redis, backend, frontend
└── .github/workflows/    # CI (lint, typecheck, test, build)
```

npm **workspaces** wire the two apps together. Node **>= 20** is required.

## Quick start (local, without Docker)

```bash
# 1. Install everything
npm install

# 2. Configure the backend
cp apps/backend/.env.example apps/backend/.env
# → set MONGODB_URI and replace the two JWT secrets with long random values

# 3. Configure the frontend
cp apps/frontend/.env.example apps/frontend/.env

# 4. Run both apps
npm run dev:backend      # http://localhost:4000  (API under /api/v1)
npm run dev:frontend     # http://localhost:3000
```

You will need a MongoDB instance running (see Docker below for the easiest path).

## Quick start (Docker — one command)

```bash
cp .env.example .env
docker compose up --build
# then open http://localhost:4000
```

This runs MongoDB, Redis, and a **single unified app container** that serves the
web UI and the API together on port 4000.

## Unified build (single deployable)

The frontend is built as a static export and served by the backend, so the whole
product ships as **one Node service** — no separate frontend host.

```bash
npm run build:unified   # builds frontend + backend, copies web build into the API
npm start               # one process serves web UI + API at http://localhost:4000
```

## Deploy to Render (single service)

A [`render.yaml`](render.yaml) blueprint is included. In Render, create a new
Blueprint from this repo and set **`MONGODB_URI`** (e.g. a MongoDB Atlas
connection string) and optionally `CORS_ORIGINS`. The JWT secrets are generated
automatically. Render runs:

- **Build:** `npm install --include=dev && npm run build:unified`
- **Start:** `npm start`
- **Health check:** `/health`

That's it — one service serves everything. (You can also deploy the root
[`Dockerfile`](Dockerfile) as a Docker service.)

## Useful scripts (run from the repo root)

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run dev:backend`      | Start the API in watch mode              |
| `npm run dev:frontend`     | Start the web app in dev mode (port 3000)|
| `npm run build:unified`    | Build one deployable (web served by API) |
| `npm start`                | Run the unified app (web UI + API)       |
| `npm run build`            | Build all workspaces                     |
| `npm run test`             | Run all workspace tests                  |
| `npm run typecheck`        | Typecheck all workspaces                 |
| `npm run lint`             | Lint all workspaces                      |

> For split local dev, also `cp apps/frontend/.env.example apps/frontend/.env`
> so the dev frontend (port 3000) knows the backend URL.

## What works today

- **Multi-tenant auth** — registration provisions a Tenant + Owner + trial
  subscription; JWT access/refresh with silent client refresh.
- **Catalog & partners** — products, categories, brands, units, customers,
  suppliers, branches (full CRUD, search, pagination, soft-delete).
- **Inventory** — per-branch stock levels + movement ledger; stock in/out,
  adjust, transfer, low-stock; overselling is impossible.
- **Sales / POS** — checkout with catalog pricing, payments, credit sales,
  automatic stock decrement, refunds; per-tenant invoice numbers.
- **Purchases** — receiving stock, cost updates, supplier balances.
- **Cash register** — open/close, cash movements, expected-vs-counted.
- **Expenses** and **reports** — sales summary, top products, simple P&L.
- **Web UI** — dashboard (live data), POS terminal, and management screens for
  products, customers, suppliers; light/dark themes.
- **Tenant isolation** everywhere — `tenantId` always comes from the verified
  token, never the request body.

## Super admin & business approval

New business signups are created in a **pending** state and **cannot sign in
until a super admin approves them**. The super admin operates the platform from
a separate area at **`/admin`**.

**Provision the first super admin** by setting these environment variables (on
the backend / Render service) — an admin is created automatically on first boot
if none with that email exists:

```
SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_PASSWORD=a-strong-password
SUPERADMIN_NAME=Your Name
```

Then open **`/admin/login`**, sign in, and approve / reject / suspend businesses
from the dashboard. The signup → approval → sign-in flow:

1. Owner registers at `/register` → business is **pending**.
2. Super admin approves it at `/admin`.
3. Owner can now sign in at `/login`.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design & conventions
- [`docs/DATABASE.md`](docs/DATABASE.md) — collections & multi-tenant data model
- [`docs/API.md`](docs/API.md) — REST endpoints (auth module)
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — module build order

## License

Proprietary — all rights reserved.
