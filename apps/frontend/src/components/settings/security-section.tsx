'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, User } from '@/lib/types';

export function SecuritySection() {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<User>>('/auth/me');
      return data.data;
    },
  });

  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');

  const setup = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiSuccess<{ secret: string; otpauthUrl: string }>>('/auth/2fa/setup', {});
      return data.data;
    },
    onSuccess: (d) => setSetupData(d),
  });

  const enable = useMutation({
    mutationFn: () => api.post('/auth/2fa/enable', { token: code }),
    onSuccess: () => {
      setSetupData(null);
      setCode('');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const disable = useMutation({
    mutationFn: () => api.post('/auth/2fa/disable', { token: code }),
    onSuccess: () => {
      setCode('');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const enabled = me.data?.twoFactorEnabled;
  const actionError = setup.error || enable.error || disable.error;

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold">Two-factor authentication</h3>
        <Badge tone={enabled ? 'success' : 'default'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Add a second step at sign-in using an authenticator app (Google Authenticator, Authy, etc.).
      </p>

      {enabled ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="code">Enter a code to disable</Label>
            <Input id="code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-xs" />
          </div>
          <Button variant="outline" loading={disable.isPending} disabled={!code} onClick={() => disable.mutate()}>
            Disable 2FA
          </Button>
        </div>
      ) : setupData ? (
        <div className="space-y-3 rounded-md border border-border p-4">
          <p className="text-sm">
            In your authenticator app, add an account and enter this secret (or scan the URL as a QR code):
          </p>
          <code className="block break-all rounded bg-muted p-2 text-xs">{setupData.secret}</code>
          <code className="block break-all rounded bg-muted p-2 text-xs">{setupData.otpauthUrl}</code>
          <div>
            <Label htmlFor="code">Enter the 6-digit code to confirm</Label>
            <Input id="code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-xs" />
          </div>
          <Button loading={enable.isPending} disabled={!code} onClick={() => enable.mutate()}>
            Enable 2FA
          </Button>
        </div>
      ) : (
        <Button loading={setup.isPending} onClick={() => setup.mutate()}>
          Set up 2FA
        </Button>
      )}

      {actionError && <p className="text-sm text-destructive">{getApiErrorMessage(actionError)}</p>}
    </div>
  );
}
