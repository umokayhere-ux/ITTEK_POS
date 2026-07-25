'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toCsv, downloadCsv } from '@/lib/csv';
import { SalesBarChart } from '@/components/charts/sales-bar-chart';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api } from '@/lib/api';
import type { ApiSuccess, ProfitLoss, SalesSummary, TopProduct } from '@/lib/types';

function useReport<T>(path: string, params: Record<string, string | undefined>, key: string) {
  return useQuery({
    queryKey: ['reports', key, params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<T>>(path, { params });
      return data.data;
    },
  });
}

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const params = { from: from || undefined, to: to || undefined };

  const summary = useReport<SalesSummary>('/reports/sales-summary', params, 'summary');
  const top = useReport<TopProduct[]>('/reports/top-products', params, 'top');
  const pnl = useReport<ProfitLoss>('/reports/profit-loss', params, 'pnl');

  const cards = [
    { label: 'Total sales', value: summary.data?.totalSales ?? 0 },
    { label: 'Transactions', value: summary.data?.count ?? 0, raw: true },
    { label: 'Average sale', value: summary.data?.averageSale ?? 0 },
    { label: 'Net profit', value: pnl.data?.netProfit ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Sales performance and profitability.</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button
            variant="outline"
            disabled={!top.data}
            onClick={() =>
              downloadCsv(
                'top-products.csv',
                toCsv((top.data ?? []) as unknown as Record<string, unknown>[], [
                  'name',
                  'sku',
                  'quantitySold',
                  'revenue',
                ]),
              )
            }
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-3xl">{c.raw ? c.value : c.value.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by day</CardTitle>
            <CardDescription>Daily sales value over the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            {(summary.data?.byDay ?? []).length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No sales in this range.</p>
            ) : (
              <SalesBarChart data={summary.data?.byDay ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Best sellers by quantity.</CardDescription>
          </CardHeader>
          <CardContent>
            {(top.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH className="text-right">Qty</TH>
                    <TH className="text-right">Revenue</TH>
                  </TR>
                </THead>
                <TBody>
                  {(top.data ?? []).map((p) => (
                    <TR key={p.productId}>
                      <TD className="font-medium">{p.name}</TD>
                      <TD className="text-right">{p.quantitySold}</TD>
                      <TD className="text-right">{p.revenue.toFixed(2)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit &amp; loss</CardTitle>
          <CardDescription>Cash-basis operating summary for the range.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-semibold">{(pnl.data?.revenue ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-semibold">{(pnl.data?.expenses ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net profit</p>
              <p className="text-2xl font-semibold text-primary">{(pnl.data?.netProfit ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
