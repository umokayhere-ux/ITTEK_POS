'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useLogin } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api';
import { loginSchema, type LoginValues } from '@/lib/validators';

export default function LoginPage() {
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
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your iTtEk POS workspace to keep selling.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              className="h-11 pl-10"
              {...register('email')}
            />
          </div>
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" {...register('rememberMe')} className="h-4 w-4 rounded border-input" />
          Keep me signed in
        </label>

        {needs2fa && (
          <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 p-3.5">
            <Label htmlFor="twoFactorToken" className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Two-factor code
            </Label>
            <Input
              id="twoFactorToken"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="h-11 tracking-[0.3em]"
              {...register('twoFactorToken')}
            />
            <p className="text-xs text-muted-foreground">
              Enter the code from your authenticator app to finish signing in.
            </p>
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

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to iTtEk POS?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create a business account
        </Link>
      </p>
    </div>
  );
}
