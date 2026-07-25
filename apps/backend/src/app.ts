import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { API_PREFIX } from './constants/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import v1Routes from './routes/v1/index.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** Locates the built frontend (static export) if it was bundled alongside. */
function resolvePublicDir(): string | null {
  const candidates = [
    env.PUBLIC_DIR,
    path.resolve(currentDir, '../public'), // dist/ -> ../public at runtime
    path.resolve(process.cwd(), 'public'),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  }
  return null;
}

/**
 * Builds the Express application. Kept free of side effects (no DB connect,
 * no listen) so it can be imported directly by integration tests.
 */
export function createApp(): Application {
  const app = express();
  const publicDir = resolvePublicDir();

  app.set('trust proxy', 1);
  // The static frontend loads its own bundled assets; a strict default CSP
  // would block them, so it is disabled here (tunable in a later hardening pass).
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(globalLimiter);

  // Liveness/readiness probe.
  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok', uptime: process.uptime() });
  });

  app.use(API_PREFIX, v1Routes);

  // Serve the web app (single-deployment mode). API 404s stay JSON below.
  if (publicDir) {
    logger.info(`Serving frontend from ${publicDir}`);
    app.use(express.static(publicDir));
    app.get(/^\/(?!api\/).*/, (req, res, next) => {
      if (req.method !== 'GET') return next();
      const pageFile = path.join(publicDir, req.path, 'index.html');
      if (fs.existsSync(pageFile)) return res.sendFile(pageFile);
      return res.status(404).sendFile(path.join(publicDir, '404.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
