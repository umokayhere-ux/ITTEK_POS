import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-lg font-bold tracking-tight">
          iTtEk<span className="text-primary">POS</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Start free trial</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
          Manage. Monitor. Grow.
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Run your entire retail business from one dashboard
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          iTtEk POS is a multi-tenant point-of-sale and shop management platform for supermarkets,
          pharmacies, boutiques, and every retail business in between.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/register">
            <Button size="lg">Create your business</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              I already have an account
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} iTtEk POS. All rights reserved.
      </footer>
    </div>
  );
}
