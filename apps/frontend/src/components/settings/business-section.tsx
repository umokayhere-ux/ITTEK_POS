'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, BusinessSettings } from '@/lib/types';

const FIELDS: { key: keyof BusinessSettings; label: string; full?: boolean }[] = [
  { key: 'businessName', label: 'Business name' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address', full: true },
  { key: 'currency', label: 'Currency (ISO code)' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'taxNumber', label: 'Tax number' },
  { key: 'logoUrl', label: 'Logo URL', full: true },
  { key: 'receiptHeader', label: 'Receipt header', full: true },
  { key: 'receiptFooter', label: 'Receipt footer', full: true },
];

export function BusinessSection() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BusinessSettings>>('/settings/business');
      return data.data;
    },
  });

  const [form, setForm] = useState<Partial<BusinessSettings>>({});
  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      for (const { key } of FIELDS) payload[key] = form[key] ?? '';
      const { data } = await api.patch<ApiSuccess<BusinessSettings>>('/settings/business', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'business'] }),
  });

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              value={(form[f.key] as string) ?? ''}
              onChange={(e) => setForm((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={save.isPending}>
          Save changes
        </Button>
        {save.isSuccess && <span className="text-sm text-muted-foreground">Saved.</span>}
        {save.isError && <span className="text-sm text-destructive">{getApiErrorMessage(save.error)}</span>}
      </div>
    </form>
  );
}
