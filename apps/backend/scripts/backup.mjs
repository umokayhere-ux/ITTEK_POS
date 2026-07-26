/**
 * Data export / backup tool.
 *
 * Dumps MongoDB collections to timestamped JSON files you control — an
 * off-database copy of your data in case of a hack, accidental deletion, or an
 * Atlas outage. Run by the operator (needs MONGODB_URI); NOT exposed in the app.
 *
 * Usage:
 *   MONGODB_URI="..." node scripts/backup.mjs                 # whole database
 *   MONGODB_URI="..." node scripts/backup.mjs <tenantId>      # one business only
 *   MONGODB_URI="..." node scripts/backup.mjs --out /path     # custom output dir
 *
 * Output: <out>/<timestamp>/<collection>.json  (+ manifest.json)
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { EJSON } from 'bson';

const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outBase = outFlag >= 0 ? args[outFlag + 1] : path.resolve(process.cwd(), 'backups');
const tenantId = args.find((a) => /^[a-f\d]{24}$/i.test(a)) || null;

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI is required. Example:\n   MONGODB_URI="mongodb+srv://..." node scripts/backup.mjs');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(outBase, tenantId ? `tenant-${tenantId}-${stamp}` : `full-${stamp}`);

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();

  fs.mkdirSync(outDir, { recursive: true });
  const oid = tenantId ? new mongoose.Types.ObjectId(tenantId) : null;
  const manifest = { createdAt: new Date().toISOString(), scope: tenantId ?? 'full', collections: {} };

  let grandTotal = 0;
  for (const name of collections) {
    // For a per-tenant export, only pull that tenant's rows. The Tenant record
    // itself is keyed by _id; everything else is scoped by tenantId.
    let filter = {};
    if (oid) {
      if (name === 'tenants') filter = { _id: oid };
      else {
        const sample = await db.collection(name).findOne({});
        if (!sample || !('tenantId' in sample)) continue; // platform-level collection, skip
        filter = { tenantId: oid };
      }
    }

    const docs = await db.collection(name).find(filter).toArray();
    if (oid && docs.length === 0) continue;
    // Extended JSON preserves ObjectId / Date types so a restore is exact.
    fs.writeFileSync(path.join(outDir, `${name}.json`), EJSON.stringify(docs, null, 2, { relaxed: true }));
    manifest.collections[name] = docs.length;
    grandTotal += docs.length;
    console.log(`  ${name.padEnd(20)} ${docs.length} docs`);
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n✔ Exported ${grandTotal} documents to ${outDir}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Backup failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
