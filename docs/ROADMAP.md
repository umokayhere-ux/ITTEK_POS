# Module Roadmap

Development proceeds **one module at a time**. A module is "done" only when it is
implemented, tested, documented, and production-ready. For every module we
produce: functional requirements → database schema → validation rules → API
endpoints → business logic → authorization rules → backend implementation →
frontend pages → reusable UI components → error handling → tests → documentation.

## ✅ Milestone 0 — Full-stack scaffold (this milestone)

- [x] Monorepo (npm workspaces), shared tooling, Prettier, EditorConfig
- [x] Backend: clean-architecture skeleton, typed config, logger, DB connector
- [x] Multi-tenant base fields, core models (Tenant, User, Subscription, AuditLog)
- [x] Auth module: register / login / refresh / logout / me
- [x] JWT (access + refresh), bcrypt, rate limiting, Helmet, CORS, error handling
- [x] Frontend: Next.js App Router, Tailwind, theming, TanStack Query
- [x] Auth pages (login, register) + dashboard shell, silent token refresh
- [x] Docker (per-app Dockerfiles + compose), CI (lint/typecheck/test/build)
- [x] Unit tests (utils, jwt, password, validators) + docs

## ✅ Milestone 1 — Core commerce backend (catalog & partners)

- [x] Generic tenant-scoped CRUD engine (`BaseRepository`, controller/router factories)
- [x] Pagination, sorting, and search on all list endpoints
- [x] Branch, Category, Brand, Unit, Product, Customer, Supplier models + endpoints
- [x] Soft-delete + audit fields enforced centrally; per-resource Zod validation
- [x] Tests for the CRUD core and resource validators

## ✅ Milestone 2 — Inventory

- [x] Per-branch stock levels with atomic `$inc` updates
- [x] Immutable movement ledger (stock in/out, adjustment, transfer, sale, return)
- [x] Conditional decrement prevents overselling without a transaction
- [x] Stock-in / stock-out / adjust-to-target / branch-to-branch transfer
- [x] Low-stock report (join with product reorder level), levels & logs listing

## ✅ Milestone 2b — Sales / POS core

- [x] Sale with embedded priced line items; catalog-authoritative pricing & tax
- [x] Deterministic money math (discount-before-tax) with unit tests
- [x] Multi-tender payments; automatic credit balance for partially paid sales
- [x] Automatic stock decrement through the inventory ledger, with pre-check
      and compensation so partial sales are never persisted
- [x] Per-tenant atomic invoice numbering (Counter)
- [x] Full refund: restores stock and clears customer credit
- [x] Endpoints: create / list / detail / refund

## ✅ Milestone 3 — Frontend for core operations

- [x] Authenticated app shell with sidebar navigation and client-side guard
- [x] Generic resource data layer (TanStack Query hooks over a typed REST client)
- [x] Products, Customers, Suppliers management (search, table, create/edit/delete)
- [x] POS checkout page: product search, cart, live totals, payment, receipt
- [x] Dashboard wired to real data (counts, recent sales, low stock)
- [x] Reusable UI: table, modal dialog, badge

## ▶ Next — Cash register, purchases, expenses, reports

Cash register open/close & movements; purchase orders & receiving; expenses &
debts; sales/inventory/P&L report endpoints and screens.

## Milestone 3 — RBAC & staff management

Roles, granular permissions, staff CRUD, branch assignment, login history.

## Milestone 4 — Frontend for catalog & partners

Data tables, create/edit forms, and detail views for products, customers,
suppliers, categories, brands, units, and branches (consuming the APIs above).

## Milestone 3 — Inventory

Stock in/out, transfers, adjustments, low/expiring stock, valuation, history.

## Milestone 4 — POS & cash register

Terminal UI, cart, split payments, hold/resume, returns, receipts; register
open/close, cash movements, end-of-day summary.

## Milestone 5 — Customers, suppliers & debts

Profiles, groups, credit sales, purchase history, supplier payments, debt tracking.

## Milestone 6 — Purchases & expenses

Purchase orders, receiving, supplier invoices, returns; expense categories & recurring.

## Milestone 7 — Reports & dashboard analytics

Sales/inventory/P&L/cash-flow/tax reports, best/slow sellers, exports (PDF/Excel/CSV).

## Milestone 8 — Subscriptions & billing

Plan upgrade/downgrade/renew/cancel, invoices, grace period, read-only after expiry.

## Milestone 9 — Super admin & platform

Tenant management, revenue, announcements, support tickets, feature flags, maintenance.

## Milestone 10 — Hardening & platform features

Session management (httpOnly cookies, refresh rotation, Redis denylist), 2FA,
offline-first (IndexedDB sync), notifications, OpenAPI/Swagger, e2e tests.

## Cross-cutting (ongoing)

Security, accessibility, performance (caching, indexing, code-splitting),
observability, backups, and documentation are maintained every milestone.
