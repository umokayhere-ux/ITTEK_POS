'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { TenantManageDialog } from '@/components/admin/tenant-manage-dialog';
import { usePlatformTenants, useTenantAction } from '@/hooks/use-admin';
import type { AdminTenant } from '@/lib/types';

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

const statusTone: Record<AdminTenant['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  rejected: 'default',
};

export function BusinessesSection() {
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [manage, setManage] = useState<AdminTenant | null>(null);

  const tenants = usePlatformTenants(tab || undefined, search);
  const action = useTenantAction();

  function act(id: string, a: 'approve' | 'reject' | 'suspend' | 'reactivate') {
    if (a === 'reject') {
      const reason = prompt('Reason for rejection (optional):') ?? undefined;
      action.mutate({ id, action: a, reason });
    } else {
      action.mutate({ id, action: a });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={tab === t.value ? 'primary' : 'outline'}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
        <Input
          placeholder="Search business or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto max-w-xs"
        />
      </div>

      {tenants.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (tenants.data ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No businesses in this category.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <THead>
              <TR>
                <TH>Business</TH>
                <TH>Type</TH>
                <TH>Email</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {(tenants.data ?? []).map((t) => (
                <TR key={t._id}>
                  <TD className="font-medium">{t.businessName}</TD>
                  <TD className="capitalize text-muted-foreground">{t.businessType}</TD>
                  <TD className="text-muted-foreground">{t.email}</TD>
                  <TD>
                    <Badge tone={statusTone[t.status]} className="capitalize">
                      {t.status}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      {t.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => act(t._id, 'approve')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => act(t._id, 'reject')}>
                            Reject
                          </Button>
                        </>
                      )}
                      {t.status === 'active' && (
                        <Button size="sm" variant="outline" onClick={() => act(t._id, 'suspend')}>
                          Suspend
                        </Button>
                      )}
                      {(t.status === 'suspended' || t.status === 'rejected') && (
                        <Button size="sm" onClick={() => act(t._id, 'reactivate')}>
                          Reactivate
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setManage(t)}>
                        Manage
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <TenantManageDialog tenant={manage} onClose={() => setManage(null)} />
    </div>
  );
}
