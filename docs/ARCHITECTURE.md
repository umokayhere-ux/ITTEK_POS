# Architecture

## Overview

iTtEk POS is a **single-application, single-database, multi-tenant** SaaS. One
backend and one MongoDB database serve every business ("tenant"). Tenants are
isolated logically: each tenant-scoped document carries a `tenantId`, and every
query is constrained to the `tenantId` resolved from the caller's verified JWT.

```
┌──────────────┐        HTTPS/JSON        ┌───────────────────────────┐
│  Next.js     │  ───────────────────────▶│  Express API (/api/v1)    │
│  (frontend)  │                          │                           │
│              │  ◀───────────────────────│  Controllers              │
└──────────────┘   access + refresh JWT   │    → Services (logic)     │
                                          │      → Repositories       │
                                          │        → Mongoose models  │
                                          └───────────┬───────────────┘
                                                      │
                                       ┌──────────────┴──────────────┐
                                       │   MongoDB   │    Redis*      │
                                       └─────────────┴───────────────┘
                                          * cache/queues — later module
```

## Backend — clean architecture layers

Requests flow strictly downward; each layer only knows about the one below it.

| Layer            | Directory              | Responsibility                                   |
| ---------------- | ---------------------- | ------------------------------------------------ |
| **Routes**       | `src/routes`           | HTTP wiring, middleware composition              |
| **Middlewares**  | `src/middlewares`      | Auth, validation, rate limiting, error handling  |
| **Controllers**  | `src/controllers`      | Parse request → call service → shape response    |
| **Services**     | `src/services`         | Business logic & orchestration (no HTTP, no DB)  |
| **Repositories** | `src/repositories`     | Data access; the only layer touching Mongoose    |
| **Models**       | `src/models`           | Mongoose schemas & document types                |
| **Validators**   | `src/validators`       | Zod input schemas                                |
| **DTOs**         | `src/dtos`             | Serialization to public shapes (no secrets)      |
| **Utils/Config** | `src/utils`,`src/config` | Cross-cutting helpers & typed configuration    |

**Why:** controllers stay thin and testable, services are framework-agnostic and
unit-testable, and swapping the persistence layer only touches repositories.

## Multi-tenancy & isolation

- `src/models/baseFields.ts` defines the fields every tenant-scoped document must
  carry: `tenantId`, `createdBy`, `updatedBy`, `deletedAt`, `isDeleted`.
- The `authenticate` middleware verifies the access token and populates
  `req.auth = { userId, tenantId, role }`. **`tenantId` is never read from the
  request body or query** — this is the core isolation guarantee.
- Repositories accept `tenantId` explicitly so services always pass the
  authenticated value. As the query surface grows, a Mongoose plugin will enforce
  the `tenantId` + `isDeleted:false` filter automatically.

## Authentication

- **Access token** (short TTL, default 15m) — sent as `Authorization: Bearer`.
- **Refresh token** (long TTL, default 7d) — exchanged at `/auth/refresh`.
- Passwords hashed with **bcrypt** (configurable work factor).
- Tokens are typed (`access` / `refresh`) and signed with **separate secrets**;
  a refresh token cannot be used as an access token and vice-versa.
- Client performs a single silent refresh on a `401` then retries the request.

> Hardening planned for the session-management module: httpOnly refresh cookie,
> refresh-token rotation, and a Redis denylist for logout/revocation.

## Response & error contract

Every endpoint returns a consistent envelope:

```jsonc
// success
{ "success": true, "message": "…", "data": { … }, "meta": { … } }
// error
{ "success": false, "message": "…", "errors": { "field": ["…"] } }
```

A single global error handler (`errorHandler`) maps `AppError`, Mongo duplicate
keys (→ 409) and unexpected errors (→ 500) onto this contract.

## Frontend

- **Next.js App Router** with route groups: `(auth)` for login/register and
  `(dashboard)` for the authenticated shell.
- **TanStack Query** for server state; **React Hook Form + Zod** for forms
  (schemas mirror the backend validators).
- **Axios client** (`src/lib/api.ts`) injects the access token and transparently
  refreshes it on `401`.
- **Theming** via `next-themes` with CSS variables for light/dark.

## Cross-cutting security

Helmet, CORS allowlist, global + auth-specific rate limiting, Zod validation on
every mutating endpoint, bcrypt hashing, append-only audit logs, and typed
environment validation that fails fast on boot.

## Conventions

- TypeScript **strict** everywhere; ESM with explicit `.js` import specifiers on
  the backend (NodeNext).
- Feature work follows the module checklist in [`ROADMAP.md`](ROADMAP.md):
  requirements → schema → validation → endpoints → logic → authz → tests → docs.
