'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, BusinessSettings } from '@/lib/types';

interface Plan {
  key: string;
  label: string;
  amount: number;
}
interface Sub {
  plan: string;
  status: string;
  daysLeft: number | null;
}

function BillingContent() {
  const qc = useQueryClient();
  const params = useSearchParams();
  const [verifyMsg, setVerifyMsg] = useState('');

  const sub = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Sub>>('/subscription');
      return data.data;
    },
  });
  const plans = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Plan[]>>('/billing/plans');
      return data.data;
    },
  });
  const business = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BusinessSettings>>('/settings/business');
      return data.data;
    },
  });

  const subscribe = useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await api.post<ApiSuccess<{ authorizationUrl: string }>>('/billing/initialize', {
        plan,
      });
      return data.data.authorizationUrl;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const verify = useMutation({
    mutationFn: async (reference: string) => {
      const { data } = await api.post<ApiSuccess<{ plan: string }>>('/billing/verify', { reference });
      return data.data;
    },
    onSuccess: () => {
      setVerifyMsg('Payment confirmed — your plan is active.');
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (err) => setVerifyMsg(getApiErrorMessage(err)),
  });

  // Paystack redirects back with ?reference / ?trxref — verify on return.
  useEffect(() => {
    const ref = params.get('reference') || params.get('trxref');
    if (ref) verify.mutate(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currency = business.data?.currency ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription plan.</p>
      </div>

      {verifyMsg && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">{verifyMsg}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {sub.data ? (
              <span className="flex items-center gap-2">
                <Badge tone={sub.data.status === 'active' ? 'success' : sub.data.status === 'trialing' ? 'warning' : 'danger'} className="capitalize">
                  {sub.data.plan}
                </Badge>
                <span className="capitalize">{sub.data.status}</span>
                {sub.data.daysLeft !== null && <span>· {sub.data.daysLeft} days left</span>}
              </span>
            ) : (
              'Loading…'
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {subscribe.isError && <p className="text-sm text-destructive">{getApiErrorMessage(subscribe.error)}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(plans.data ?? []).map((p) => (
          <Card key={p.key}>
            <CardHeader>
              <CardTitle>{p.label}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
                  {currency} {p.amount.toFixed(2)}
                </span>{' '}
                / month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                loading={subscribe.isPending}
                onClick={() => subscribe.mutate(p.key)}
              >
                {sub.data?.plan === p.key && sub.data?.status === 'active' ? (
                  <>
                    <Check className="h-4 w-4" /> Renew
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are processed securely by Paystack. You will be redirected to complete payment.
      </p>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
      <BillingContent />
    </Suspense>
  );
}
