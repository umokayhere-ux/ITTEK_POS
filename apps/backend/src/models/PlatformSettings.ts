import { Schema, model, type Document, type Types } from 'mongoose';

/** Global platform configuration (single document). */
export interface PlatformSettingsDocument extends Document<Types.ObjectId> {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  logoUrl: string;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<PlatformSettingsDocument>(
  {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: 'iTtEk POS is undergoing maintenance. Please check back shortly.',
    },
    // Company logo shown on the login / registration screens.
    logoUrl: { type: String, default: '', trim: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const PlatformSettings = model<PlatformSettingsDocument>(
  'PlatformSettings',
  platformSettingsSchema,
);

let cache: { value: PlatformSettingsDocument; at: number } | null = null;
const TTL = 30_000;

/** Returns the singleton settings, cached for 30s to avoid a per-request read. */
export async function getPlatformSettings(): Promise<PlatformSettingsDocument> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  let doc = await PlatformSettings.findOne().exec();
  if (!doc) doc = await PlatformSettings.create({});
  cache = { value: doc, at: Date.now() };
  return doc;
}

export function invalidatePlatformSettingsCache(): void {
  cache = null;
}
