# Database Model

MongoDB, accessed via Mongoose. One database serves all tenants; isolation is
enforced by a mandatory `tenantId` on every tenant-scoped collection.

## Tenant-scoped base fields

Applied to every tenant-scoped collection (`src/models/baseFields.ts`):

| Field       | Type       | Notes                                        |
| ----------- | ---------- | -------------------------------------------- |
| `tenantId`  | ObjectId   | **Required.** Isolation key. Indexed.        |
| `createdBy` | ObjectId?  | User who created the document.               |
| `updatedBy` | ObjectId?  | User who last updated the document.          |
| `deletedAt` | Date\|null | Soft-delete timestamp.                       |
| `isDeleted` | boolean    | Soft-delete flag. Indexed.                   |
| `createdAt` | Date       | From Mongoose timestamps.                    |
| `updatedAt` | Date       | From Mongoose timestamps.                    |

## Collections implemented in this milestone

### `tenants`
The isolation boundary — one document per business. Not itself tenant-scoped.

| Field                       | Type    | Notes                                   |
| --------------------------- | ------- | --------------------------------------- |
| `businessName`              | string  | Required.                               |
| `businessType`              | enum    | supermarket, pharmacy, … (see constants)|
| `slug`                      | string  | Unique, URL-safe.                       |
| `email`, `phone`            | string  | Owner contact at signup.                |
| `country`, `currency`, `timezone` | string | Localization. Currency is ISO-4217. |
| `address`, `logoUrl`        | string? | Optional.                               |
| `isActive`, `isSuspended`   | boolean | Lifecycle flags.                        |

### `users`
Staff & owner accounts. Tenant-scoped.

| Field             | Type      | Notes                                            |
| ----------------- | --------- | ------------------------------------------------ |
| `name`, `email`   | string    | `email` unique **per tenant** (compound index).  |
| `phone`, `avatarUrl` | string? | Optional.                                        |
| `passwordHash`    | string    | bcrypt hash; `select:false` (never returned).    |
| `role`            | string    | System role slug (see below).                    |
| `branchIds`       | ObjectId[]| Branch assignments (branch module).              |
| `isEmailVerified`, `isActive` | boolean | Account state.                       |
| `lastLoginAt`     | Date?     | Updated on login.                                |

**Index:** `{ tenantId: 1, email: 1 }` unique — the same person can own accounts
in multiple businesses, but only one per business.

### `subscriptions`
One per tenant. Tenant-scoped.

| Field                                  | Type   | Notes                              |
| -------------------------------------- | ------ | ---------------------------------- |
| `plan`                                 | enum   | trial, starter, business, enterprise |
| `status`                               | enum   | trialing, active, past_due, canceled, expired |
| `trialEndsAt`                          | Date?  | 14 days from signup.               |
| `currentPeriodStart`, `currentPeriodEnd` | Date | Billing window.                    |
| `autoRenew`                            | boolean| Optional auto-renewal.             |

**Index:** `{ tenantId: 1 }` unique.

### `auditlogs`
Append-only security/activity trail. **Not** soft-deleted; `createdAt` only.

| Field       | Type      | Notes                              |
| ----------- | --------- | ---------------------------------- |
| `tenantId`  | ObjectId  | Indexed.                           |
| `actorId`   | ObjectId? | User who performed the action.     |
| `action`    | string    | e.g. `auth.register`, `auth.login`.|
| `entity`, `entityId` | string? | Affected resource.            |
| `ip`, `userAgent`    | string? | Request context.               |
| `metadata`  | Mixed     | Arbitrary structured detail.       |

**Index:** `{ tenantId: 1, createdAt: -1 }`.

## System roles (`src/constants/roles.ts`)

`super_admin`, `owner`, `branch_manager`, `store_manager`, `cashier`,
`store_keeper`, `accountant`, `sales_representative`, `auditor`. Custom roles
and granular permissions arrive with the RBAC module.

## Planned collections (upcoming modules)

`roles`, `permissions`, `branches`, `products`, `categories`, `brands`, `units`,
`customers`, `suppliers`, `inventory`, `inventoryLogs`, `sales`, `saleItems`,
`purchases`, `purchaseItems`, `expenses`, `debts`, `payments`, `cashRegisters`,
`cashMovements`, `plans`, `notifications`, `settings`, `supportTickets`,
`activityLogs`. Each will include the tenant-scoped base fields.
