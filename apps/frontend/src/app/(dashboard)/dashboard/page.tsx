'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSession } from '@/hooks/use-auth';
import { authStorage } from '@/lib/auth-storage';

const PLACEHOLDER_STATS = [
  { label: "Today's Sales", value: '—' },
  { label: 'Revenue (MTD)', value: '—' },
  { label: 'Inventory Value', value: '—' },
  { label: 'Low Stock Items', value: '—' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useSession();

  // Client-side guard. Server-enforced route protection (middleware + httpOnly
  // cookies) is part of the session-management module.
  useEffect(() => {
    if (!authStorage.getAccessToken()) router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-lg font-bold tracking-tight">
          iTtEk<span className="text-primary">POS</span>
        </span>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome{user ? `, ${user.name}` : ''}. Your workspace is ready — modules land here as they
          ship.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLACEHOLDER_STATS.map((stat) => (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Next up</CardTitle>
            <CardDescription>Modules planned for upcoming development sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>• RBAC & staff management</li>
              <li>• Product & category catalog</li>
              <li>• Inventory & stock movements</li>
              <li>• POS terminal & cash register</li>
              <li>• Customers, suppliers & debts</li>
              <li>• Reports & analytics</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
