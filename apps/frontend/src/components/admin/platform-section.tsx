'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  useAnnouncementActions,
  useAnnouncements,
  usePlatformConfig,
} from '@/hooks/use-admin';

export function PlatformSection() {
  const list = useAnnouncements();
  const { create, remove } = useAnnouncementActions();
  const config = usePlatformConfig();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [level, setLevel] = useState('info');
  const [message, setMessage] = useState('');

  const cfg = config.query.data;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>Shown to every business in their dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Input id="body" value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="level">Level</Label>
                <Select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                </Select>
              </div>
              <Button
                loading={create.isPending}
                disabled={!title || !body}
                onClick={() =>
                  create.mutate(
                    { title, body, level },
                    {
                      onSuccess: () => {
                        setTitle('');
                        setBody('');
                      },
                    },
                  )
                }
              >
                Publish
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border border-t border-border">
            {(list.data ?? []).map((a) => (
              <div key={a._id} className="flex items-start justify-between gap-2 py-2 text-sm">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {a.title}
                    <Badge tone={a.level === 'warning' ? 'warning' : 'default'}>{a.level}</Badge>
                  </div>
                  <div className="text-muted-foreground">{a.body}</div>
                </div>
                <Button variant="ghost" size="sm" aria-label="Delete" onClick={() => remove.mutate(a._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(list.data ?? []).length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">No announcements.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance mode</CardTitle>
          <CardDescription>Temporarily block all business access to the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <span className="text-sm">
              Status:{' '}
              <Badge tone={cfg?.maintenanceMode ? 'danger' : 'success'}>
                {cfg?.maintenanceMode ? 'ON — businesses blocked' : 'OFF — normal'}
              </Badge>
            </span>
            <Button
              variant={cfg?.maintenanceMode ? 'outline' : 'primary'}
              loading={config.update.isPending}
              onClick={() => config.update.mutate({ maintenanceMode: !cfg?.maintenanceMode })}
            >
              {cfg?.maintenanceMode ? 'Turn off' : 'Turn on'}
            </Button>
          </div>
          <div>
            <Label htmlFor="mmsg">Maintenance message</Label>
            <Input
              id="mmsg"
              placeholder={cfg?.maintenanceMessage}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={!message}
              loading={config.update.isPending}
              onClick={() => config.update.mutate({ maintenanceMessage: message }, { onSuccess: () => setMessage('') })}
            >
              Save message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
