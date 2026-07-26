'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field';
import { useRegister } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api';
import { COUNTRIES, detectedTimezone, timezoneOptions } from '@/lib/geo';
import { cn } from '@/lib/utils';
import { BUSINESS_TYPES, registerSchema, type RegisterValues } from '@/lib/validators';

// Ensure the visitor's own timezone is always selectable, even on the fallback list.
const TIMEZONES = (() => {
  const list = timezoneOptions();
  const detected = detectedTimezone();
  return detected && !list.includes(detected) ? [detected, ...list] : list;
})();

const STEPS = [
  { title: 'Business', desc: 'Your shop details' },
  { title: 'Account', desc: 'Owner sign-in' },
] as const;

// Fields validated before advancing from each step.
const STEP_FIELDS: Path<RegisterValues>[][] = [
  ['businessName', 'businessType', 'country', 'currency', 'timezone'],
  ['ownerName', 'phone', 'email', 'password'],
];

export function RegisterForm({ onDone }: { onDone?: () => void }) {
  const registerBusiness = useRegister();
  const [step, setStep] = useState(0);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { currency: 'GHS', timezone: detectedTimezone() },
  });

  async function next() {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  if (registerBusiness.isSuccess) {
    return (
      <div className="py-2 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight">Registration received</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {registerBusiness.data?.message ??
            'Your business is pending approval. We’ll email you as soon as it’s reviewed.'}
        </p>
        <Button size="lg" className="mt-6 w-full" onClick={() => onDone?.()}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Create your business</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Just two quick steps. An administrator reviews new accounts.
        </p>
      </div>

      {/* Stepper */}
      <ol className="mb-7 flex items-center">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.title} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className="flex items-center gap-2.5 text-left"
              >
                <span
                  className={cn(
                    'grid h-8 w-8 flex-none place-items-center rounded-full border text-sm font-semibold transition-colors',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active && 'border-primary text-primary',
                    !done && !active && 'border-border text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className="hidden sm:block">
                  <span className={cn('block text-sm font-semibold', active || done ? 'text-foreground' : 'text-muted-foreground')}>
                    {s.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.desc}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={cn('mx-3 h-px flex-1 transition-colors', done ? 'bg-primary' : 'bg-border')} />
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit((values) => registerBusiness.mutate(values))} noValidate>
        {/* Step 1 — Business */}
        <div className={cn('space-y-4', step !== 0 && 'hidden')}>
          <div>
            <FloatingInput id="businessName" label="Business name" {...register('businessName')} />
            <FieldError message={errors.businessName?.message} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FloatingSelect id="businessType" label="Business type" defaultValue="" {...register('businessType')}>
                <option value="" disabled>
                  Select…
                </option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </FloatingSelect>
              <FieldError message={errors.businessType?.message} />
            </div>
            <div>
              <FloatingSelect id="country" label="Country" defaultValue="" {...register('country')}>
                <option value="" disabled>
                  Select a country…
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FloatingSelect>
              <FieldError message={errors.country?.message} />
            </div>
            <div>
              <FloatingInput id="currency" label="Currency (ISO)" maxLength={3} className="uppercase" {...register('currency')} />
              <FieldError message={errors.currency?.message} />
            </div>
            <div>
              <FloatingSelect id="timezone" label="Timezone" {...register('timezone')}>
                <option value="" disabled>
                  Select…
                </option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </FloatingSelect>
              <FieldError message={errors.timezone?.message} />
            </div>
          </div>
        </div>

        {/* Step 2 — Account */}
        <div className={cn('space-y-4', step !== 1 && 'hidden')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FloatingInput id="ownerName" label="Your name" {...register('ownerName')} />
              <FieldError message={errors.ownerName?.message} />
            </div>
            <div>
              <FloatingInput id="phone" label="Phone" type="tel" {...register('phone')} />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>
          <div>
            <FloatingInput id="email" label="Email" type="email" autoComplete="email" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <FloatingInput id="password" label="Password" type="password" autoComplete="new-password" {...register('password')} />
            <FieldError message={errors.password?.message} />
          </div>
        </div>

        {registerBusiness.isError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{getApiErrorMessage(registerBusiness.error)}</span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" className="flex-1" onClick={next}>
              Next step <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="lg" className="flex-1" loading={registerBusiness.isPending}>
              Create business account
              {!registerBusiness.isPending && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
