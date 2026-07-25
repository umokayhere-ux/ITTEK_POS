'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { branches } from '@/hooks/resources';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, CashRegister } from '@/lib/types';

export default function CashRegisterPage() {
  const qc = useQueryClient();
  const branchList = branches.useList({ limit: 100 });
  const branchOptions = branchList.data?.items ?? [];
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    if (!branchId && branchOptions[0]) setBranchId(branchOptions[0]._id);
  }, [branchOptions, branchId]);

  const current = useQuery({
    queryKey: ['cash-register', 'current', branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<CashRegister | null>>('/cash-registers/current', {
        params: { branchId },
      });
      return data.data;
    },
  });

  const history = useQuery({
    queryKey: ['cash-register', 'history', branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<CashRegister[]>>('/cash-registers', {
        params: { branchId, limit: 20 },
      });
      return data.data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['cash-register'] });
  };

  const [openingBalance, setOpeningBalance] = useState('');
  const openRegister = useMutation({
    mutationFn: () => api.post('/cash-registers/open', { branchId, openingBalance: Number(openingBalance) || 0 }),
    onSuccess: () => {
      invalidate();
      setOpeningBalance('');
    },
  });

  const reg = current.data;

  const [moveAmount, setMoveAmount] = useState('');
  const [moveDir, setMoveDir] = useState<'in' | 'out'>('in');
  const [moveReason, setMoveReason] = useState('');
  const addMovement = useMutation({
    mutationFn: () =>
      api.post(`/cash-registers/${reg?._id}/movements`, {
        direction: moveDir,
        amount: Number(moveAmount),
        reason: moveReason || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setMoveAmount('');
      setMoveReason('');
    },
  });

  const [counted, setCounted] = useState('');
  const closeRegister = useMutation({
    mutationFn: () => api.post(`/cash-registers/${reg?._id}/close`, { countedCash: Number(counted) || 0 }),
    onSuccess: () => {
      invalidate();
      setCounted('');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Register</h1>
          <p className="text-sm text-muted-foreground">Open, track and close the cash drawer.</p>
        </div>
        <div>
          <Label htmlFor="branch">Branch</Label>
          <Select id="branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-56">
            {branchOptions.length === 0 && <option value="">Create a branch first</option>}
            {branchOptions.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {current.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : reg ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Open register</CardTitle>
                <Badge tone="success">Open</Badge>
              </div>
              <CardDescription>Opened {new Date(reg.openedAt).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opening balance</span>
                <span>{reg.openingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Expected cash</span>
                <span>{reg.expectedCash.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cash movement</CardTitle>
              <CardDescription>Record cash added to or removed from the drawer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dir">Direction</Label>
                  <Select id="dir" value={moveDir} onChange={(e) => setMoveDir(e.target.value as 'in' | 'out')}>
                    <option value="in">Cash in</option>
                    <option value="out">Cash out</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" step="0.01" value={moveAmount} onChange={(e) => setMoveAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" value={moveReason} onChange={(e) => setMoveReason(e.target.value)} />
              </div>
              {addMovement.isError && (
                <p className="text-sm text-destructive">{getApiErrorMessage(addMovement.error)}</p>
              )}
              <Button size="sm" loading={addMovement.isPending} disabled={!moveAmount} onClick={() => addMovement.mutate()}>
                Record movement
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Close register</CardTitle>
              <CardDescription>Count the drawer to close and see the difference.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div>
                <Label htmlFor="counted">Counted cash</Label>
                <Input id="counted" type="number" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} className="w-48" />
              </div>
              <Button variant="outline" loading={closeRegister.isPending} disabled={!counted} onClick={() => closeRegister.mutate()}>
                Close register
              </Button>
              {closeRegister.isError && (
                <p className="text-sm text-destructive">{getApiErrorMessage(closeRegister.error)}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Open register</CardTitle>
            <CardDescription>No register is currently open for this branch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="opening">Opening balance</Label>
              <Input id="opening" type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
            </div>
            {openRegister.isError && (
              <p className="text-sm text-destructive">{getApiErrorMessage(openRegister.error)}</p>
            )}
            <Button loading={openRegister.isPending} disabled={!branchId} onClick={() => openRegister.mutate()}>
              Open register
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>Closed and open registers for this branch.</CardDescription>
        </CardHeader>
        <CardContent>
          {(history.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Opened</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Expected</TH>
                  <TH className="text-right">Counted</TH>
                  <TH className="text-right">Difference</TH>
                </TR>
              </THead>
              <TBody>
                {(history.data ?? []).map((r) => (
                  <TR key={r._id}>
                    <TD className="text-muted-foreground">{new Date(r.openedAt).toLocaleString()}</TD>
                    <TD>
                      <Badge tone={r.status === 'open' ? 'success' : 'default'} className="capitalize">
                        {r.status}
                      </Badge>
                    </TD>
                    <TD className="text-right">{r.expectedCash.toFixed(2)}</TD>
                    <TD className="text-right">{r.countedCash?.toFixed(2) ?? '—'}</TD>
                    <TD className="text-right">
                      {r.difference === undefined ? (
                        '—'
                      ) : (
                        <span className={r.difference === 0 ? '' : 'text-destructive'}>
                          {r.difference.toFixed(2)}
                        </span>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
