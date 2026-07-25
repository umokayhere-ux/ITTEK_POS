'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useRegister } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api';
import { BUSINESS_TYPES, registerSchema, type RegisterValues } from '@/lib/validators';

export default function RegisterPage() {
  const registerBusiness = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      currency: 'GHS',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // After a successful signup the business is pending approval — show a
  // confirmation instead of the form.
  if (registerBusiness.isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registration received</CardTitle>
          <CardDescription>Your business is pending approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{registerBusiness.data?.message}</p>
          <Link href="/login">
            <Button className="w-full">Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create your business</CardTitle>
        <CardDescription>
          Register your business. An administrator will review and approve your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => registerBusiness.mutate(values))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          noValidate
        >
          <div className="sm:col-span-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" {...register('businessName')} />
            <FieldError message={errors.businessName?.message} />
          </div>

          <div>
            <Label htmlFor="businessType">Business type</Label>
            <Select id="businessType" defaultValue="" {...register('businessType')}>
              <option value="" disabled>
                Select…
              </option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.businessType?.message} />
          </div>

          <div>
            <Label htmlFor="ownerName">Your name</Label>
            <Input id="ownerName" {...register('ownerName')} />
            <FieldError message={errors.ownerName?.message} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
            <FieldError message={errors.phone?.message} />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register('country')} />
            <FieldError message={errors.country?.message} />
          </div>

          <div>
            <Label htmlFor="currency">Currency (ISO code)</Label>
            <Input id="currency" maxLength={3} className="uppercase" {...register('currency')} />
            <FieldError message={errors.currency?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...register('timezone')} />
            <FieldError message={errors.timezone?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            <FieldError message={errors.password?.message} />
          </div>

          {registerBusiness.isError && (
            <p className="text-sm text-destructive sm:col-span-2">
              {getApiErrorMessage(registerBusiness.error)}
            </p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" loading={registerBusiness.isPending}>
              Register business
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
