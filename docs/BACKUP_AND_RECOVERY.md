# Backup & Recovery

All tenant data (products, sales, customers, inventory, etc.) lives in **MongoDB
Atlas**. Recovering after a hack, an accidental deletion, or an outage is a
database-layer job. Use all three layers below.

## 1. Atlas automated backups (primary safety net)

In the MongoDB Atlas console → your cluster → **Backup**:

- **M0 (free tier) has NO backups.** If you are on the free cluster, upgrade to a
  paid tier (M2+) to get automated snapshots and point-in-time recovery, or rely
  on the manual exports below.
- On a paid tier, enable **Cloud Backups** with a snapshot schedule and, ideally,
  **Continuous / point-in-time recovery** so you can restore to any moment.
- Restore is done from the Atlas UI (snapshot → restore to the same or a new
  cluster).

## 2. Your own off-database exports (a copy you control)

Two operator scripts live in `apps/backend/scripts`. They need `MONGODB_URI` and
are **not** exposed in the app — only whoever holds the DB credentials can run
them. Output goes to `apps/backend/backups/` (git-ignored — it contains real
data).

```bash
cd apps/backend

# Whole database
MONGODB_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/DB" npm run backup

# A single business only (pass its tenant _id)
MONGODB_URI="..." npm run backup 665f0c...   # products, sales, customers… for that tenant

# Custom output location
MONGODB_URI="..." node scripts/backup.mjs --out /some/safe/place
```

Each run creates `backups/<full|tenant>-<timestamp>/` with one JSON file per
collection plus `manifest.json` (document counts).

### Restore

```bash
cd apps/backend

# Insert docs from a backup (skips rows whose _id already exists)
MONGODB_URI="..." npm run restore backups/full-2026-07-26T22-00-00-000Z

# Replace: DROP each collection first, then restore (destructive — be sure of the URI)
MONGODB_URI="..." node scripts/restore.mjs backups/full-2026-... --wipe
```

**Tip:** run `npm run backup` on a schedule (a laptop cron job, a GitHub Action,
or a Render Cron Job) and copy the output somewhere off Atlas (e.g. cloud
storage). A backup you never take is the one you'll wish you had.

## 3. Reduce the chance of a hack

- **Rotate the database password** if it was ever shared in plaintext, and use a
  DB user with least privilege (read/write to this one database only).
- **Atlas Network Access:** restrict the IP allowlist to your app/host instead of
  `0.0.0.0/0` where possible.
- Keep `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` long and secret; never commit
  `.env`.
- Rotate the super-admin password (`SUPERADMIN_PASSWORD`) periodically.
- Keep secrets only in Render environment variables, never in the repo.
