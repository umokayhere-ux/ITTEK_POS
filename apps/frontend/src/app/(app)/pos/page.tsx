'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Minus, Plus, Trash2, Search, Printer, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Receipt } from '@/components/receipt';
import { branches, products } from '@/hooks/resources';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, BusinessSettings, Product, Sale } from '@/lib/types';

interface CartLine {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

export default function PosPage() {
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [scanError, setScanError] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [branchId, setBranchId] = useState('');
  const [method, setMethod] = useState('cash');
  const [tendered, setTendered] = useState('');
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const productList = products.useList({ search: search || undefined, limit: 20 });
  const branchList = branches.useList({ limit: 100 });
  const business = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BusinessSettings>>('/settings/business');
      return data.data;
    },
  });

  const branchOptions = branchList.data?.items ?? [];
  const effectiveBranch = branchId || branchOptions[0]?._id || '';

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of cart) {
      const gross = line.product.sellingPrice * line.quantity;
      subtotal += gross;
      tax += (gross * line.product.taxRate) / 100;
    }
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, tax, total };
  }, [cart]);

  const change = Math.max(0, (Number(tendered) || 0) - totals.total);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product._id === product._id);
      if (existing) {
        return prev.map((l) => (l.product._id === product._id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  /** Looks up a product by barcode/SKU and adds it to the cart. Works with USB
   *  barcode scanners, which type the code and press Enter. */
  async function onScan(code: string) {
    setScanError('');
    const term = code.trim();
    if (!term) return;
    try {
      const { data } = await api.get<ApiSuccess<Product[]>>('/products', {
        params: { search: term, limit: 5 },
      });
      const items = data.data;
      const match =
        items.find((p) => p.barcode === term || p.sku.toLowerCase() === term.toLowerCase()) ??
        items[0];
      if (match) {
        addToCart(match);
        setBarcode('');
      } else {
        setScanError(`No product found for "${term}"`);
      }
    } catch {
      setScanError('Lookup failed');
    }
  }

  function setQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product._id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  const checkout = useMutation({
    mutationFn: async () => {
      const payload = {
        branchId: effectiveBranch,
        items: cart.map((l) => ({ productId: l.product._id, quantity: l.quantity })),
        payments: [{ method, amount: Number(tendered) || totals.total }],
      };
      const { data } = await api.post<ApiSuccess<Sale>>('/sales', payload);
      return data.data;
    },
    onSuccess: (sale) => {
      setReceipt(sale);
      setCart([]);
      setTendered('');
    },
  });

  const canCheckout = cart.length > 0 && effectiveBranch && !checkout.isPending;

  return (
    <>
      {receipt && <Receipt sale={receipt} business={business.data} />}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Product picker */}
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Scan barcode…"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onScan(barcode);
                }
              }}
            />
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {scanError && <p className="text-sm text-destructive">{scanError}</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(productList.data?.items ?? []).map((p) => (
            <button
              key={p._id}
              onClick={() => addToCart(p)}
              className="rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
            >
              <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.sku}</div>
              <div className="mt-2 font-semibold">{p.sellingPrice.toFixed(2)}</div>
            </button>
          ))}
          {productList.data?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No products found.</p>
          )}
        </div>
      </div>

      {/* Cart & checkout */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Current sale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select id="branch" value={effectiveBranch} onChange={(e) => setBranchId(e.target.value)}>
              {branchOptions.length === 0 && <option value="">No branch — create one first</option>}
              {branchOptions.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cart is empty.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((l) => (
                <div key={l.product._id} className="flex items-center gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{l.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.product.sellingPrice.toFixed(2)} × {l.quantity}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" aria-label="Decrease" onClick={() => setQty(l.product._id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center">{l.quantity}</span>
                  <Button variant="ghost" size="sm" aria-label="Increase" onClick={() => setQty(l.product._id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Remove" onClick={() => setQty(l.product._id, -l.quantity)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="method">Payment</Label>
              <Select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="tendered">Amount</Label>
              <Input
                id="tendered"
                type="number"
                step="0.01"
                placeholder={totals.total.toFixed(2)}
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
              />
            </div>
          </div>

          {Number(tendered) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Change</span>
              <span className="font-medium">{change.toFixed(2)}</span>
            </div>
          )}

          {checkout.isError && (
            <p className="text-sm text-destructive">{getApiErrorMessage(checkout.error)}</p>
          )}

          <Button className="w-full" disabled={!canCheckout} loading={checkout.isPending} onClick={() => checkout.mutate()}>
            Complete sale
          </Button>

          {receipt && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Sale complete</span>
                <Badge tone="success">{receipt.invoiceNumber}</Badge>
              </div>
              <div className="mt-2 flex justify-between text-muted-foreground">
                <span>Total</span>
                <span>{receipt.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Change due</span>
                <span>{receipt.changeDue.toFixed(2)}</span>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print receipt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
