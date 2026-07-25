'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getApiErrorMessage } from '@/lib/api';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');

  const reset = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { token, password }),
  });

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This password reset link is missing its token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password">
            <Button className="w-full">Request a new link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {reset.isSuccess ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Your password has been reset.</p>
            <Link href="/login">
              <Button className="w-full">Sign in</Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              reset.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {reset.isError && <p className="text-sm text-destructive">{getApiErrorMessage(reset.error)}</p>}
            <Button type="submit" className="w-full" loading={reset.isPending}>
              Reset password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
