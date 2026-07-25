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
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { suppliers } from '@/hooks/resources';
import { getApiErrorMessage } from '@/lib/api';
import type { Supplier } from '@/lib/types';
import { supplierFormSchema, type SupplierFormValues } from '@/lib/validators';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);

  const list = suppliers.useList({ search: search || undefined, limit: 50 });
  const create = suppliers.useCreate();
  const update = suppliers.useUpdate();
  const remove = suppliers.useRemove();

  const form = useForm<SupplierFormValues>({ resolver: zodResolver(supplierFormSchema) });

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', contactPerson: '', phone: '', email: '' });
    setOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    form.reset({ name: s.name, contactPerson: s.contactPerson ?? '', phone: s.phone ?? '', email: s.email ?? '' });
    setOpen(true);
  }

  async function onSubmit(values: SupplierFormValues) {
    const payload = {
      ...values,
      contactPerson: values.contactPerson || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
    };
    if (editing) await update.mutateAsync({ id: editing._id, payload });
    else await create.mutateAsync(payload);
    setOpen(false);
  }

  const items = list.data?.items ?? [];
  const mutationError = create.error || update.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage your suppliers.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add supplier
        </Button>
      </div>

      <Input
        placeholder="Search by name, phone or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No suppliers yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Contact</TH>
              <TH>Phone</TH>
              <TH className="text-right">Balance</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((s) => (
              <TR key={s._id}>
                <TD className="font-medium">{s.name}</TD>
                <TD className="text-muted-foreground">{s.contactPerson ?? '—'}</TD>
                <TD className="text-muted-foreground">{s.phone ?? '—'}</TD>
                <TD className="text-right">{s.outstandingBalance.toFixed(2)}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${s.name}"?`)) remove.mutate(s._id);
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

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Edit supplier' : 'Add supplier'}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register('name')} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input id="contactPerson" {...form.register('contactPerson')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register('phone')} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
              <FieldError message={form.formState.errors.email?.message} />
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
