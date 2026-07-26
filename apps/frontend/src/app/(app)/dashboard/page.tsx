'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Wallet,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  Boxes,
  Users,
  Truck,
  Receipt,
  HandCoins,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { SalesAreaChart } from '@/components/charts/sales-area-chart';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-auth';
import type { ApiSuccess } from '@/lib/types';

interface Dashboard {
  scope: 'mine' | 'business';
  todaySales: number;
  todayOrders: number;
  grossProfitToday: number;
  monthExpenses: number;
  lowStockCount: number | null;
  inventoryValue: number | null;
  customers: number | null;
  suppliers: number | null;
  outstandingDebts: number | null;
  salesSeries: { date: string; total: number }[];
  topProducts: { productId: string; name: string; quantitySold: number; revenue: number }[];
  recentActivities: { action: string; entity?: string; at: string }[];
  trends: { sales: { value: number; up: boolean }; orders: { value: number; up: boolean } };
}

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function trendBadge(t?: { value: number; up: boolean }) {
  if (!t) return undefined;
  return { value: `${t.up ? '+' : ''}${t.value}%`, up: t.up };
}

export default function DashboardPage() {
  const { user } = useSession();
  const canViewBusiness = user?.role === 'owner' || user?.role === 'branch_manager';
  const [scope, setScope] = useState<'mine' | 'business'>('mine');
  const [period, setPeriod] = useState('daily');
  const effScope = canViewBusiness ? scope : 'mine';

  const q = useQuery({
    queryKey: ['dashboard', effScope],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Dashboard>>('/reports/dashboard', {
        params: { scope: effScope },
      });
      return data.data;
    },
  });
  const series = useQuery({
    queryKey: ['sales-series', period, effScope],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ date: string; total: number }[]>>(
        '/reports/sales-series',
        { params: { period, scope: effScope } },
      );
      return data.data;
    },
  });
  const d = q.data;
  const mine = effScope === 'mine';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mine ? 'Your personal performance.' : "Your whole business at a glance."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canViewBusiness && (
            <div className="flex gap-1 rounded-md border border-border p-0.5">
              {(['mine', 'business'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    scope === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s === 'mine' ? 'My performance' : 'Business'}
                </button>
              ))}
            </div>
          )}
          <Link href="/pos">
            <Button>
              <ShoppingCart className="h-4 w-4" /> New sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPIs (personal by default) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={mine ? 'My Sales (Today)' : 'Total Sales (Today)'} value={d ? money(d.todaySales) : '—'} icon={ShoppingCart} tone="blue" trend={trendBadge(d?.trends.sales)} />
        <StatCard label="Gross Profit (Today)" value={d ? money(d.grossProfitToday) : '—'} icon={TrendingUp} tone="green" />
        <StatCard label={mine ? 'My Orders (Today)' : 'Orders (Today)'} value={d ? d.todayOrders : '—'} icon={ClipboardList} tone="purple" trend={trendBadge(d?.trends.orders)} />
        <StatCard label={mine ? 'My Expenses (Month)' : 'Expenses (This Month)'} value={d ? money(d.monthExpenses) : '—'} icon={Receipt} tone="amber" />
      </div>

      {/* Chart + top products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{mine ? 'My sales overview' : 'Sales overview'}</CardTitle>
              <div className="flex gap-1 rounded-md border border-border p-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      period === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {series.isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (series.data ?? []).length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No sales in this period.</p>
            ) : (
              <SalesAreaChart data={series.data ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{mine ? 'My top products' : 'Top selling products'}</CardTitle>
          </CardHeader>
          <CardContent>
            {(d?.topProducts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ul className="space-y-3">
                {(d?.topProducts ?? []).map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.quantitySold} sold</span>
                    <span className="w-20 text-right font-medium">{money(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business-wide stats — only in business scope */}
      {!mine && d && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Link href="/inventory">
            <StatCard label="Inventory Value" value={money(d.inventoryValue ?? 0)} icon={Wallet} tone="sky" />
          </Link>
          <Link href="/inventory">
            <StatCard label="Low Stock Items" value={d.lowStockCount ?? 0} icon={AlertTriangle} tone="red" />
          </Link>
          <Link href="/customers">
            <StatCard label="Customers" value={d.customers ?? 0} icon={Users} tone="blue" />
          </Link>
          <Link href="/suppliers">
            <StatCard label="Suppliers" value={d.suppliers ?? 0} icon={Truck} tone="purple" />
          </Link>
          <Link href="/customers">
            <StatCard label="Outstanding Debts" value={money(d.outstandingDebts ?? 0)} icon={HandCoins} tone="amber" />
          </Link>
        </div>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>{mine ? 'My recent activity' : 'Recent activity'}</CardTitle>
        </CardHeader>
        <CardContent>
          {(d?.recentActivities ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {(d?.recentActivities ?? []).map((a, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{a.action}</span>
                    {a.entity && <span className="text-muted-foreground">· {a.entity}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
