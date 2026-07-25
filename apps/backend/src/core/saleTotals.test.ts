import { describe, expect, it } from 'vitest';
import { computeSaleTotals, round2 } from './saleTotals.js';

describe('round2', () => {
  it('rounds to two decimals and tames float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(10)).toBe(10);
  });
});

describe('computeSaleTotals', () => {
  it('computes a simple untaxed, undiscounted order', () => {
    const t = computeSaleTotals([{ quantity: 3, unitPrice: 10, taxRate: 0, discount: 0 }]);
    expect(t.subtotal).toBe(30);
    expect(t.taxTotal).toBe(0);
    expect(t.total).toBe(30);
    expect(t.lines[0]?.lineTotal).toBe(30);
  });

  it('applies per-line discount before tax', () => {
    // gross 100, discount 20 => net 80, tax 10% => 8, line 88
    const t = computeSaleTotals([{ quantity: 10, unitPrice: 10, taxRate: 10, discount: 20 }]);
    expect(t.subtotal).toBe(100);
    expect(t.discountTotal).toBe(20);
    expect(t.taxTotal).toBe(8);
    expect(t.total).toBe(88);
  });

  it('sums multiple lines', () => {
    const t = computeSaleTotals([
      { quantity: 2, unitPrice: 5, taxRate: 0, discount: 0 }, // 10
      { quantity: 1, unitPrice: 20, taxRate: 5, discount: 0 }, // 20 + 1 tax = 21
    ]);
    expect(t.subtotal).toBe(30);
    expect(t.taxTotal).toBe(1);
    expect(t.total).toBe(31);
  });

  it('caps discount at the line gross (never negative)', () => {
    const t = computeSaleTotals([{ quantity: 1, unitPrice: 10, taxRate: 0, discount: 999 }]);
    expect(t.discountTotal).toBe(10);
    expect(t.total).toBe(0);
  });
});
