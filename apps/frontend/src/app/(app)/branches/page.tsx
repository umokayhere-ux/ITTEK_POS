'use client';

import { BranchesSection } from '@/components/settings/branches-section';

export default function BranchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="text-sm text-muted-foreground">Manage your business locations.</p>
      </div>
      <BranchesSection />
    </div>
  );
}
