'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import type { createResourceHooks } from '@/hooks/use-resource';
import { getApiErrorMessage } from '@/lib/api';

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
}

interface BaseItem {
  _id: string;
  name: string;
  isActive: boolean;
}

/**
 * Generic name + extra-fields CRUD table with an add/edit dialog. Used for
 * simple catalog entities (categories, brands, units).
 */
export function SimpleCrud<T extends BaseItem>({
  hooks,
  label,
  fields = [],
}: {
  hooks: ReturnType<typeof createResourceHooks<T>>;
  label: string;
  fields?: FieldDef[];
}) {
  const list = hooks.useList({ limit: 100 });
  const create = hooks.useCreate();
  const update = hooks.useUpdate();
  const remove = hooks.useRemove();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const items = list.data?.items ?? [];
  const mutationError = create.error || update.error;

  function openCreate() {
    setEditingId(null);
    setValues({});
    setOpen(true);
  }

  function openEdit(item: T) {
    setEditingId(item._id);
    const record = item as Record<string, unknown>;
    const v: Record<string, string> = { name: item.name };
    for (const f of fields) v[f.key] = String(record[f.key] ?? '');
    setValues(v);
    setOpen(true);
  }

  async function submit() {
    const payload: Record<string, unknown> = { name: values.name };
    for (const f of fields) if (values[f.key]) payload[f.key] = values[f.key];
    if (editingId) await update.mutateAsync({ id: editingId, payload: payload as Partial<T> });
    else await create.mutateAsync(payload as Partial<T>);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {label.toLowerCase()}
          {items.length === 1 ? '' : 's'}
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add {label.toLowerCase()}
        </Button>
      </div>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {label.toLowerCase()}s yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              {fields.map((f) => (
                <TH key={f.key}>{f.label}</TH>
              ))}
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((item) => (
              <TR key={item._id}>
                <TD className="font-medium">{item.name}</TD>
                {fields.map((f) => (
                  <TD key={f.key} className="text-muted-foreground">
                    {String((item as Record<string, unknown>)[f.key] ?? '—')}
                  </TD>
                ))}
                <TD>
                  <Badge tone={item.isActive ? 'success' : 'default'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${item.name}"?`)) remove.mutate(item._id);
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${editingId ? 'Edit' : 'Add'} ${label.toLowerCase()}`}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </div>
          {fields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </div>
          ))}

          {mutationError && <p className="text-sm text-destructive">{getApiErrorMessage(mutationError)}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={create.isPending || update.isPending}
              disabled={!values.name || fields.some((f) => f.required && !values[f.key])}
              onClick={submit}
            >
              {editingId ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
