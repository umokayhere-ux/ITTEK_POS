'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Undo2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, Sale } from '@/lib/types';

const statusTone = (s: string) =>
  s === 'completed' ? 'success' : s === 'refunded' ? 'danger' : 'warning';

export default function SalesPage() {
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<Sale | null>(null);

  const list = useQuery({
    queryKey: ['sales', 'all'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Sale[]>>('/sales', { params: { limit: 100 } });
      return data.data;
    },
  });

  const refund = useMutation({
    mutationFn: (id: string) => api.post(`/sales/${id}/refund`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <p className="text-sm text-muted-foreground">View sales and process returns (refunds).</p>
      </div>

      {refund.isError && <p className="text-sm text-destructive">{getApiErrorMessage(refund.error)}</p>}

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Invoice</TH>
              <TH>Date</TH>
              <TH className="text-right">Total</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((s) => (
              <TR key={s._id}>
                <TD className="font-medium">{s.invoiceNumber}</TD>
                <TD className="text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</TD>
                <TD className="text-right">{s.total.toFixed(2)}</TD>
                <TD>
                  <Badge tone={statusTone(s.status)} className="capitalize">
                    {s.status}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="View" onClick={() => setViewing(s)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {s.status !== 'refunded' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Refund"
                        onClick={() => {
                          if (confirm(`Refund ${s.invoiceNumber}? This restores stock.`)) refund.mutate(s._id);
                        }}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={!!viewing} onClose={() => setViewing(null)} title={viewing?.invoiceNumber ?? 'Sale'}>
        {viewing && (
          <div className="space-y-3 text-sm">
            <Table>
              <THead>
                <TR>
                  <TH>Item</TH>
                  <TH className="text-right">Qty</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {viewing.items.map((it, i) => (
                  <TR key={i}>
                    <TD>{it.name}</TD>
                    <TD className="text-right">{it.quantity}</TD>
                    <TD className="text-right">{it.lineTotal.toFixed(2)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{viewing.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
