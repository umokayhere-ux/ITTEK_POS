'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Renders the iTtEk company logo from /logo.png. If the file isn't present yet
 * it falls back to the text wordmark, so the page never shows a broken image.
 * Drop the logo at apps/frontend/public/logo.png (transparent PNG recommended).
 */
export function BrandLogo({
  className,
  fallback,
  alt = 'iTtEk Solutions',
}: {
  className?: string;
  fallback?: ReactNode;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.png"
        alt={alt}
        className={cn('w-auto object-contain', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <>
      {fallback ?? (
        <span className="text-2xl font-bold tracking-tight">
          iTtEk<span className="text-primary">POS</span>
        </span>
      )}
    </>
  );
}
