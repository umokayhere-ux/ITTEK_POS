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

## Conventions for future endpoints

- **Pagination:** `?page=1&limit=20`, returned in `meta`.
- **Sorting:** `?sort=field:asc|desc`.
- **Filtering/Search:** resource-specific query params + `?search=`.
- **Versioning:** breaking changes ship under a new prefix (`/api/v2`).
