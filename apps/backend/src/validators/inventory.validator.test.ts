import { describe, expect, it } from 'vitest';
import {
  stockAdjustSchema,
  stockMovementSchema,
  stockTransferSchema,
} from './inventory.validator.js';

const id = 'a'.repeat(24);

describe('stockMovementSchema', () => {
  it('accepts a valid movement', () => {
    expect(() => stockMovementSchema.parse({ productId: id, branchId: id, quantity: 5 })).not.toThrow();
  });

  it('rejects zero or negative quantity', () => {
    expect(() => stockMovementSchema.parse({ productId: id, branchId: id, quantity: 0 })).toThrow();
  });
});

describe('stockAdjustSchema', () => {
  it('allows a target quantity of zero', () => {
    expect(stockAdjustSchema.parse({ productId: id, branchId: id, targetQuantity: 0 }).targetQuantity).toBe(0);
  });

  it('rejects a negative target', () => {
    expect(() => stockAdjustSchema.parse({ productId: id, branchId: id, targetQuantity: -1 })).toThrow();
  });
});

describe('stockTransferSchema', () => {
  it('requires all ids and a positive quantity', () => {
    expect(() =>
      stockTransferSchema.parse({ productId: id, fromBranchId: id, toBranchId: id, quantity: 3 }),
    ).not.toThrow();
  });
});
