'use client';

import { useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FileSpreadsheet,
  Image as ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Wrench,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AnnouncementsSection } from '@/components/admin/announcements-section';
import { BrandingCard } from '@/components/admin/branding-card';
import { BusinessesSection } from '@/components/admin/businesses-section';
import { MaintenanceSection } from '@/components/admin/maintenance-section';
import { OverviewSection } from '@/components/admin/overview-section';
import { ReportsSection } from '@/components/admin/reports-section';
import { TicketsSection } from '@/components/admin/tickets-section';
import { usePlatformStats, useTickets } from '@/hooks/use-admin';
import { adminStorage } from '@/lib/admin';
import { cn } from '@/lib/utils';

type SectionKey =
  | 'overview'
  | 'businesses'
  | 'reports'
  | 'announcements'
  | 'tickets'
  | 'branding'
  | 'maintenance';

const NAV: { key: SectionKey; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'businesses', label: 'Businesses', icon: Building2 },
  { key: 'reports', label: 'Reports & exports', icon: FileSpreadsheet },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'tickets', label: 'Support tickets', icon: LifeBuoy },
  { key: 'branding', label: 'Branding', icon: ImageIcon },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
];

const TITLES: Record<SectionKey, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Platform activity at a glance.' },
  businesses: { title: 'Businesses', subtitle: 'Review, approve and manage every business.' },
  reports: { title: 'Reports & exports', subtitle: 'Per-business totals — download as Excel or PDF.' },
  announcements: { title: 'Announcements', subtitle: 'Broadcast messages to all businesses.' },
  tickets: { title: 'Support tickets', subtitle: 'Respond to messages from businesses.' },
  branding: { title: 'Branding', subtitle: 'The logo shown on the login screens.' },
  maintenance: { title: 'Maintenance', subtitle: 'Control platform-wide access.' },
};

export function AdminShell() {
  const router = useRouter();
  const [section, setSection] = useState<SectionKey>('overview');

  const stats = usePlatformStats();
  const tickets = useTickets();
  const pendingCount = stats.data?.pending ?? 0;
  const openTickets = (tickets.data ?? []).filter((t) => t.status !== 'closed').length;
  const badges: Partial<Record<SectionKey, number>> = {
    businesses: pendingCount,
    tickets: openTickets,
  };

  const admin = adminStorage.getAdmin();

  function signOut() {
    adminStorage.clear();
    router.replace('/admin/login');
  }

  const NavButton = ({ item, horizontal }: { item: (typeof NAV)[number]; horizontal?: boolean }) => {
    const active = section === item.key;
    const badge = badges[item.key];
    return (
      <button
        onClick={() => setSection(item.key)}
        aria-current={active}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          horizontal ? 'whitespace-nowrap' : 'w-full',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <item.icon className="h-[18px] w-[18px] flex-none" />
        <span>{item.label}</span>
        {badge ? (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            {badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <BrandLogo
            className="h-7"
            fallback={<span className="text-lg font-bold tracking-tight">iTtEk<span className="text-primary">POS</span></span>}
          />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </p>
          {NAV.map((item) => (
            <NavButton key={item.key} item={item} />
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-3 px-2">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {(admin?.name ?? 'SA').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{admin?.name ?? 'Super Admin'}</div>
              <div className="truncate text-xs text-muted-foreground">{admin?.email}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <div className="lg:hidden">
            <BrandLogo
              className="h-6"
              fallback={<span className="font-bold tracking-tight">iTtEk<span className="text-primary">POS</span></span>}
            />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold tracking-tight">{TITLES[section].title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="lg:hidden" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <NavButton key={item.key} item={item} horizontal />
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mb-5 lg:hidden">
            <h1 className="text-xl font-bold tracking-tight">{TITLES[section].title}</h1>
            <p className="text-sm text-muted-foreground">{TITLES[section].subtitle}</p>
          </div>
          <div className="mb-5 hidden lg:block">
            <p className="text-sm text-muted-foreground">{TITLES[section].subtitle}</p>
          </div>

          <div className="mx-auto max-w-6xl">
            {section === 'overview' && <OverviewSection />}
            {section === 'businesses' && <BusinessesSection />}
            {section === 'reports' && <ReportsSection />}
            {section === 'announcements' && <AnnouncementsSection />}
            {section === 'tickets' && <TicketsSection />}
            {section === 'branding' && <BrandingCard />}
            {section === 'maintenance' && <MaintenanceSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
