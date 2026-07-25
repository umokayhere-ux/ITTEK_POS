import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { API_PREFIX } from './constants/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import v1Routes from './routes/v1/index.js';

/**
 * Builds the Express application. Kept free of side effects (no DB connect,
 * no listen) so it can be imported directly by integration tests.
 */
export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
