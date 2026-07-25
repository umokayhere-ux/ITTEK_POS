'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTicketActions, useTickets } from '@/hooks/use-admin';

export function TicketsSection() {
  const list = useTickets();
  const { reply, close } = useTicketActions();
  const [replyById, setReplyById] = useState<Record<string, string>>({});

  const tickets = list.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support tickets</CardTitle>
        <CardDescription>Messages from businesses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets.</p>
        ) : (
          tickets.map((t) => (
            <details key={t._id} className="rounded-md border border-border p-3 text-sm">
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                <span>
                  {t.subject} <span className="text-muted-foreground">— {t.businessName}</span>
                </span>
                <Badge tone={t.status === 'answered' ? 'success' : t.status === 'closed' ? 'default' : 'warning'} className="capitalize">
                  {t.status}
                </Badge>
              </summary>
              <div className="mt-3 space-y-2">
                {t.messages.map((m, i) => (
                  <div key={i} className={`rounded-md p-2 ${m.author === 'admin' ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="text-xs font-medium text-muted-foreground">
                      {m.author === 'admin' ? 'You (support)' : t.businessName}
                    </div>
                    <div>{m.body}</div>
                  </div>
                ))}
                {t.status !== 'closed' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Reply…"
                      value={replyById[t._id] ?? ''}
                      onChange={(e) => setReplyById((r) => ({ ...r, [t._id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      disabled={!replyById[t._id]}
                      onClick={() =>
                        reply.mutate(
                          { id: t._id, message: replyById[t._id] },
                          { onSuccess: () => setReplyById((r) => ({ ...r, [t._id]: '' })) },
                        )
                      }
                    >
                      Reply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => close.mutate(t._id)}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </details>
          ))
        )}
      </CardContent>
    </Card>
  );
}
