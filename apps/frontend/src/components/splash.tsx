'use client';

import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { MARKET_IMAGE } from '@/lib/brand';

/**
 * Brief branded splash over a marketplace image, shown once per browser session
 * on first load. Fades out on its own and respects reduced-motion.
 */
export function Splash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('ittek-splash-seen')) return;
    sessionStorage.setItem('ittek-splash-seen', '1');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setShow(true);
    const hold = reduce ? 500 : 1500;
    const leaveAt = setTimeout(() => setLeaving(true), hold);
    const removeAt = setTimeout(() => setShow(false), hold + 500);
    return () => {
      clearTimeout(leaveAt);
      clearTimeout(removeAt);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-cover bg-center transition-opacity duration-500"
      style={{
        opacity: leaving ? 0 : 1,
        backgroundImage: `linear-gradient(to bottom right, hsl(243 75% 18% / 0.9), hsl(222 47% 6% / 0.94)), url(${MARKET_IMAGE})`,
      }}
    >
      <div className="animate-[authfade_400ms_ease] text-center">
        <BrandLogo
          className="mx-auto h-16"
          fallback={
            <span className="text-4xl font-extrabold tracking-tight text-white">
              iTtEk<span className="text-white/70">POS</span>
            </span>
          }
        />
        <p className="mt-4 text-sm font-medium tracking-wide text-white/80">
          Manage. Monitor. Grow.
        </p>
        <div className="mx-auto mt-6 h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      </div>
    </div>
  );
}
