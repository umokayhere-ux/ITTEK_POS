/**
 * Restore tool — loads a backup produced by backup.mjs back into MongoDB.
 *
 * Usage:
 *   MONGODB_URI="..." node scripts/restore.mjs <backupDir>            # insert (skips existing _id)
 *   MONGODB_URI="..." node scripts/restore.mjs <backupDir> --wipe     # DROP each collection first
 *
 * ⚠️  --wipe deletes existing data in the matching collections before restoring.
 *     Point MONGODB_URI at the intended target and double-check before using it.
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { EJSON } from 'bson';

const args = process.argv.slice(2);
const wipe = args.includes('--wipe');
const dir = args.find((a) => !a.startsWith('--'));

const uri = process.env.MONGODB_URI;
if (!uri || !dir) {
  console.error('Usage: MONGODB_URI="..." node scripts/restore.mjs <backupDir> [--wipe]');
  process.exit(1);
}
if (!fs.existsSync(path.join(dir, 'manifest.json'))) {
  console.error(`❌ No manifest.json in ${dir} — is this a backup directory?`);
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');

  for (const file of files) {
    const name = file.replace(/\.json$/, '');
    const docs = EJSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'), { relaxed: true });
    if (!Array.isArray(docs) || docs.length === 0) continue;
    if (wipe) await db.collection(name).deleteMany({});
    // Ordered:false so one duplicate _id doesn't abort the whole batch.
    const res = await db.collection(name).insertMany(docs, { ordered: false }).catch((e) => e.result);
    const inserted = res?.insertedCount ?? res?.nInserted ?? 0;
    console.log(`  ${name.padEnd(20)} +${inserted}/${docs.length}`);
  }

  console.log('\n✔ Restore complete.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Restore failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
