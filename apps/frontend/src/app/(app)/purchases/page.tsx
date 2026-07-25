'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Plus, Trash2, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { branches, products, suppliers } from '@/hooks/resources';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, Purchase } from '@/lib/types';

interface Line {
  productId: string;
  quantity: number;
  unitCost: number;
}

export default function PurchasesPage() {
  const qc = useQueryClient();
  const supplierList = suppliers.useList({ limit: 100 });
  const branchList = branches.useList({ limit: 100 });
  const productList = products.useList({ limit: 100 });

  const supplierMap = useMemo(
    () => new Map((supplierList.data?.items ?? []).map((s) => [s._id, s.name])),
    [supplierList.data],
  );

  const list = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Purchase[]>>('/purchases', { params: { limit: 100 } });
      return data.data;
    },
  });

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  const productOptions = productList.data?.items ?? [];

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  const create = useMutation({
    mutationFn: async () => {
      return api.post('/purchases', {
        supplierId: supplierId || supplierList.data?.items[0]?._id,
        branchId: branchId || branchList.data?.items[0]?._id,
        items: lines,
        amountPaid: Number(amountPaid) || 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setOpen(false);
      setLines([]);
      setAmountPaid('');
    },
  });

  const returnPurchase = useMutation({
    mutationFn: (id: string) => api.post(`/purchases/${id}/return`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  function addLine() {
    const first = productOptions[0];
    if (!first) return;
    setLines((p) => [...p, { productId: first._id, quantity: 1, unitCost: first.costPrice }]);
  }

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((p) => p.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground">Receive stock and track supplier balances.</p>
        </div>
        <Button
          onClick={() => {
            setSupplierId(supplierList.data?.items[0]?._id ?? '');
            setBranchId(branchList.data?.items[0]?._id ?? '');
            setLines([]);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New purchase
        </Button>
      </div>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (list.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No purchases recorded yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Reference</TH>
              <TH>Supplier</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Balance</TH>
              <TH>Status</TH>
              <TH>Date</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {(list.data ?? []).map((p) => (
              <TR key={p._id}>
                <TD className="font-medium">{p.reference}</TD>
                <TD className="text-muted-foreground">{supplierMap.get(p.supplierId) ?? '—'}</TD>
                <TD className="text-right">{p.total.toFixed(2)}</TD>
                <TD className="text-right">{p.balanceDue.toFixed(2)}</TD>
                <TD>
                  <Badge
                    tone={p.status === 'received' ? 'success' : p.status === 'returned' ? 'danger' : 'warning'}
                    className="capitalize"
                  >
                    {p.status}
                  </Badge>
                </TD>
                <TD className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TD>
                <TD className="text-right">
                  {p.status !== 'returned' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Return"
                      onClick={() => {
                        if (confirm(`Return ${p.reference} to supplier? This removes received stock.`))
                          returnPurchase.mutate(p._id);
                      }}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="New purchase">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select id="supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                {(supplierList.data?.items ?? []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select id="branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {(branchList.data?.items ?? []).map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-3 w-3" /> Add item
              </Button>
            </div>
            {lines.length === 0 && <p className="text-xs text-muted-foreground">No items added.</p>}
            {lines.map((l, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={l.productId}
                  onChange={(e) => updateLine(idx, { productId: e.target.value })}
                  className="flex-1"
                >
                  {productOptions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  className="w-20"
                  value={l.quantity}
                  onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                  aria-label="Quantity"
                />
                <Input
                  type="number"
                  step="0.01"
                  className="w-24"
                  value={l.unitCost}
                  onChange={(e) => updateLine(idx, { unitCost: Number(e.target.value) })}
                  aria-label="Unit cost"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove"
                  onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amountPaid">Amount paid</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={total.toFixed(2)}
              />
            </div>
            <div className="flex items-end justify-end text-sm">
              <span className="text-muted-foreground">Total:&nbsp;</span>
              <span className="font-semibold">{total.toFixed(2)}</span>
            </div>
          </div>

          {create.isError && <p className="text-sm text-destructive">{getApiErrorMessage(create.error)}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={create.isPending} disabled={lines.length === 0} onClick={() => create.mutate()}>
              Record purchase
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
