/** Rounds to 2 decimal places, avoiding binary float drift. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface SaleLineInput {
  quantity: number;
  unitPrice: number;
  taxRate: number; // percent
  discount: number; // absolute amount off the line
}

export interface ComputedLine extends SaleLineInput {
  lineTotal: number; // net + tax
}

export interface SaleTotals {
  lines: ComputedLine[];
  subtotal: number; // sum of quantity * unitPrice, before discount/tax
  discountTotal: number;
  taxTotal: number;
  total: number; // subtotal - discount + tax
}

/**
 * Computes per-line and order totals for a sale. Tax is applied to the
 * post-discount net of each line. Pure and deterministic for easy testing.
 */
export function computeSaleTotals(items: SaleLineInput[]): SaleTotals {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const lines: ComputedLine[] = items.map((item) => {
    const gross = item.quantity * item.unitPrice;
    const discount = Math.min(item.discount, gross);
    const net = gross - discount;
    const tax = round2((net * item.taxRate) / 100);
    const lineTotal = round2(net + tax);

    subtotal = round2(subtotal + gross);
    discountTotal = round2(discountTotal + discount);
    taxTotal = round2(taxTotal + tax);

    return { ...item, discount, lineTotal };
  });

  const total = round2(subtotal - discountTotal + taxTotal);
  return { lines, subtotal, discountTotal, taxTotal, total };
}
