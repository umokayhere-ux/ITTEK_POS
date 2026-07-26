'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { AlertCircle, ArrowRight, CheckCircle2, Mail, Phone, Store, User } from 'lucide-react';
import { forwardRef, type ComponentType, type InputHTMLAttributes } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PasswordInput } from '@/components/ui/password-input';
import { useRegister } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api';
import { COUNTRIES, detectedTimezone, timezoneOptions } from '@/lib/geo';
import { BUSINESS_TYPES, registerSchema, type RegisterValues } from '@/lib/validators';

// Ensure the visitor's own timezone is always selectable, even on the fallback list.
const TIMEZONES = (() => {
  const list = timezoneOptions();
  const detected = detectedTimezone();
  return detected && !list.includes(detected) ? [detected, ...list] : list;
})();

const IconField = forwardRef<
  HTMLInputElement,
  { icon: ComponentType<{ className?: string }> } & InputHTMLAttributes<HTMLInputElement>
>(({ icon: Icon, ...props }, ref) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input ref={ref} className="h-11 pl-10" {...props} />
  </div>
));
IconField.displayName = 'IconField';

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
      timezone: detectedTimezone(),
    },
  });

  // After a successful signup the business is pending approval — show a
  // confirmation instead of the form.
  if (registerBusiness.isSuccess) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Registration received</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {registerBusiness.data?.message ??
            'Your business is pending approval. We’ll email you as soon as it’s reviewed.'}
        </p>
        <Link href="/login" className="mt-6 inline-block w-full">
          <Button size="lg" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl py-4">
      <BrandLogo className="mb-6 h-12" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Create your business</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set up your workspace in a minute. An administrator reviews and approves new accounts.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => registerBusiness.mutate(values))}
        className="space-y-6"
        noValidate
      >
        {/* Business */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Business details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="businessName">Business name</Label>
              <IconField id="businessName" icon={Store} placeholder="e.g. Accra Main Market" {...register('businessName')} />
              <FieldError message={errors.businessName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="businessType">Business type</Label>
              <Select id="businessType" defaultValue="" className="h-11" {...register('businessType')}>
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

            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Select id="country" defaultValue="" className="h-11" {...register('country')}>
                <option value="" disabled>
                  Select a country…
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.country?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency (ISO code)</Label>
              <Input id="currency" maxLength={3} className="h-11 uppercase" placeholder="GHS" {...register('currency')} />
              <FieldError message={errors.currency?.message} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select id="timezone" className="h-11" {...register('timezone')}>
                <option value="" disabled>
                  Select a timezone…
                </option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.timezone?.message} />
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your account
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ownerName">Your name</Label>
              <IconField id="ownerName" icon={User} placeholder="Full name" {...register('ownerName')} />
              <FieldError message={errors.ownerName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <IconField id="phone" icon={Phone} type="tel" placeholder="+233…" {...register('phone')} />
              <FieldError message={errors.phone?.message} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <IconField id="email" icon={Mail} type="email" autoComplete="email" placeholder="you@business.com" {...register('email')} />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                {...register('password')}
              />
              <FieldError message={errors.password?.message} />
            </div>
          </div>
        </div>

        {registerBusiness.isError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{getApiErrorMessage(registerBusiness.error)}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={registerBusiness.isPending}>
          Create business account
          {!registerBusiness.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
