'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api, getApiErrorMessage } from '@/lib/api';

interface Party {
  _id: string;
  name: string;
  outstandingBalance: number;
}

const METHODS = ['cash', 'card', 'mobile_money', 'bank_transfer'];

/** Records a payment against a customer or supplier balance. */
export function PaymentDialog({
  open,
  onClose,
  partyType,
  party,
}: {
  open: boolean;
  onClose: () => void;
  partyType: 'customer' | 'supplier';
  party: Party | null;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');

  const record = useMutation({
    mutationFn: () =>
      api.post('/payments', {
        partyType,
        partyId: party?._id,
        amount: Number(amount),
        method,
        note: note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [partyType === 'customer' ? 'customers' : 'suppliers'] });
      qc.invalidateQueries({ queryKey: ['debts'] });
      setAmount('');
      setNote('');
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title={`Record payment${party ? ` — ${party.name}` : ''}`}>
      <div className="space-y-4">
        {party && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Outstanding balance: </span>
            <span className="font-semibold">{party.outstandingBalance.toFixed(2)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <Select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="note">Note</Label>
          <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {record.isError && <p className="text-sm text-destructive">{getApiErrorMessage(record.error)}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={record.isPending} disabled={!amount || !party} onClick={() => record.mutate()}>
            Record payment
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
