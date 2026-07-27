'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Download, Search, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { TenantManageDialog } from '@/components/admin/tenant-manage-dialog';
import {
  useTenantEntity,
  useTenantOverview,
  type TenantEntity,
  type TenantRecord,
} from '@/hooks/use-admin';
import { downloadCsv, toCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';
import type { AdminTenant } from '@/lib/types';

const TABS: { key: 'overview' | TenantEntity; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'customers', label: 'Customers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'staff', label: 'Staff' },
  { key: 'branches', label: 'Branches' },
];

// Column config per entity: [record key, header, align-right?]
const COLUMNS: Record<TenantEntity, [string, string, boolean?][]> = {
  products: [['name', 'Product'], ['sku', 'SKU'], ['sellingPrice', 'Price', true], ['stock', 'Stock', true]],
  customers: [['name', 'Name'], ['phone', 'Phone'], ['email', 'Email']],
  suppliers: [['name', 'Name'], ['phone', 'Phone'], ['email', 'Email']],
  staff: [['name', 'Name'], ['email', 'Email'], ['role', 'Role']],
  branches: [['name', 'Branch'], ['code', 'Code'], ['phone', 'Phone']],
};

const num = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function TenantDetail({ tenant, onBack }: { tenant: AdminTenant; onBack: () => void }) {
  const [tab, setTab] = useState<'overview' | TenantEntity>('overview');
  const [query, setQuery] = useState('');
  const [manageOpen, setManageOpen] = useState(false);

  const overview = useTenantOverview(tenant._id);
  const entity = tab === 'overview' ? null : tab;
  const list = useTenantEntity(tenant._id, entity);

  const cols = entity ? COLUMNS[entity] : [];
  const rows = useMemo(() => {
    const data = list.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  }, [list.data, query]);

  function exportCsv() {
    if (!entity || rows.length === 0) return;
    const headers = cols.map((c) => c[1]);
    const mapped = rows.map((r) => Object.fromEntries(cols.map((c) => [c[1], r[c[0]] as string | number])));
    downloadCsv(`${tenant.businessName}-${entity}.csv`.replace(/\s+/g, '-'), toCsv(mapped, headers));
  }

  const counts = overview.data?.counts;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight">{tenant.businessName}</h2>
          <p className="truncate text-xs text-muted-foreground">
            <span className="capitalize">{tenant.businessType}</span> · {tenant.email}
          </p>
        </div>
        <Badge tone={tenant.status === 'active' ? 'success' : tenant.status === 'pending' ? 'warning' : 'danger'} className="capitalize">
          {tenant.status}
        </Badge>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => setManageOpen(true)}>
          <Settings2 className="h-4 w-4" /> Manage features
        </Button>
      </div>

      {/* Entity tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const count = t.key !== 'overview' && counts ? counts[t.key as keyof typeof counts] : undefined;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setQuery('');
              }}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {count !== undefined ? <span className="ml-1.5 text-xs text-muted-foreground">({count})</span> : null}
            </button>
          );
        })}
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              ['Products', counts?.products],
              ['Customers', counts?.customers],
              ['Suppliers', counts?.suppliers],
              ['Staff', counts?.staff],
              ['Branches', counts?.branches],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border p-4 text-center">
              <div className="text-2xl font-bold tnum">{value ?? '—'}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={`Search ${tab}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">{rows.length} shown</span>
            <Button variant="outline" size="sm" className="ml-auto" disabled={rows.length === 0} onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          {list.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {query ? 'No matches.' : `No ${tab} yet.`}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <THead>
                  <TR>
                    {cols.map((c) => (
                      <TH key={c[0]} className={c[2] ? 'text-right' : undefined}>
                        {c[1]}
                      </TH>
                    ))}
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((r, i) => (
                    <TR key={(r.id as string) ?? i}>
                      {cols.map((c) => (
                        <TD key={c[0]} className={cn(c[2] && 'text-right tnum', c[0] === 'name' && 'font-medium')}>
                          {formatCell(r, c[0])}
                        </TD>
                      ))}
                      <TD>
                        <Badge tone={r.isActive === false ? 'default' : 'success'}>
                          {r.isActive === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <TenantManageDialog tenant={manageOpen ? tenant : null} onClose={() => setManageOpen(false)} />
    </div>
  );
}

function formatCell(row: TenantRecord, key: string) {
  const value = row[key];
  if (value === undefined || value === null || value === '') return '—';
  if (key === 'sellingPrice' || key === 'stock') return num(Number(value));
  if (key === 'role') return String(value).replace(/_/g, ' ');
  return String(value);
}
