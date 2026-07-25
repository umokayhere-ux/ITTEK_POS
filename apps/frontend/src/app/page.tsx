import Link from 'next/link';
import { BarChart3, Boxes, CreditCard, ShieldCheck, Store, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const FEATURES = [
  { icon: Store, title: 'Point of Sale', body: 'Fast checkout with cart, payments, change and receipts.' },
  { icon: Boxes, title: 'Inventory', body: 'Real-time stock across branches with a full movement ledger.' },
  { icon: Users, title: 'Customers & suppliers', body: 'Profiles, credit sales and supplier balances in one place.' },
  { icon: CreditCard, title: 'Purchases & expenses', body: 'Receive stock, track costs and record every expense.' },
  { icon: BarChart3, title: 'Reports', body: 'Sales summaries, best sellers and profit at a glance.' },
  { icon: ShieldCheck, title: 'Secure & multi-tenant', body: 'Each business fully isolated, with role-based access.' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            iTtEk<span className="text-primary">POS</span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              Manage. Monitor. Grow.
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              The <span className="text-gradient">point of sale</span> built for growing retail
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Run sales, inventory, customers, purchases and reports for every branch of your
              business from one clean dashboard.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/register">
                <Button size="lg">Create your business</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} iTtEk POS. All rights reserved.</span>
          <Link href="/admin/login" className="hover:text-foreground">
            Platform admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
