# API Reference

Base URL: `/api/v1`

All responses use the standard envelope:

```jsonc
{ "success": true,  "message": "…", "data": { … } }   // success
{ "success": false, "message": "…", "errors": { … } } // error
```

Authenticated endpoints require `Authorization: Bearer <accessToken>`.

---

## Health

### `GET /health`
Liveness probe. Returns `{ success, status: "ok", uptime }`. Not under `/api/v1`.

---

## Auth

### `POST /api/v1/auth/register`
Provisions a new business (tenant + owner + trial subscription) and returns a
session. Rate limited.

**Body**

| Field          | Type   | Rules                                             |
| -------------- | ------ | ------------------------------------------------- |
| `businessName` | string | 2–160                                             |
| `businessType` | enum   | one of the supported business types              |
| `ownerName`    | string | 2–120                                             |
| `email`        | string | valid email                                       |
| `phone`        | string | 5–30                                              |
| `password`     | string | ≥8, incl. lowercase, uppercase & a number         |
| `country`      | string | 2–80                                              |
| `currency`     | string | 3-letter ISO code                                 |
| `timezone`     | string | IANA timezone                                     |
| `address`      | string | optional, ≤300                                    |

**201 Response** → `data: { user, tenant, tokens }`

```jsonc
{
  "success": true,
  "message": "Business registered successfully",
  "data": {
    "user":   { "id", "name", "email", "role": "owner", "tenantId", "isEmailVerified" },
    "tenant": { "id", "businessName", "businessType", "slug", "currency", "country", "timezone" },
    "tokens": { "accessToken", "refreshToken" }
  }
}
```

Errors: `400` validation, `409` email already registered.

### `POST /api/v1/auth/login`
**Body:** `{ email, password, rememberMe? }` → `200` with the same
`{ user, tenant, tokens }` shape. `401` on invalid credentials.

### `POST /api/v1/auth/refresh`
**Body:** `{ refreshToken }` → `200` with `{ accessToken, refreshToken }`.
`401` if the refresh token is invalid/expired or the user is inactive.

### `POST /api/v1/auth/logout`
Stateless acknowledgement (client discards tokens). Server-side revocation
arrives with the session-management module.

### `GET /api/v1/auth/me`
**Auth required.** Returns the current user (`data: user`). `401` if the token is
missing/invalid.

---

## Tenant-scoped resources

The following resources share a uniform, tenant-isolated CRUD surface. All
routes require `Authorization: Bearer <accessToken>`; every query is
automatically constrained to the caller's tenant and excludes soft-deleted rows.

| Resource     | Base path                | Search fields            |
| ------------ | ------------------------ | ------------------------ |
| Branches     | `/api/v1/branches`       | name, code               |
| Categories   | `/api/v1/categories`     | name                     |
| Brands       | `/api/v1/brands`         | name                     |
| Units        | `/api/v1/units`          | name, abbreviation       |
| Products     | `/api/v1/products`       | name, sku, barcode       |
| Customers    | `/api/v1/customers`      | name, phone, email       |
| Suppliers    | `/api/v1/suppliers`      | name, phone, email       |

Each exposes:

| Method & path      | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `POST /`           | Create. Body validated per resource; `201` on success.  |
| `GET /`            | List. Supports `?page`, `?limit`, `?sortBy`, `?sortOrder=asc\|desc`, `?search`. Returns `meta`. |
| `GET /:id`         | Fetch one. `404` if not found in tenant.                |
| `PATCH /:id`       | Partial update (at least one field). `404` if not found.|
| `DELETE /:id`      | Soft-delete (sets `isDeleted`/`deletedAt`). `404` if not found. |

Example — create a product:

```jsonc
// POST /api/v1/products
{
  "name": "Milk 1L",
  "sku": "MILK-1L",
  "barcode": "6001234567890",
  "categoryId": "665f0c2a1b2c3d4e5f6a7b8c",
  "costPrice": 8.5,
  "sellingPrice": 12,
  "taxRate": 0,
  "reorderLevel": 24
}
```

`tenantId`, `createdBy`, and `updatedBy` are set server-side from the token and
must never be supplied by the client.

---

## Inventory

Base path `/api/v1/inventory`. All routes require auth and are tenant-scoped.
Stock is tracked per (product, branch); every change writes an immutable ledger
entry with the resulting balance.

| Method & path            | Description                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| `GET /`                  | List stock levels. Filters: `?branchId`, `?productId`, pagination.|
| `GET /logs`              | Movement ledger, newest first. Filters: `?branchId`, `?productId`.|
| `GET /low-stock`         | Products at/below their reorder level (joined with product).      |
| `POST /stock-in`         | Add stock. Body: `{ productId, branchId, quantity, reason?, reference? }`. |
| `POST /stock-out`        | Remove stock. Fails `400` if insufficient on hand.                |
| `POST /adjust`           | Set on-hand to an exact target. Body: `{ productId, branchId, targetQuantity, reason? }`. |
| `POST /transfer`         | Move between branches. Body: `{ productId, fromBranchId, toBranchId, quantity, reason? }`. |

Decrements use a conditional atomic update (`quantity >= amount`), so
overselling is impossible even under concurrent requests.

---

## Sales / POS

Base path `/api/v1/sales`. Auth required, tenant-scoped.

| Method & path         | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `POST /`              | Record a sale (checkout). Decrements stock, tracks credit.   |
| `GET /`               | List sales. Filters: `?branchId`, `?customerId`, `?status`.  |
| `GET /:id`            | Sale detail (with line items and payments).                  |
| `POST /:id/refund`    | Full refund: restores stock, clears any customer balance.    |

**Create body:**

```jsonc
// POST /api/v1/sales
{
  "branchId": "665f...b8c",
  "customerId": "665f...d21",          // optional; required if underpaid (credit)
  "items": [
    { "productId": "665f...aa1", "quantity": 2 },              // price from catalog
    { "productId": "665f...aa2", "quantity": 1, "discount": 5 } // per-line discount
  ],
  "payments": [{ "method": "cash", "amount": 50 }],
  "notes": "walk-in"
}
```

Pricing and tax are taken from the product catalog (an optional `unitPrice`
override is allowed). Tax applies to the post-discount line net. If payments
cover the total, the sale is `completed` with any `changeDue`; if they fall
short, it becomes a `credit` sale (customer required) and the shortfall is added
to the customer's `outstandingBalance`. Stock for inventory-tracked products is
decremented atomically via the inventory ledger.

---

## Purchases

Base path `/api/v1/purchases`. Auth required, tenant-scoped.

| Method & path | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `POST /`      | Record a received purchase. Adds stock, updates cost & supplier balance. |
| `GET /`       | List purchases. Filters: `?supplierId`, `?branchId`.               |
| `GET /:id`    | Purchase detail.                                                   |

Body: `{ supplierId, branchId, items: [{ productId, quantity, unitCost }], amountPaid?, notes? }`.

## Cash register

Base path `/api/v1/cash-registers`. Auth required, tenant-scoped.

| Method & path            | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `POST /open`             | Open a register. Body: `{ branchId, openingBalance }`. Fails if one is already open for the branch. |
| `GET /current?branchId`  | The currently open register for a branch, if any.    |
| `POST /:id/movements`    | Record cash in/out. Body: `{ direction: "in"\|"out", amount, reason? }`. |
| `GET /:id/movements`     | List a register's cash movements.                    |
| `POST /:id/close`        | Close a register. Body: `{ countedCash }` → computes the difference. |
| `GET /`                  | List registers. Filters: `?branchId`, `?status`.     |

## Expenses

Base path `/api/v1/expenses` — standard CRUD (see the resource table above).
Body: `{ category, amount, branchId?, description?, date?, paymentMethod?, isRecurring? }`.

## Reports

Base path `/api/v1/reports`. Auth required, tenant-scoped. All accept
`?from`, `?to` (ISO dates) and `?branchId`.

| Method & path            | Description                                              |
| ------------------------ | ------------------------------------------------------- |
| `GET /sales-summary`     | Totals, average, and a per-day sales series.            |
| `GET /top-products`      | Best sellers by quantity and revenue (`?limit`).        |
| `GET /profit-loss`       | Revenue vs. expenses (cash-basis operating summary).    |

---

## Conventions for future endpoints

- **Pagination:** `?page=1&limit=20`, returned in `meta`.
- **Sorting:** `?sort=field:asc|desc`.
- **Filtering/Search:** resource-specific query params + `?search=`.
- **Versioning:** breaking changes ship under a new prefix (`/api/v2`).
