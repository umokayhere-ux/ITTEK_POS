import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * In-app notification for a tenant (e.g. low stock). Lightweight and not
 * soft-deleted; older entries can be pruned by a background job later.
 */
export interface NotificationDocument extends Document<Types.ObjectId> {
  tenantId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  dedupeKey?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    dedupeKey: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ tenantId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<NotificationDocument>('Notification', notificationSchema);
