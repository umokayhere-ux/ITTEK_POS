'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAdminLogin } from '@/hooks/use-admin';
import { getAdminErrorMessage } from '@/lib/admin';
import { MARKET_IMAGE } from '@/lib/brand';

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => router.push('/admin') });
  }

  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-primary bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom right, hsl(243 75% 20% / 0.82), hsl(222 47% 8% / 0.9)), url(${MARKET_IMAGE})`,
        }}
      />

      <header className="relative z-10 flex items-center justify-end px-5 py-4 sm:px-8">
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <BrandLogo className="h-12" />
          </div>

          <div className="rounded-2xl border border-white/20 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-white/10">
            <div className="mb-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Platform administration</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to manage businesses and the platform.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@ittek.io"
                    className="h-11 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {login.isError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <span>{getAdminErrorMessage(login.error)}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
                Sign in
                {!login.isPending && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-white/70 drop-shadow">
            Restricted area — authorized platform staff only.
          </p>
        </div>
      </main>
    </div>
  );
}
