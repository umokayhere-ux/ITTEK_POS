'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getApiErrorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const forgot = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { email }),
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        {forgot.isSuccess ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If an account exists for {email}, a reset link has been sent. Check your inbox.
            </p>
            <Link href="/login">
              <Button className="w-full">Back to sign in</Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              forgot.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {forgot.isError && <p className="text-sm text-destructive">{getApiErrorMessage(forgot.error)}</p>}
            <Button type="submit" className="w-full" loading={forgot.isPending}>
              Send reset link
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
