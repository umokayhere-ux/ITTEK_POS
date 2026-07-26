'use client';

import { useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

/**
 * A single auth card that switches between the sign-in and registration forms.
 * Keeps the address bar in sync (/login ⇄ /register) without a full navigation.
 */
export function AuthPanel({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  function switchTo(next: Mode) {
    setMode(next);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/${next}`);
    }
  }

  return (
    <div
      className={cn(
        'w-full transition-[max-width] duration-300',
        mode === 'login' ? 'max-w-md' : 'max-w-2xl',
      )}
    >
      <div className="rounded-2xl border border-white/20 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-white/10">
        <div className="mb-6 flex justify-center">
          <BrandLogo className="h-12" />
        </div>

        {/* Animated segmented switch */}
        <div className="relative mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-card shadow-sm transition-transform duration-300 ease-out"
            style={{ transform: mode === 'register' ? 'translateX(100%)' : 'translateX(0)' }}
          />
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchTo(m)}
              aria-pressed={mode === m}
              className={cn(
                'relative z-10 rounded-lg py-2.5 text-sm font-semibold transition-colors',
                mode === m ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Active form (re-mounts on switch for a subtle fade-in) */}
        <div key={mode} className="animate-[authfade_260ms_ease]">
          {mode === 'login' ? <LoginForm /> : <RegisterForm onDone={() => switchTo('login')} />}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-white/80 drop-shadow">
        {mode === 'login' ? (
          <>
            New to iTtEk POS?{' '}
            <button
              type="button"
              onClick={() => switchTo('register')}
              className="font-semibold text-white underline-offset-2 hover:underline"
            >
              Create a business account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchTo('login')}
              className="font-semibold text-white underline-offset-2 hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
