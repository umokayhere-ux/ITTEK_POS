import pino from 'pino';
import { env, isProduction } from './env.js';

/**
 * Structured application logger. Pretty-prints in development,
 * emits JSON in production for log aggregation.
 */
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      },
  base: { env: env.NODE_ENV },
});
