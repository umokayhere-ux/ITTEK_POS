'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePlatformStats, usePlatformTenants, useTenantAction } from '@/hooks/use-admin';
import { PlatformSection } from '@/components/admin/platform-section';
import { TicketsSection } from '@/components/admin/tickets-section';
import { adminStorage } from '@/lib/admin';
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!adminStorage.getToken()) router.replace('/admin/login');
    else setReady(true);
  }, [router]);

  const stats = usePlatformStats();
  const tenants = usePlatformTenants(tab || undefined, search);
  const action = useTenantAction();

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const admin = adminStorage.getAdmin();
  const cards = [
    { label: 'Pending approval', value: stats.data?.pending ?? '—' },
    { label: 'Active businesses', value: stats.data?.active ?? '—' },
    { label: 'Suspended', value: stats.data?.suspended ?? '—' },
    { label: 'Total users', value: stats.data?.totalUsers ?? '—' },
  ];

  function act(id: string, a: 'approve' | 'reject' | 'suspend' | 'reactivate') {
    if (a === 'reject') {
      const reason = prompt('Reason for rejection (optional):') ?? undefined;
      action.mutate({ id, action: a, reason });
    } else {
      action.mutate({ id, action: a });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Platform Admin
        </div>
        <div className="flex items-center gap-3">
          {admin && <span className="hidden text-sm text-muted-foreground sm:inline">{admin.email}</span>}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              adminStorage.clear();
              router.replace('/admin/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
          <p className="text-sm text-muted-foreground">Review, approve and manage every business on the platform.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader>
                <CardDescription>{c.label}</CardDescription>
                <CardTitle className="text-3xl">{c.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

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
          <p className="text-sm text-muted-foreground">No businesses in this category.</p>
        ) : (
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
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}

        <div className="pt-4">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Platform</h2>
          <PlatformSection />
        </div>

        <div className="pt-4">
          <TicketsSection />
        </div>
      </main>
    </div>
  );
}
