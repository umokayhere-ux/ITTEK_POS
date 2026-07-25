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

## Quick start (Docker)

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
docker compose up --build
```

This brings up MongoDB, Redis, the API and the web app together.

## Useful scripts (run from the repo root)

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run dev:backend`      | Start the API in watch mode              |
| `npm run dev:frontend`     | Start the web app in dev mode            |
| `npm run build`            | Build all workspaces                     |
| `npm run test`             | Run all workspace tests                  |
| `npm run typecheck`        | Typecheck all workspaces                 |
| `npm run lint`             | Lint all workspaces                      |

## What works today

- **Multi-tenant registration** — one request provisions a Tenant, its Owner
  account, a trial Subscription and an audit log entry, then returns tokens.
- **JWT auth** — short-lived access token + refresh token, with silent refresh
  on the client.
- **Tenant isolation** — every tenant-scoped model carries `tenantId`, and the
  authenticated `tenantId` is derived from the verified token, never the client.
- **Consistent API envelope**, global error handling, rate limiting, Helmet, CORS.
- **Themed, responsive UI** — landing, login, register and a dashboard shell with
  light/dark mode.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design & conventions
- [`docs/DATABASE.md`](docs/DATABASE.md) — collections & multi-tenant data model
- [`docs/API.md`](docs/API.md) — REST endpoints (auth module)
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — module build order

## License

Proprietary — all rights reserved.
