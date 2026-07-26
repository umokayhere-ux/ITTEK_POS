'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import {
  useSetTenantFeatures,
  useTenantFeatures,
  useTenantOverview,
} from '@/hooks/use-admin';
import { getApiErrorMessage } from '@/lib/api';
import type { AdminTenant } from '@/lib/types';

// dashboard and support are always available to every business.
const LOCKED = new Set(['dashboard', 'support']);
const roleLabel = (r: string) => r.replace(/_/g, ' ');

export function TenantManageDialog({
  tenant,
  onClose,
}: {
  tenant: AdminTenant | null;
  onClose: () => void;
}) {
  const id = tenant?._id ?? null;
  const [view, setView] = useState<'features' | 'overview'>('features');
  const features = useTenantFeatures(id);
  const overview = useTenantOverview(id);
  const save = useSetTenantFeatures();

  const [enabled, setEnabled] = useState<string[]>([]);

  useEffect(() => {
    if (features.data) setEnabled(features.data.enabled);
  }, [features.data]);

  // Reset to the features tab each time a business is opened.
  useEffect(() => {
    setView('features');
  }, [id]);

  function toggle(key: string) {
    if (LOCKED.has(key)) return;
    setEnabled((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }

  return (
    <Dialog open={!!tenant} onClose={onClose} title={tenant?.businessName ?? 'Business'}>
      <div className="space-y-5">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === 'features' ? 'primary' : 'outline'}
            onClick={() => setView('features')}
          >
            Features
          </Button>
          <Button
            size="sm"
            variant={view === 'overview' ? 'primary' : 'outline'}
            onClick={() => setView('overview')}
          >
            Overview
          </Button>
        </div>

        {view === 'features' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which features this business can use. Turning one off removes it for every role,
              including the owner. Dashboard and Support are always available.
            </p>
            {features.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(features.data?.features ?? []).map((f) => {
                  const locked = LOCKED.has(f.key);
                  return (
                    <label
                      key={f.key}
                      className={`flex items-center gap-3 rounded-lg border border-border p-3 text-sm ${
                        locked ? 'opacity-60' : 'hover:bg-muted/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={enabled.includes(f.key)}
                        disabled={locked}
                        onChange={() => toggle(f.key)}
                      />
                      {f.label}
                    </label>
                  );
                })}
              </div>
            )}
            {save.isError && (
              <p className="text-sm text-destructive">{getApiErrorMessage(save.error)}</p>
            )}
            <div className="flex items-center gap-3">
              <Button
                loading={save.isPending}
                disabled={!id}
                onClick={() => id && save.mutate({ id, features: enabled })}
              >
                Save features
              </Button>
              {save.isSuccess && <span className="text-sm text-muted-foreground">Saved.</span>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A read-only view of how this business is set up. Financial data — sales, revenue,
              expenses and debts — is never shown to the platform admin.
            </p>
            {overview.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : overview.data ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {(
                    [
                      ['Staff', overview.data.counts.staff],
                      ['Branches', overview.data.counts.branches],
                      ['Products', overview.data.counts.products],
                      ['Customers', overview.data.counts.customers],
                      ['Suppliers', overview.data.counts.suppliers],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border p-3 text-center">
                      <div className="text-xl font-semibold">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Staff</h3>
                  {overview.data.staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No staff yet.</p>
                  ) : (
                    <Table>
                      <THead>
                        <TR>
                          <TH>Name</TH>
                          <TH>Role</TH>
                          <TH>Status</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {overview.data.staff.map((u) => (
                          <TR key={u.id}>
                            <TD className="font-medium">
                              {u.name}
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </TD>
                            <TD className="capitalize text-muted-foreground">{roleLabel(u.role)}</TD>
                            <TD>
                              <Badge tone={u.isActive ? 'success' : 'default'}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </div>

                {overview.data.branchList.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Branches</h3>
                    <div className="flex flex-wrap gap-2">
                      {overview.data.branchList.map((b) => (
                        <Badge key={b.id} tone={b.isActive ? 'success' : 'default'}>
                          {b.name} ({b.code})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-destructive">{getApiErrorMessage(overview.error)}</p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
