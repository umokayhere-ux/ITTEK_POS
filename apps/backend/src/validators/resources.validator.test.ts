import { describe, expect, it } from 'vitest';
import {
  createProductSchema,
  updateProductSchema,
  createCustomerSchema,
} from './resources.validator.js';

describe('createProductSchema', () => {
  it('accepts a minimal valid product and applies defaults', () => {
    const parsed = createProductSchema.parse({ name: 'Milk 1L', sku: 'milk-1l' });
    expect(parsed.costPrice).toBe(0);
    expect(parsed.sellingPrice).toBe(0);
    expect(parsed.taxRate).toBe(0);
  });

  it('rejects a negative selling price', () => {
    expect(() =>
      createProductSchema.parse({ name: 'X', sku: 'X', sellingPrice: -5 }),
    ).toThrow();
  });

  it('rejects an invalid reference id', () => {
    expect(() =>
      createProductSchema.parse({ name: 'X', sku: 'X', categoryId: 'not-an-id' }),
    ).toThrow();
  });
});

describe('updateProductSchema', () => {
  it('rejects an empty update payload', () => {
    expect(() => updateProductSchema.parse({})).toThrow();
  });

  it('accepts a single-field update', () => {
    expect(updateProductSchema.parse({ sellingPrice: 12 }).sellingPrice).toBe(12);
  });
});

describe('createCustomerSchema', () => {
  it('rejects an invalid email', () => {
    expect(() => createCustomerSchema.parse({ name: 'A', email: 'nope' })).toThrow();
  });
});
