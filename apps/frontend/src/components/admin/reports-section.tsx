'use client';

import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { useTenantsSummary, type TenantSummaryRow } from '@/hooks/use-admin';
import { downloadCsv, toCsv } from '@/lib/csv';

const COLUMNS: { key: keyof TenantSummaryRow['counts']; label: string }[] = [
  { key: 'products', label: 'Products' },
  { key: 'sales', label: 'Sales' },
  { key: 'customers', label: 'Customers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'staff', label: 'Staff' },
  { key: 'branches', label: 'Branches' },
];

const CSV_COLUMNS = ['Business', 'Type', 'Email', 'Status', ...COLUMNS.map((c) => c.label), 'Created'];

function toRows(data: TenantSummaryRow[]) {
  return data.map((t) => ({
    Business: t.businessName,
    Type: t.businessType,
    Email: t.email,
    Status: t.status,
    ...Object.fromEntries(COLUMNS.map((c) => [c.label, t.counts[c.key]])),
    Created: new Date(t.createdAt).toLocaleDateString(),
  }));
}

export function ReportsSection() {
  const summary = useTenantsSummary();
  const data = summary.data ?? [];

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`tenant-totals-${stamp}.csv`, toCsv(toRows(data), CSV_COLUMNS));
  }

  const totals = COLUMNS.map((c) => data.reduce((sum, t) => sum + t.counts[c.key], 0));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Record counts per business — no financial figures. Export as Excel (CSV) or PDF.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={data.length === 0} onClick={exportCsv}>
            <Download className="h-4 w-4" /> Excel (CSV)
          </Button>
          <Button variant="outline" size="sm" disabled={data.length === 0} onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {summary.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No businesses yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <THead>
              <TR>
                <TH>Business</TH>
                {COLUMNS.map((c) => (
                  <TH key={c.key} className="text-right">
                    {c.label}
                  </TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {data.map((t) => (
                <TR key={t.id}>
                  <TD className="font-medium">
                    {t.businessName}
                    <div className="text-xs capitalize text-muted-foreground">{t.businessType}</div>
                  </TD>
                  {COLUMNS.map((c) => (
                    <TD key={c.key} className="text-right tnum">
                      {t.counts[c.key]}
                    </TD>
                  ))}
                </TR>
              ))}
              <TR>
                <TD className="font-semibold">All businesses ({data.length})</TD>
                {totals.map((n, i) => (
                  <TD key={i} className="text-right font-semibold tnum">
                    {n}
                  </TD>
                ))}
              </TR>
            </TBody>
          </Table>
        </div>
      )}

      {/* Printable report (revealed only when printing → Save as PDF). */}
      {data.length > 0 && (
        <div className="report-print absolute -left-[9999px] top-0" aria-hidden>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>iTtEk POS — Tenant Totals</h1>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>
            Generated {new Date().toLocaleString()} · {data.length} businesses · record counts (no financial data)
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Business', 'Type', ...COLUMNS.map((c) => c.label)].map((h) => (
                  <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #000', padding: '6px 8px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #ddd' }}>{t.businessName}</td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #ddd' }}>{t.businessType}</td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} style={{ padding: '5px 8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                      {t.counts[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
