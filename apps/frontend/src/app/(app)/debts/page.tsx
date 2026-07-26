'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Wallet, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { PaymentDialog } from '@/components/payment-dialog';
import { api } from '@/lib/api';
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

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DebtsPage() {
  const [tab, setTab] = useState<'receivables' | 'payables'>('receivables');
  const [payFor, setPayFor] = useState<{ party: DebtParty; type: 'customer' | 'supplier' } | null>(null);

  const q = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<DebtsData>>('/debts');
      return data.data;
    },
  });
  const d = q.data;
  const rows = tab === 'receivables' ? d?.receivables ?? [] : d?.payables ?? [];
  const partyType = tab === 'receivables' ? 'customer' : 'supplier';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Debts</h1>
        <p className="text-sm text-muted-foreground">Money owed to you, and money you owe.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total receivable (owed to you)</CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">
              {money(d?.totalReceivable ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total payable (you owe)</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">
              {money(d?.totalPayable ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Net position</CardDescription>
            <CardTitle className="text-3xl">
              {money((d?.totalReceivable ?? 0) - (d?.totalPayable ?? 0))}
            </CardTitle>
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
      </div>

      {q.isLoading ? (
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
                    <Button size="sm" variant="outline" onClick={() => setPayFor({ party: p, type: partyType })}>
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
    </div>
  );
}
