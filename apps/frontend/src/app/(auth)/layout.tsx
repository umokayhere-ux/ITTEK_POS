import Link from 'next/link';
import { type ReactNode } from 'react';
import { BarChart3, Boxes, ScanLine, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const HIGHLIGHTS = [
  { icon: ScanLine, title: 'Fast point of sale', desc: 'Ring up sales, scan barcodes and print receipts in seconds.' },
  { icon: Boxes, title: 'Stock across branches', desc: 'Track inventory, transfers and reorders in real time.' },
  { icon: BarChart3, title: 'Reports that add up', desc: 'Sales, profit and expenses at a glance, per branch or business-wide.' },
  { icon: ShieldCheck, title: 'Role-based access', desc: 'Give each staff member exactly what they need — nothing more.' },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Ambient decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 0%, white 0, transparent 35%), radial-gradient(circle at 60% 100%, white 0, transparent 45%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-base font-extrabold backdrop-blur">
              iT
            </span>
            iTtEk<span className="opacity-80">POS</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight">
            Run your shop, not your spreadsheets.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
            The all-in-one platform to sell, manage stock and understand your business — built for
            shops with one till or many branches.
          </p>

          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-primary-foreground/75">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} iTtEk POS. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col bg-background">
        <div className="flex items-center justify-between px-5 py-4 lg:justify-end">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
              iT
            </span>
            iTtEk<span className="text-primary">POS</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
