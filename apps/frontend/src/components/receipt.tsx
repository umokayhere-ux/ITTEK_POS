'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { BusinessSettings, Sale } from '@/lib/types';

/**
 * Printable sale receipt (80mm). Rendered off-screen and revealed only when
 * printing via the `.receipt-print` class and print media styles.
 */
export function Receipt({ sale, business }: { sale: Sale; business?: BusinessSettings }) {
  const currency = business?.currency ?? '';
  const money = (n: number) => `${currency ? currency + ' ' : ''}${n.toFixed(2)}`;

  return (
    <div className="receipt-print absolute -left-[9999px] top-0 w-[80mm] bg-white p-3 font-mono text-[12px] text-black">
      <div className="text-center">
        {business?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logoUrl} alt="" className="mx-auto mb-1 h-12 w-auto object-contain" />
        )}
        <div className="text-sm font-bold uppercase">{business?.businessName ?? 'iTtEk POS'}</div>
        {business?.address && <div>{business.address}</div>}
        {business?.phone && <div>{business.phone}</div>}
        {business?.taxNumber && <div>Tax: {business.taxNumber}</div>}
        {business?.receiptHeader && <div className="mt-1">{business.receiptHeader}</div>}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <div>Invoice: {sale.invoiceNumber}</div>
      <div>Date: {new Date(sale.createdAt).toLocaleString()}</div>
      {sale.cashierName && <div>Served by: {sale.cashierName}</div>}
      {sale.customerName && <div>Customer: {sale.customerName}</div>}
      {sale.customerPhone && <div>Phone: {sale.customerPhone}</div>}

      <div className="my-2 border-t border-dashed border-black" />

      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th>Item</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((it, i) => (
            <tr key={i}>
              <td className="pr-1 align-top">{it.name}</td>
              <td className="text-center align-top">{it.quantity}</td>
              <td className="text-right align-top">{it.lineTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{money(sale.total)}</span>
      </div>
      <div className="flex justify-between">
        <span>Paid</span>
        <span>{money(sale.amountPaid)}</span>
      </div>
      {sale.changeDue > 0 && (
        <div className="flex justify-between">
          <span>Change</span>
          <span>{money(sale.changeDue)}</span>
        </div>
      )}
      {sale.balanceDue > 0 && (
        <div className="flex justify-between">
          <span>Balance due</span>
          <span>{money(sale.balanceDue)}</span>
        </div>
      )}

      <div className="my-2 border-t border-dashed border-black" />
      <div className="flex flex-col items-center gap-1">
        <QRCodeSVG value={sale.invoiceNumber} size={72} level="M" />
        <div className="text-center">
          {business?.receiptFooter ?? 'Thank you for your business'}
        </div>
      </div>
    </div>
  );
}
