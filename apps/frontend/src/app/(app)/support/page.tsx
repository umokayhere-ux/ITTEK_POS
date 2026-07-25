'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess } from '@/lib/types';

interface TicketMessage {
  author: 'tenant' | 'admin';
  body: string;
  at: string;
}
interface Ticket {
  _id: string;
  subject: string;
  status: string;
  messages: TicketMessage[];
  updatedAt: string;
}

const FAQ = [
  { q: 'How do I add a product?', a: 'Go to Products and click "Add product". You can also import many at once via CSV.' },
  { q: 'Why can’t a cashier see Reports or Settings?', a: 'Menus are role-based. Only owners and managers see administrative sections.' },
  { q: 'How do I record a customer repayment?', a: 'Open Customers, click the wallet icon on the customer and enter the amount.' },
  { q: 'The workspace is read-only — why?', a: 'Your subscription or trial has expired. Go to Billing to renew.' },
  { q: 'How do I refund a sale?', a: 'Open Sales, find the sale and click the refund icon. Stock is restored automatically.' },
];

export default function SupportPage() {
  const qc = useQueryClient();
  const tickets = useQuery({
    queryKey: ['support'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Ticket[]>>('/support');
      return data.data;
    },
  });

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyById, setReplyById] = useState<Record<string, string>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ['support'] });

  const create = useMutation({
    mutationFn: () => api.post('/support', { subject, message }),
    onSuccess: () => {
      invalidate();
      setSubject('');
      setMessage('');
    },
  });

  const reply = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.post(`/support/${id}/reply`, { message: body }),
    onSuccess: (_d, v) => {
      invalidate();
      setReplyById((r) => ({ ...r, [v.id]: '' }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">Find answers or contact our team.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-md border border-border p-3 text-sm">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact support</CardTitle>
            <CardDescription>Open a ticket and we&apos;ll get back to you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {create.isError && <p className="text-sm text-destructive">{getApiErrorMessage(create.error)}</p>}
            <Button loading={create.isPending} disabled={!subject || !message} onClick={() => create.mutate()}>
              Submit ticket
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(tickets.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            ) : (
              (tickets.data ?? []).map((t) => (
                <details key={t._id} className="rounded-md border border-border p-3 text-sm">
                  <summary className="flex cursor-pointer items-center justify-between font-medium">
                    <span>{t.subject}</span>
                    <Badge tone={t.status === 'answered' ? 'success' : t.status === 'closed' ? 'default' : 'warning'} className="capitalize">
                      {t.status}
                    </Badge>
                  </summary>
                  <div className="mt-3 space-y-2">
                    {t.messages.map((m, i) => (
                      <div
                        key={i}
                        className={`rounded-md p-2 ${m.author === 'admin' ? 'bg-primary/10' : 'bg-muted/50'}`}
                      >
                        <div className="text-xs font-medium text-muted-foreground">
                          {m.author === 'admin' ? 'Support' : 'You'}
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
                          onClick={() => reply.mutate({ id: t._id, body: replyById[t._id] })}
                        >
                          Send
                        </Button>
                      </div>
                    )}
                  </div>
                </details>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
