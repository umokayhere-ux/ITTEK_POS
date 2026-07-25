// Copies the frontend static export into the backend so a single Node process
// serves both the web app and the API. Run after building both workspaces.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve('apps/frontend/out');
const dest = resolve('apps/backend/public');

if (!existsSync(src)) {
  console.error(`✖ Frontend export not found at ${src}. Run the frontend build first.`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`✔ Copied frontend build → ${dest}`);
