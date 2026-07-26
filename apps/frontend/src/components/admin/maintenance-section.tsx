'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlatformConfig } from '@/hooks/use-admin';

export function MaintenanceSection() {
  const config = usePlatformConfig();
  const [message, setMessage] = useState('');
  const cfg = config.query.data;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Maintenance mode</CardTitle>
        <CardDescription>Temporarily block all business access to the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
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
  );
}
