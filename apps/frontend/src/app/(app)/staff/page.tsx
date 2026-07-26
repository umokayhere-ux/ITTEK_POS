'use client';

import { StaffSection } from '@/components/settings/staff-section';

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
        <p className="text-sm text-muted-foreground">Manage your team and their roles.</p>
      </div>
      <StaffSection />
    </div>
  );
}
