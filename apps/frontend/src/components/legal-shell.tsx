import Link from 'next/link';
import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

/** Shared chrome for the Privacy / Terms pages. */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            iTtEk<span className="text-primary">POS</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>

        <div className="mt-10 space-y-8">{children}</div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} iTtEk POS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/** A titled section of legal copy. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
