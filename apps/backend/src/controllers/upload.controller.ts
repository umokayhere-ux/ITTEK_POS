import type { Request, Response } from 'express';
import { getCloudinary } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const uploadController = {
  /**
   * Uploads a base64 data-URI image to Cloudinary under the tenant's folder and
   * returns the secure URL to store on the entity.
   */
  async image(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw AppError.unauthorized();
    const client = getCloudinary();
    if (!client) {
      throw new AppError(501, 'Image uploads are not configured. Set Cloudinary credentials.');
    }

    const { image } = req.body as { image?: string };
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      throw AppError.badRequest('A base64 image data URI is required');
    }

    const result = await client.uploader.upload(image, {
      folder: `ittek/${req.auth.tenantId}`,
      resource_type: 'image',
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    });

    sendSuccess(res, { url: result.secure_url, publicId: result.public_id }, 'Image uploaded', 201);
  },
};
