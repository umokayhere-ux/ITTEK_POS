'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api } from '@/lib/api';
import type { ApiSuccess } from '@/lib/types';

interface AuditEntry {
  _id: string;
  action: string;
  entity?: string;
  ip?: string;
  createdAt: string;
}

export function ActivitySection() {
  const query = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<AuditEntry[]>>('/audit-logs', {
        params: { limit: 100 },
      });
      return data.data;
    },
  });

  const items = query.data ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Recent activity in your workspace.</p>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>IP</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((a) => (
              <TR key={a._id}>
                <TD className="text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</TD>
                <TD className="font-medium">{a.action}</TD>
                <TD className="text-muted-foreground">{a.entity ?? '—'}</TD>
                <TD className="text-muted-foreground">{a.ip ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
