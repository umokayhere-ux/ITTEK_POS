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
  todaySales: number;
  todayOrders: number;
  grossProfitToday: number;
  lowStockCount: number;
  inventoryValue: number;
  customers: number;
  suppliers: number;
  monthExpenses: number;
  outstandingDebts: number;
  salesSeries: { date: string; total: number }[];
  topProducts: { productId: string; name: string; quantitySold: number; revenue: number }[];
  recentActivities: { action: string; entity?: string; at: string }[];
  trends: {
    sales: { value: number; up: boolean };
    orders: { value: number; up: boolean };
  };
}

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function trendBadge(t?: { value: number; up: boolean }) {
  if (!t) return undefined;
  return { value: `${t.up ? '+' : ''}${t.value}%`, up: t.up };
}

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const { user } = useSession();
  const [period, setPeriod] = useState('daily');
  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Dashboard>>('/reports/dashboard');
      return data.data;
    },
  });
  const series = useQuery({
    queryKey: ['sales-series', period],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ date: string; total: number }[]>>(
        '/reports/sales-series',
        { params: { period } },
      );
      return data.data;
    },
  });
  const d = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening today.</p>
        </div>
        <Link href="/pos">
          <Button>
            <ShoppingCart className="h-4 w-4" /> New sale
          </Button>
        </Link>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Sales (Today)" value={d ? money(d.todaySales) : '—'} icon={ShoppingCart} tone="blue" trend={trendBadge(d?.trends.sales)} />
        <StatCard label="Gross Profit (Today)" value={d ? money(d.grossProfitToday) : '—'} icon={TrendingUp} tone="green" />
        <StatCard label="Orders (Today)" value={d ? d.todayOrders : '—'} icon={ClipboardList} tone="purple" trend={trendBadge(d?.trends.orders)} />
        <StatCard label="Inventory Value" value={d ? money(d.inventoryValue) : '—'} icon={Wallet} tone="sky" />
        <Link href="/inventory">
          <StatCard label="Low Stock Items" value={d ? d.lowStockCount : '—'} icon={AlertTriangle} tone="red" />
        </Link>
      </div>

      {/* Chart + top products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Sales overview</CardTitle>
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
            <CardTitle>Top selling products</CardTitle>
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

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/customers">
          <StatCard label="Total Customers" value={d ? d.customers : '—'} icon={Users} tone="blue" />
        </Link>
        <Link href="/suppliers">
          <StatCard label="Total Suppliers" value={d ? d.suppliers : '—'} icon={Truck} tone="purple" />
        </Link>
        <Link href="/expenses">
          <StatCard label="Expenses (This Month)" value={d ? money(d.monthExpenses) : '—'} icon={Receipt} tone="amber" />
        </Link>
        <Link href="/customers">
          <StatCard label="Outstanding Debts" value={d ? money(d.outstandingDebts) : '—'} icon={HandCoins} tone="red" />
        </Link>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
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
