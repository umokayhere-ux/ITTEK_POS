import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * Per-tenant monotonic sequence generator (e.g. invoice numbers). Incremented
 * atomically with `$inc` + upsert so concurrent sales never collide.
 */
export interface CounterDocument extends Document<Types.ObjectId> {
  tenantId: Types.ObjectId;
  key: string;
  seq: number;
}

const counterSchema = new Schema<CounterDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  key: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

counterSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Counter = model<CounterDocument>('Counter', counterSchema);

/** Returns the next value in a tenant's named sequence. */
export async function nextSequence(tenantId: string, key: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).exec();
  return doc.seq;
}
