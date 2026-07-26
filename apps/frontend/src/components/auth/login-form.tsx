'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { FloatingInput } from '@/components/ui/floating-field';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api';
import { loginSchema, type LoginValues } from '@/lib/validators';

export function LoginForm() {
  const login = useLogin();
  const [needs2fa, setNeeds2fa] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginValues) {
    login.mutate(values, {
      onError: (err) => {
        const data = err instanceof AxiosError ? err.response?.data : undefined;
        if (data?.errors?.twoFactorRequired) setNeeds2fa(true);
      },
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your workspace to keep selling.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <FloatingInput id="email" label="Email" type="email" autoComplete="email" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <FloatingInput
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" {...register('rememberMe')} className="h-4 w-4 rounded border-input" />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        {needs2fa && (
          <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 p-3.5">
            <Label htmlFor="twoFactorToken" className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Two-factor code
            </Label>
            <FloatingInput
              id="twoFactorToken"
              label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="tracking-[0.3em]"
              {...register('twoFactorToken')}
            />
          </div>
        )}

        {login.isError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{getApiErrorMessage(login.error)}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          {needs2fa ? 'Verify & sign in' : 'Sign in'}
          {!login.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
