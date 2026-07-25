'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { expenses } from '@/hooks/resources';
import { getApiErrorMessage } from '@/lib/api';

const CATEGORIES = [
  'utilities',
  'salaries',
  'rent',
  'fuel',
  'repairs',
  'supplies',
  'transport',
  'marketing',
  'miscellaneous',
];

export default function ExpensesPage() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('utilities');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const list = expenses.useList({ limit: 100, sortBy: 'date' });
  const create = expenses.useCreate();
  const remove = expenses.useRemove();

  const items = list.data?.items ?? [];
  const total = items.reduce((sum, e) => sum + e.amount, 0);

  async function submit() {
    await create.mutateAsync({
      category,
      amount: Number(amount),
      description: description || undefined,
      date: new Date(date).toISOString(),
    } as never);
    setOpen(false);
    setAmount('');
    setDescription('');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Recorded total: <span className="font-medium text-foreground">{total.toFixed(2)}</span>
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Record expense
        </Button>
      </div>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Category</TH>
              <TH>Description</TH>
              <TH className="text-right">Amount</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((e) => (
              <TR key={e._id}>
                <TD className="text-muted-foreground">{new Date(e.date).toLocaleDateString()}</TD>
                <TD className="capitalize font-medium">{e.category}</TD>
                <TD className="text-muted-foreground">{e.description ?? '—'}</TD>
                <TD className="text-right">{e.amount.toFixed(2)}</TD>
                <TD className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Delete"
                    onClick={() => {
                      if (confirm('Delete this expense?')) remove.mutate(e._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Record expense">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {create.isError && <p className="text-sm text-destructive">{getApiErrorMessage(create.error)}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={create.isPending} disabled={!amount} onClick={submit}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
