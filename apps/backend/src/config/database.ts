import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Establishes the shared MongoDB connection used by every tenant.
 * Multi-tenancy is enforced at the query layer via a mandatory tenantId
 * filter, not by separate databases.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10_000,
  });

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
