'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { products } from '@/hooks/resources';
import { getApiErrorMessage } from '@/lib/api';
import type { Product } from '@/lib/types';
import { productFormSchema, type ProductFormValues } from '@/lib/validators';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const list = products.useList({ search: search || undefined, limit: 50 });
  const create = products.useCreate();
  const update = products.useUpdate();
  const remove = products.useRemove();

  const form = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema) });

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', sku: '', barcode: '', costPrice: 0, sellingPrice: 0, taxRate: 0, reorderLevel: 0 });
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    form.reset({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode ?? '',
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      taxRate: p.taxRate,
      reorderLevel: p.reorderLevel,
    });
    setOpen(true);
  }

  async function onSubmit(values: ProductFormValues) {
    const payload = { ...values, barcode: values.barcode || undefined };
    if (editing) {
      await update.mutateAsync({ id: editing._id, payload });
    } else {
      await create.mutateAsync(payload);
    }
    setOpen(false);
  }

  const items = list.data?.items ?? [];
  const mutationError = create.error || update.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your catalog.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>

      <Input
        placeholder="Search by name, SKU or barcode…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet. Add your first one.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>SKU</TH>
              <TH className="text-right">Price</TH>
              <TH className="text-right">Reorder</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((p) => (
              <TR key={p._id}>
                <TD className="font-medium">{p.name}</TD>
                <TD className="text-muted-foreground">{p.sku}</TD>
                <TD className="text-right">{p.sellingPrice.toFixed(2)}</TD>
                <TD className="text-right">{p.reorderLevel}</TD>
                <TD>
                  <Badge tone={p.isActive ? 'success' : 'default'}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) remove.mutate(p._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Edit product' : 'Add product'}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register('name')} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...form.register('sku')} />
              <FieldError message={form.formState.errors.sku?.message} />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" {...form.register('barcode')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="costPrice">Cost price</Label>
              <Input id="costPrice" type="number" step="0.01" {...form.register('costPrice')} />
            </div>
            <div>
              <Label htmlFor="sellingPrice">Selling price</Label>
              <Input id="sellingPrice" type="number" step="0.01" {...form.register('sellingPrice')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="taxRate">Tax rate (%)</Label>
              <Input id="taxRate" type="number" step="0.01" {...form.register('taxRate')} />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder level</Label>
              <Input id="reorderLevel" type="number" {...form.register('reorderLevel')} />
            </div>
          </div>

          {mutationError && <p className="text-sm text-destructive">{getApiErrorMessage(mutationError)}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
