'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { ApiSuccess } from '@/lib/types';

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ items: Notification[]; unread: number }>>(
        '/notifications',
      );
      return data.data;
    },
    refetchInterval: 60_000,
  });

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = query.data?.unread ?? 0;
  const items = query.data?.items ?? [];

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" aria-label="Notifications" onClick={() => setOpen((o) => !o)}>
        <span className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button className="text-xs text-primary hover:underline" onClick={() => markAll.mutate()}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing new.</p>
              ) : (
                items.map((n) => (
                  <div
                    key={n._id}
                    className={`border-b border-border px-4 py-3 text-sm last:border-0 ${n.isRead ? '' : 'bg-muted/40'}`}
                  >
                    <div className="font-medium">{n.title}</div>
                    <div className="text-muted-foreground">{n.message}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
