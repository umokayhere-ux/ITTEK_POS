'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { branches, products } from '@/hooks/resources';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, LowStockItem, StockLevel } from '@/lib/types';

type MovementType = 'stock-in' | 'stock-out' | 'adjust' | 'transfer';

export default function InventoryPage() {
  const qc = useQueryClient();
  const productList = products.useList({ limit: 100 });
  const branchList = branches.useList({ limit: 100 });

  const productMap = useMemo(
    () => new Map((productList.data?.items ?? []).map((p) => [p._id, p])),
    [productList.data],
  );
  const branchMap = useMemo(
    () => new Map((branchList.data?.items ?? []).map((b) => [b._id, b.name])),
    [branchList.data],
  );

  const levels = useQuery({
    queryKey: ['inventory', 'levels'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<StockLevel[]>>('/inventory', { params: { limit: 100 } });
      return data.data;
    },
  });
  const lowStock = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<LowStockItem[]>>('/inventory/low-stock');
      return data.data;
    },
  });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MovementType>('stock-in');
  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const branchOptions = branchList.data?.items ?? [];

  const move = useMutation({
    mutationFn: async () => {
      const b = branchId || branchOptions[0]?._id;
      if (type === 'adjust') {
        return api.post('/inventory/adjust', {
          productId,
          branchId: b,
          targetQuantity: Number(quantity),
          reason: reason || undefined,
        });
      }
      if (type === 'transfer') {
        return api.post('/inventory/transfer', {
          productId,
          fromBranchId: b,
          toBranchId,
          quantity: Number(quantity),
          reason: reason || undefined,
        });
      }
      return api.post(`/inventory/${type}`, {
        productId,
        branchId: b,
        quantity: Number(quantity),
        reason: reason || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setOpen(false);
      setQuantity('');
      setReason('');
    },
  });

  const qtyLabel = type === 'adjust' ? 'Target quantity' : 'Quantity';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Stock levels and movements across branches.</p>
        </div>
        <Button
          onClick={() => {
            setProductId(productList.data?.items[0]?._id ?? '');
            setBranchId(branchOptions[0]?._id ?? '');
            setToBranchId('');
            setOpen(true);
          }}
        >
          <ArrowLeftRight className="h-4 w-4" /> Record movement
        </Button>
      </div>

      {(lowStock.data ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>Items at or below their reorder level.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(lowStock.data ?? []).map((i) => (
                <Badge key={`${i.productId}-${i.sku}`} tone="danger">
                  {i.name}: {i.quantity}/{i.reorderLevel}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {levels.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (levels.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No stock recorded yet. Use “Record movement” or receive a purchase.
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH>Branch</TH>
              <TH className="text-right">On hand</TH>
            </TR>
          </THead>
          <TBody>
            {(levels.data ?? []).map((l) => (
              <TR key={l._id}>
                <TD className="font-medium">{productMap.get(l.productId)?.name ?? l.productId}</TD>
                <TD className="text-muted-foreground">{branchMap.get(l.branchId) ?? l.branchId}</TD>
                <TD className="text-right">{l.quantity}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Record stock movement">
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" value={type} onChange={(e) => setType(e.target.value as MovementType)}>
              <option value="stock-in">Stock in</option>
              <option value="stock-out">Stock out</option>
              <option value="adjust">Adjust to quantity</option>
              <option value="transfer">Transfer between branches</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="product">Product</Label>
            <Select id="product" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {(productList.data?.items ?? []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="branch">{type === 'transfer' ? 'From branch' : 'Branch'}</Label>
              <Select id="branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branchOptions.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            {type === 'transfer' ? (
              <div>
                <Label htmlFor="toBranch">To branch</Label>
                <Select id="toBranch" value={toBranchId} onChange={(e) => setToBranchId(e.target.value)}>
                  <option value="">Select…</option>
                  {branchOptions.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="qty">{qtyLabel}</Label>
                <Input id="qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
            )}
          </div>
          {type === 'transfer' && (
            <div>
              <Label htmlFor="qty2">Quantity</Label>
              <Input id="qty2" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          {move.isError && <p className="text-sm text-destructive">{getApiErrorMessage(move.error)}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={move.isPending}
              disabled={!productId || !quantity || (type === 'transfer' && !toBranchId)}
              onClick={() => move.mutate()}
            >
              Apply
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
