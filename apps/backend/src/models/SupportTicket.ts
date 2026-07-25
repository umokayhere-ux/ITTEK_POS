import { Schema, model, type Document, type Types } from 'mongoose';

export const TICKET_STATUS = {
  OPEN: 'open',
  ANSWERED: 'answered',
  CLOSED: 'closed',
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export interface TicketMessage {
  author: 'tenant' | 'admin';
  body: string;
  at: Date;
}

export interface SupportTicketDocument extends Document<Types.ObjectId> {
  tenantId: Types.ObjectId;
  createdBy?: Types.ObjectId;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<TicketMessage>(
  {
    author: { type: String, enum: ['tenant', 'admin'], required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    at: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const supportTicketSchema = new Schema<SupportTicketDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: Object.values(TICKET_STATUS), default: TICKET_STATUS.OPEN },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

supportTicketSchema.index({ tenantId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, updatedAt: -1 });

export const SupportTicket = model<SupportTicketDocument>('SupportTicket', supportTicketSchema);
