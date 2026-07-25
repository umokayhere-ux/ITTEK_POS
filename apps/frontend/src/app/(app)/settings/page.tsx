'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { branches } from '@/hooks/resources';
import { getApiErrorMessage } from '@/lib/api';
import type { Branch } from '@/lib/types';
import { branchFormSchema, type BranchFormValues } from '@/lib/validators';

export default function SettingsPage() {
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);

  const list = branches.useList({ limit: 100 });
  const create = branches.useCreate();
  const update = branches.useUpdate();
  const remove = branches.useRemove();

  const form = useForm<BranchFormValues>({ resolver: zodResolver(branchFormSchema) });

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', code: '', address: '', phone: '', email: '' });
    setOpen(true);
  }

  function openEdit(b: Branch) {
    setEditing(b);
    form.reset({
      name: b.name,
      code: b.code,
      address: b.address ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
    });
    setOpen(true);
  }

  async function onSubmit(values: BranchFormValues) {
    const payload = {
      ...values,
      address: values.address || undefined,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your business.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Branches</CardTitle>
              <CardDescription>
                Locations where you sell and hold stock. At least one is needed for POS,
                inventory, purchases and the cash register.
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add branch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No branches yet. Add your first branch to start selling.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Code</TH>
                  <TH>Phone</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((b) => (
                  <TR key={b._id}>
                    <TD className="font-medium">{b.name}</TD>
                    <TD className="text-muted-foreground">{b.code}</TD>
                    <TD className="text-muted-foreground">{b.phone ?? '—'}</TD>
                    <TD>
                      <Badge tone={b.isActive ? 'success' : 'default'}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete"
                          onClick={() => {
                            if (confirm(`Delete "${b.name}"?`)) remove.mutate(b._id);
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
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Edit branch' : 'Add branch'}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="e.g. MAIN" {...form.register('code')} />
              <FieldError message={form.formState.errors.code?.message} />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register('address')} />
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
