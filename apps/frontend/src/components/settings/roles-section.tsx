'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess } from '@/lib/types';

interface Feature {
  key: string;
  label: string;
}
interface PermissionsData {
  features: Feature[];
  matrix: Record<string, string[]>;
}

const roleLabel = (r: string) => r.replace(/_/g, ' ');

export function RolesSection() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<PermissionsData>>('/settings/permissions');
      return data.data;
    },
  });

  const roles = query.data ? Object.keys(query.data.matrix) : [];
  const [role, setRole] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Load the selected role's features whenever the data or role changes.
  useEffect(() => {
    if (!query.data) return;
    const active = role || roles[0] || '';
    if (!role && active) setRole(active);
    if (active) setSelected(query.data.matrix[active] ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, role]);

  const save = useMutation({
    mutationFn: () => api.put(`/settings/permissions/${role}`, { features: selected }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permissions'] }),
  });

  function toggle(key: string) {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <p className="text-sm text-muted-foreground">
        Choose a role, then pick which features that role can see and use. The Owner always has full
        access.
      </p>

      <div className="max-w-xs">
        <Label htmlFor="role">Role</Label>
        <Select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r} value={r} className="capitalize">
              {roleLabel(r)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(query.data?.features ?? []).map((f) => (
          <label
            key={f.key}
            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/40"
          >
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={selected.includes(f.key)}
              onChange={() => toggle(f.key)}
            />
            {f.label}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          Save permissions
        </Button>
        {save.isSuccess && <span className="text-sm text-muted-foreground">Saved.</span>}
        {save.isError && <span className="text-sm text-destructive">{getApiErrorMessage(save.error)}</span>}
      </div>
    </div>
  );
}
