import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CreditCard,
  Printer,
  ScanLine,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const FEATURES = [
  { icon: Store, title: 'Point of Sale', body: 'Fast checkout with cart, split payments, change and thermal receipts.' },
  { icon: Boxes, title: 'Inventory', body: 'Real-time stock across branches with a complete movement ledger.' },
  { icon: Users, title: 'Customers & suppliers', body: 'Profiles, credit sales and supplier balances in one place.' },
  { icon: CreditCard, title: 'Purchases & expenses', body: 'Receive stock, track costs and record every expense.' },
  { icon: BarChart3, title: 'Reports', body: 'Sales summaries, best sellers and profit at a glance.' },
  { icon: ShieldCheck, title: 'Secure & multi-tenant', body: 'Every business fully isolated, with role-based access.' },
];

const STATS = [
  { value: '1 dashboard', label: 'Every branch, one login' },
  { value: 'Real-time', label: 'Stock & sales, instantly' },
  { value: 'Role-based', label: 'Access you control' },
  { value: '80mm', label: 'Thermal receipts, ready' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <span className="text-lg font-extrabold tracking-tight">
            iTtEk<span className="text-primary">POS</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#why" className="transition-colors hover:text-foreground">Why iTtEk</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-40" />
          {/* Ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(closest-side, hsl(var(--primary)), transparent)' }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
            {/* Copy */}
            <div>
              <h1
                className="landing-rise text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
                style={{ animationDelay: '0.06s' }}
              >
                The <span className="text-gradient">point of sale</span> built for growing retail
              </h1>
              <p
                className="landing-rise mt-5 max-w-lg text-lg text-muted-foreground"
                style={{ animationDelay: '0.12s' }}
              >
                Run sales, inventory, customers, purchases and reports for every branch of your
                business — from one clean dashboard.
              </p>
              <div className="landing-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '0.18s' }}>
                <Link href="/register">
                  <Button size="lg">
                    Create your business <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">Sign in</Button>
                </Link>
              </div>
              <p
                className="landing-rise mt-5 flex items-center gap-2 text-sm text-muted-foreground"
                style={{ animationDelay: '0.24s' }}
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                Free to start · Approved businesses go live in minutes
              </p>
            </div>

            {/* Product visual */}
            <div className="landing-rise" style={{ animationDelay: '0.15s' }}>
              <DashboardMock />
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section className="border-y border-border bg-muted/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 px-6 py-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="px-4 py-6 text-center">
                <div className="text-2xl font-extrabold tracking-tight text-foreground">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything your shop needs</h2>
            <p className="mt-3 text-muted-foreground">
              One platform for the front counter and the back office — no spreadsheets, no guesswork.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why band */}
        <section id="why" className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built for the counter, the stockroom and the office
              </h2>
              <p className="mt-4 text-muted-foreground">
                Ring up a sale in seconds, watch stock update live across branches, and see exactly
                how the business is doing — all in one place.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: ScanLine, t: 'Sell fast', d: 'Barcode scanning, split payments and instant change.' },
                  { icon: Printer, t: 'Print anywhere', d: 'Clean 80mm thermal receipts with your logo.' },
                  { icon: Boxes, t: 'Never oversell', d: 'Live stock per branch with low-stock alerts.' },
                ].map(({ icon: Icon, t, d }) => (
                  <li key={t} className="flex gap-3.5">
                    <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{t}</span>
                      <span className="block text-sm text-muted-foreground">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:pl-6">
              <PosMock />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-pop">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 85% 30%, white 0, transparent 35%)' }}
            />
            <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
              Start selling smarter today
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Create your business account and go live once approved. No setup fees.
            </p>
            <div className="relative mt-8 flex justify-center">
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-white/30 bg-white text-primary hover:bg-white/90">
                  Create your business <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} iTtEk POS. All rights reserved.</span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/admin/login" className="hover:text-foreground">Platform admin</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** A stylized dashboard preview for the hero (pure CSS/SVG, no data). */
function DashboardMock() {
  return (
    <div className="landing-float rounded-2xl border border-border bg-card shadow-pop">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="mx-auto rounded-md bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          app.ittek.io/dashboard
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'Sales today', v: 'GHS 4,820', c: 'text-primary' },
            { l: 'Orders', v: '63', c: 'text-green-600 dark:text-green-400' },
            { l: 'Low stock', v: '4', c: 'text-amber-600 dark:text-amber-400' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border p-3">
              <div className="text-[10px] text-muted-foreground">{s.l}</div>
              <div className={`mt-1 text-sm font-bold ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">This week</span>
            <span className="text-[10px] text-muted-foreground">+12.4%</span>
          </div>
          <svg viewBox="0 0 320 110" className="w-full text-primary" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,86 C40,64 62,44 92,52 C132,62 150,26 192,38 C236,50 266,14 320,26 L320,110 L0,110 Z" fill="url(#area)" />
            <path d="M0,86 C40,64 62,44 92,52 C132,62 150,26 192,38 C236,50 266,14 320,26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="space-y-2">
          {['Rice 5kg', 'Cooking Oil 2L', 'Sugar 1kg'].map((n, i) => (
            <div key={n} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                {n.charAt(0)}
              </span>
              <span className="text-xs font-medium">{n}</span>
              <span className="ml-auto text-xs text-muted-foreground">×{[12, 8, 20][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A stylized POS/receipt preview for the "why" section. */
function PosMock() {
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-5 shadow-pop">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold">Current sale</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Kofi Mensah
        </span>
      </div>
      <div className="space-y-2">
        {[
          ['Rice 5kg', '×2', '124.00'],
          ['Cooking Oil 2L', '×1', '38.50'],
          ['Sardines Tin', '×3', '27.00'],
        ].map(([n, q, p]) => (
          <div key={n} className="flex items-center gap-3 text-sm">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-[10px] font-bold">{q}</span>
            <span className="font-medium">{n}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">{p}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-dashed border-border pt-3">
        <div className="flex items-center justify-between text-lg font-extrabold">
          <span>Total</span>
          <span className="tabular-nums">GHS 189.50</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <span className="rounded-lg bg-muted py-2">Cash</span>
          <span className="rounded-lg bg-muted py-2">Card</span>
          <span className="rounded-lg bg-muted py-2">MoMo</span>
        </div>
        <div className="mt-3 rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground">
          Charge GHS 189.50
        </div>
      </div>
    </div>
  );
}
