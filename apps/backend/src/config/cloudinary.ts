import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

let configured = false;

/**
 * Returns the configured Cloudinary client, or null when credentials are not
 * set (image uploads are then disabled with a clear error rather than crashing).
 */
export function getCloudinary(): typeof cloudinary | null {
  if (configured) return cloudinary;
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
    return cloudinary;
  }
  return null;
}

export const isCloudinaryConfigured = (): boolean =>
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
