'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiSuccess } from '@/lib/types';
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  Package,
  Tags,
  Boxes,
  PackagePlus,
  Users,
  Truck,
  Receipt,
  HandCoins,
  Wallet,
  BarChart3,
  UserCog,
  Building2,
  CreditCard,
  Settings,
  LifeBuoy,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notification-bell';
import { useSession } from '@/hooks/use-auth';
import { authStorage } from '@/lib/auth-storage';
import { cn } from '@/lib/utils';

// Each item maps to a feature key. The owner configures which roles can access
// which features (Settings → Roles); the sidebar reflects the current user's
// effective feature list.
const NAV: { href: string; label: string; icon: typeof LayoutDashboard; feature: string }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' },
  { href: '/pos', label: 'Point of Sale', icon: ShoppingCart, feature: 'pos' },
  { href: '/sales', label: 'Sales', icon: ReceiptText, feature: 'sales' },
  { href: '/products', label: 'Products', icon: Package, feature: 'products' },
  { href: '/catalog', label: 'Catalog', icon: Tags, feature: 'catalog' },
  { href: '/inventory', label: 'Inventory', icon: Boxes, feature: 'inventory' },
  { href: '/purchases', label: 'Purchases', icon: PackagePlus, feature: 'purchases' },
  { href: '/customers', label: 'Customers', icon: Users, feature: 'customers' },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, feature: 'suppliers' },
  { href: '/expenses', label: 'Expenses', icon: Receipt, feature: 'expenses' },
  { href: '/debts', label: 'Debts', icon: HandCoins, feature: 'debts' },
  { href: '/cash-register', label: 'Cash Register', icon: Wallet, feature: 'cash_register' },
  { href: '/reports', label: 'Reports', icon: BarChart3, feature: 'reports' },
  { href: '/staff', label: 'Staff', icon: UserCog, feature: 'staff' },
  { href: '/branches', label: 'Branches', icon: Building2, feature: 'branches' },
  { href: '/billing', label: 'Subscriptions', icon: CreditCard, feature: 'billing' },
  { href: '/settings', label: 'Settings', icon: Settings, feature: 'settings' },
  { href: '/support', label: 'Support', icon: LifeBuoy, feature: 'support' },
];

interface SubscriptionInfo {
  status: 'trialing' | 'active' | 'expired';
  daysLeft: number | null;
  readOnly: boolean;
  plan: string;
}

/** Shows a trial countdown or an expired/read-only notice. */
function SubscriptionBanner() {
  const sub = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<SubscriptionInfo>>('/subscription');
      return data.data;
    },
  });

  const info = sub.data;
  if (!info) return null;

  if (info.readOnly) {
    return (
      <div className="border-b border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
        Your subscription has expired — the workspace is read-only. Please renew to continue selling.
      </div>
    );
  }
  if (info.status === 'trialing' && info.daysLeft !== null) {
    return (
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-sm text-amber-700 dark:text-amber-400">
        Free trial — {info.daysLeft} day{info.daysLeft === 1 ? '' : 's'} remaining.
      </div>
    );
  }
  return null;
}

interface AnnouncementItem {
  _id: string;
  title: string;
  body: string;
  level: 'info' | 'warning';
}

/** Shows active platform announcements from the super admin. */
function AnnouncementsBanner() {
  const query = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<AnnouncementItem[]>>('/announcements');
      return data.data;
    },
  });
  const items = query.data ?? [];
  if (items.length === 0) return null;
  return (
    <div>
      {items.map((a) => (
        <div
          key={a._id}
          className={`border-b px-6 py-2 text-sm ${
            a.level === 'warning'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'border-primary/20 bg-primary/5 text-foreground'
          }`}
        >
          <span className="font-medium">{a.title}</span> — {a.body}
        </div>
      ))}
    </div>
  );
}

/** Authenticated shell: sidebar navigation, top bar, and a client-side guard. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const [ready, setReady] = useState(false);

  const meQuery = useQuery({
    queryKey: ['me', 'shell'],
    enabled: ready,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ features: string[] }>>('/auth/me');
      return data.data.features ?? [];
    },
  });
  const allowedFeatures = meQuery.data;

  useEffect(() => {
    if (!authStorage.getAccessToken()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  // Keep users out of pages their role isn't permitted (menu is also hidden).
  useEffect(() => {
    if (!allowedFeatures) return;
    const current = NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
    if (current && !allowedFeatures.includes(current.feature)) {
      const first = NAV.find((n) => allowedFeatures.includes(n.feature));
      router.replace(first?.href ?? '/dashboard');
    }
  }, [allowedFeatures, pathname, router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2 px-5 py-4 text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            iT
          </span>
          iTtEk<span className="-ml-1 text-primary">POS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
          {NAV.filter((item) => !allowedFeatures || allowedFeatures.includes(item.feature)).map(
            ({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user?.name ?? '—'}</div>
              <div className="truncate text-xs capitalize text-muted-foreground">
                {user?.role?.replace(/_/g, ' ') ?? ''}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-6 py-3 backdrop-blur">
          <div className="text-sm font-semibold md:hidden">
            iTtEk<span className="text-primary">POS</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </header>
        <SubscriptionBanner />
        <AnnouncementsBanner />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
