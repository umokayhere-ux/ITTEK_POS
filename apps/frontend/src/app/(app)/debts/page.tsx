'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Wallet, Bell, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { PaymentDialog } from '@/components/payment-dialog';
import { customers, suppliers } from '@/hooks/resources';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess } from '@/lib/types';

interface DebtParty {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  outstandingBalance: number;
}
interface DebtsData {
  receivables: DebtParty[];
  payables: DebtParty[];
  totalReceivable: number;
  totalPayable: number;
}
interface DebtRecord {
  _id: string;
  partyType: 'customer' | 'supplier';
  partyName: string;
  amount: number;
  description?: string;
  dueDate?: string;
  status: string;
  createdAt: string;
}

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DebtsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'receivables' | 'payables' | 'records'>('receivables');
  const [payFor, setPayFor] = useState<{ party: DebtParty; type: 'customer' | 'supplier' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const q = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<DebtsData>>('/debts');
      return data.data;
    },
  });
  const records = useQuery({
    queryKey: ['debt-records'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<DebtRecord[]>>('/debts/records');
      return data.data;
    },
  });
  const d = q.data;

  // Add-debt form
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const custList = customers.useList({ limit: 200 });
  const suppList = suppliers.useList({ limit: 200 });
  const parties = partyType === 'customer' ? custList.data?.items ?? [] : suppList.data?.items ?? [];

  const addDebt = useMutation({
    mutationFn: () =>
      api.post('/debts', {
        partyType,
        partyId: partyId || parties[0]?._id,
        amount: Number(amount),
        description: description || undefined,
        dueDate: dueDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      qc.invalidateQueries({ queryKey: ['debt-records'] });
      qc.invalidateQueries({ queryKey: [partyType === 'customer' ? 'customers' : 'suppliers'] });
      setAddOpen(false);
      setAmount('');
      setDescription('');
      setDueDate('');
    },
  });

  const rows = tab === 'receivables' ? d?.receivables ?? [] : d?.payables ?? [];
  const rowType = tab === 'receivables' ? 'customer' : 'supplier';

  function remind(p: DebtParty) {
    if (!p.email) {
      alert(`${p.name} has no email on file. Add one on their profile to send a reminder.`);
      return;
    }
    const subject = encodeURIComponent('Payment reminder');
    const body = encodeURIComponent(
      `Hello ${p.name},\n\nThis is a friendly reminder that you have an outstanding balance of ${money(p.outstandingBalance)}.\n\nThank you.`,
    );
    window.location.href = `mailto:${p.email}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debts</h1>
          <p className="text-sm text-muted-foreground">Money owed to you, and money you owe.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add debt
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total receivable (owed to you)</CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">{money(d?.totalReceivable ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total payable (you owe)</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">{money(d?.totalPayable ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Net position</CardDescription>
            <CardTitle className="text-3xl">{money((d?.totalReceivable ?? 0) - (d?.totalPayable ?? 0))}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={tab === 'receivables' ? 'primary' : 'outline'} onClick={() => setTab('receivables')}>
          Receivables ({d?.receivables.length ?? 0})
        </Button>
        <Button size="sm" variant={tab === 'payables' ? 'primary' : 'outline'} onClick={() => setTab('payables')}>
          Payables ({d?.payables.length ?? 0})
        </Button>
        <Button size="sm" variant={tab === 'records' ? 'primary' : 'outline'} onClick={() => setTab('records')}>
          Records &amp; due dates
        </Button>
      </div>

      {tab === 'records' ? (
        (records.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No manual debt records yet. Use “Add debt”.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Party</TH>
                <TH>Type</TH>
                <TH>Description</TH>
                <TH className="text-right">Amount</TH>
                <TH>Due</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {(records.data ?? []).map((r) => {
                const overdue = r.dueDate && r.status !== 'settled' && new Date(r.dueDate) < new Date();
                return (
                  <TR key={r._id}>
                    <TD className="font-medium">{r.partyName}</TD>
                    <TD className="capitalize text-muted-foreground">{r.partyType}</TD>
                    <TD className="text-muted-foreground">{r.description ?? '—'}</TD>
                    <TD className="text-right">{money(r.amount)}</TD>
                    <TD className={overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
                      {overdue ? ' (overdue)' : ''}
                    </TD>
                    <TD>
                      <Badge tone={r.status === 'settled' ? 'success' : 'warning'} className="capitalize">
                        {r.status}
                      </Badge>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )
      ) : q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {tab === 'receivables' ? 'No one owes you right now.' : 'You have no outstanding supplier balances.'}
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{tab === 'receivables' ? 'Customer' : 'Supplier'}</TH>
              <TH>Contact</TH>
              <TH className="text-right">Balance</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((p) => (
              <TR key={p._id}>
                <TD className="font-medium">{p.name}</TD>
                <TD className="text-muted-foreground">{p.phone ?? p.email ?? '—'}</TD>
                <TD className="text-right font-medium">{money(p.outstandingBalance)}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => setPayFor({ party: p, type: rowType })}>
                      <Wallet className="h-4 w-4" /> Record payment
                    </Button>
                    {tab === 'receivables' && (
                      <Button size="sm" variant="ghost" aria-label="Remind" onClick={() => remind(p)}>
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <PaymentDialog
        open={!!payFor}
        onClose={() => setPayFor(null)}
        partyType={payFor?.type ?? 'customer'}
        party={payFor?.party ?? null}
      />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add debt">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ptype">Owed by / to</Label>
              <Select
                id="ptype"
                value={partyType}
                onChange={(e) => {
                  setPartyType(e.target.value as 'customer' | 'supplier');
                  setPartyId('');
                }}
              >
                <option value="customer">Customer owes us</option>
                <option value="supplier">We owe supplier</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="party">{partyType === 'customer' ? 'Customer' : 'Supplier'}</Label>
              <Select id="party" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                {parties.length === 0 && <option value="">None — add one first</option>}
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="due">Due date (optional)</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {addDebt.isError && <p className="text-sm text-destructive">{getApiErrorMessage(addDebt.error)}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={addDebt.isPending}
              disabled={!amount || parties.length === 0}
              onClick={() => addDebt.mutate()}
            >
              Add debt
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
