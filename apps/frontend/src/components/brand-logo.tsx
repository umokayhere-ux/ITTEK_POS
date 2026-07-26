'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ApiSuccess } from '@/lib/types';

/**
 * Renders the company logo. It prefers the logo the super admin uploads in the
 * platform settings, then a static /logo.png, and finally the text wordmark —
 * so the page always shows something sensible and never a broken image.
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
  // Public branding endpoint — safe to call unauthenticated on the login page.
  const branding = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ logoUrl: string }>>('/platform/branding');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const sources = useMemo(
    () => [branding.data?.logoUrl, '/logo.png'].filter((s): s is string => !!s),
    [branding.data?.logoUrl],
  );
  const [idx, setIdx] = useState(0);
  // Restart from the best source whenever the managed logo arrives/changes.
  useEffect(() => setIdx(0), [branding.data?.logoUrl]);

  const src = sources[idx];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn('w-auto object-contain', className)}
        onError={() => setIdx((i) => i + 1)}
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
