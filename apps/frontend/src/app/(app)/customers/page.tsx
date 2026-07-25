'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Wallet, Download } from 'lucide-react';
import { toCsv, downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PaymentDialog } from '@/components/payment-dialog';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { customers } from '@/hooks/resources';
import { getApiErrorMessage } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { customerFormSchema, type CustomerFormValues } from '@/lib/validators';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [payFor, setPayFor] = useState<Customer | null>(null);

  const list = customers.useList({ search: search || undefined, limit: 50 });
  const create = customers.useCreate();
  const update = customers.useUpdate();
  const remove = customers.useRemove();

  const form = useForm<CustomerFormValues>({ resolver: zodResolver(customerFormSchema) });

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', phone: '', email: '', creditLimit: 0 });
    setOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    form.reset({ name: c.name, phone: c.phone ?? '', email: c.email ?? '', creditLimit: c.creditLimit });
    setOpen(true);
  }

  async function onSubmit(values: CustomerFormValues) {
    const payload = {
      ...values,
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
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customers and their credit.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const { items } = await customers.client.list({ limit: 1000 });
              downloadCsv(
                'customers.csv',
                toCsv(items as unknown as Record<string, unknown>[], [
                  'name',
                  'phone',
                  'email',
                  'creditLimit',
                  'outstandingBalance',
                ]),
              );
            }}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add customer
          </Button>
        </div>
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
        <p className="text-sm text-muted-foreground">No customers yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Phone</TH>
              <TH>Email</TH>
              <TH className="text-right">Balance</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((c) => (
              <TR key={c._id}>
                <TD className="font-medium">{c.name}</TD>
                <TD className="text-muted-foreground">{c.phone ?? '—'}</TD>
                <TD className="text-muted-foreground">{c.email ?? '—'}</TD>
                <TD className="text-right">{c.outstandingBalance.toFixed(2)}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="Record payment" onClick={() => setPayFor(c)}>
                      <Wallet className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${c.name}"?`)) remove.mutate(c._id);
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

      <PaymentDialog open={!!payFor} onClose={() => setPayFor(null)} partyType="customer" party={payFor} />

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Edit customer' : 'Add customer'}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register('name')} />
            <FieldError message={form.formState.errors.name?.message} />
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
          <div>
            <Label htmlFor="creditLimit">Credit limit</Label>
            <Input id="creditLimit" type="number" step="0.01" {...form.register('creditLimit')} />
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
