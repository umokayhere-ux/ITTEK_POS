'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { adminStorage } from '@/lib/admin';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!adminStorage.getToken()) router.replace('/admin/login');
    else setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return <AdminShell />;
}
