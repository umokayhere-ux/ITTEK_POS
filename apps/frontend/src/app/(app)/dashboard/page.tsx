'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { customers, products } from '@/hooks/resources';
import { api } from '@/lib/api';
import type { ApiSuccess, Sale } from '@/lib/types';

interface LowStockItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
}

export default function DashboardPage() {
  const productCount = products.useList({ limit: 1 });
  const customerCount = customers.useList({ limit: 1 });

  const recentSales = useQuery({
    queryKey: ['sales', { recent: true }],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Sale[]>>('/sales', { params: { limit: 5 } });
      return data;
    },
  });

  const lowStock = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<LowStockItem[]>>('/inventory/low-stock');
      return data.data;
    },
  });

  const salesToday = (recentSales.data?.data ?? []).reduce((sum, s) => sum + s.total, 0);

  const stats = [
    { label: 'Products', value: productCount.data?.meta?.total ?? '—', href: '/products' },
    { label: 'Customers', value: customerCount.data?.meta?.total ?? '—', href: '/customers' },
    { label: 'Recent sales value', value: salesToday.toFixed(2), href: '/pos' },
    { label: 'Low stock items', value: lowStock.data?.length ?? '—', href: '/products' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your business at a glance.</p>
        </div>
        <Link href="/pos">
          <Button>New sale</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
            <CardDescription>Latest transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (recentSales.data?.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet. Ring one up from the POS.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {(recentSales.data?.data ?? []).map((s) => (
                  <li key={s._id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{s.invoiceNumber}</span>
                    <span className="flex items-center gap-2">
                      <Badge tone={s.status === 'completed' ? 'success' : 'warning'}>{s.status}</Badge>
                      <span>{s.total.toFixed(2)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>Items at or below reorder level.</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (lowStock.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs restocking.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {(lowStock.data ?? []).map((item) => (
                  <li key={`${item.productId}`} className="flex items-center justify-between py-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge tone="danger">
                      {item.quantity} / {item.reorderLevel}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
