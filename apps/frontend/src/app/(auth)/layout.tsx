import Link from 'next/link';
import { type ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { MARKET_IMAGE } from '@/lib/brand';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      {/* Marketplace backdrop (gradient sits under the image as a fallback). */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-primary bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom right, hsl(243 75% 20% / 0.82), hsl(222 47% 8% / 0.86)), url(${MARKET_IMAGE})`,
        }}
      />

      {/* Top bar over the image */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-white drop-shadow">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-sm font-extrabold backdrop-blur">
            iT
          </span>
          iTtEk<span className="text-white/70">POS</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
