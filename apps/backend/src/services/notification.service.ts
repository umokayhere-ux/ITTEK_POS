import { Notification } from '../models/Notification.js';

export const notificationService = {
  /**
   * Creates a notification. When `dedupeKey` is supplied, an existing unread
   * notification with the same key is refreshed instead of duplicated (avoids
   * repeated low-stock spam for the same product).
   */
  async notify(input: {
    tenantId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    dedupeKey?: string;
  }): Promise<void> {
    try {
      if (input.dedupeKey) {
        const existing = await Notification.findOne({
          tenantId: input.tenantId,
          dedupeKey: input.dedupeKey,
          isRead: false,
        }).exec();
        if (existing) {
          existing.message = input.message;
          existing.createdAt = new Date();
          await existing.save();
          return;
        }
      }
      await Notification.create(input);
    } catch {
      // Notifications must never break the primary operation.
    }
  },

  list(tenantId: string, limit = 30) {
    return Notification.find({ tenantId }).sort({ createdAt: -1 }).limit(limit).exec();
  },

  unreadCount(tenantId: string): Promise<number> {
    return Notification.countDocuments({ tenantId, isRead: false }).exec();
  },

  markRead(tenantId: string, id: string) {
    return Notification.updateOne({ _id: id, tenantId }, { $set: { isRead: true } }).exec();
  },

  markAllRead(tenantId: string) {
    return Notification.updateMany({ tenantId, isRead: false }, { $set: { isRead: true } }).exec();
  },
};
