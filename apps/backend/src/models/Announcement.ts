import { Schema, model, type Document, type Types } from 'mongoose';

/** Platform-wide announcement authored by a super admin, shown to all tenants. */
export interface AnnouncementDocument extends Document<Types.ObjectId> {
  title: string;
  body: string;
  level: 'info' | 'warning';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<AnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    level: { type: String, enum: ['info', 'warning'], default: 'info' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Announcement = model<AnnouncementDocument>('Announcement', announcementSchema);
