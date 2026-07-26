'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BusinessSection } from '@/components/settings/business-section';
import { ActivitySection } from '@/components/settings/activity-section';
import { SecuritySection } from '@/components/settings/security-section';
import { RolesSection } from '@/components/settings/roles-section';

const TABS = [
  { key: 'business', label: 'Business' },
  { key: 'roles', label: 'Roles' },
  { key: 'security', label: 'Security' },
  { key: 'activity', label: 'Activity' },
] as const;

export default function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('business');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your business, branches and staff.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? 'primary' : 'outline'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {tab === 'business' && <BusinessSection />}
          {tab === 'roles' && <RolesSection />}
          {tab === 'security' && <SecuritySection />}
          {tab === 'activity' && <ActivitySection />}
        </CardContent>
      </Card>
    </div>
  );
}
