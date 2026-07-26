'use client';

import { Building2, CheckCircle2, Clock, PauseCircle, Receipt, Users, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformStats } from '@/hooks/use-admin';

const money = (n: number) => n.toLocaleString();

export function OverviewSection() {
  const stats = usePlatformStats();
  const s = stats.data;

  const kpis = [
    { label: 'Total businesses', value: s?.total, icon: Building2, tone: 'text-primary bg-primary/10' },
    { label: 'Active', value: s?.active, icon: CheckCircle2, tone: 'text-green-600 bg-green-500/10 dark:text-green-400' },
    { label: 'Pending approval', value: s?.pending, icon: Clock, tone: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
    { label: 'Suspended', value: s?.suspended, icon: PauseCircle, tone: 'text-red-600 bg-red-500/10 dark:text-red-400' },
    { label: 'Total users', value: s?.totalUsers, icon: Users, tone: 'text-primary bg-primary/10' },
    { label: 'Sales recorded', value: s?.totalSales, icon: Receipt, tone: 'text-primary bg-primary/10' },
  ];

  const breakdown = [
    { label: 'Active', value: s?.active ?? 0, color: 'bg-green-500' },
    { label: 'Pending', value: s?.pending ?? 0, color: 'bg-amber-500' },
    { label: 'Suspended', value: s?.suspended ?? 0, color: 'bg-red-500' },
    { label: 'Rejected', value: s?.rejected ?? 0, color: 'bg-slate-400' },
  ];
  const totalForBar = breakdown.reduce((t, b) => t + b.value, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-2xl font-bold tracking-tight tnum">{value ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Businesses by status</CardTitle>
          <CardDescription>Distribution across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {breakdown.map((b) => (
              <div
                key={b.label}
                className={b.color}
                style={{ width: `${(b.value / totalForBar) * 100}%` }}
                title={`${b.label}: ${b.value}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${b.color}`} />
                <span className="text-muted-foreground">{b.label}</span>
                <span className="ml-auto font-semibold tnum">{b.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold tnum">{s?.rejected ?? '—'}</div>
              <div className="text-xs text-muted-foreground">Rejected businesses</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold tnum">{s ? money(s.totalUsers) : '—'}</div>
              <div className="text-xs text-muted-foreground">Users across all tenants</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold tnum">{s ? money(s.totalSales) : '—'}</div>
              <div className="text-xs text-muted-foreground">Sales recorded platform-wide</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
