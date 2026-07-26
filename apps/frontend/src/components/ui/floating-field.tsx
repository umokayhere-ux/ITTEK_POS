'use client';

import { forwardRef, useState, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const FLOAT_LABEL = cn(
  'pointer-events-none absolute left-3.5 top-2 text-xs font-medium text-muted-foreground transition-all',
  // When the field is empty (placeholder shown), drop the label to the middle.
  'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal',
  // On focus, float it back up and tint it.
  'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-primary',
);

const FIELD_BASE = cn(
  'peer h-14 w-full rounded-xl border border-input bg-card px-3.5 pt-5 pb-1.5 text-sm shadow-sm transition-colors',
  'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
);

/** Outlined input with a floating label; password fields get a reveal toggle. */
export const FloatingInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ id, label, type = 'text', className, ...props }, ref) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="relative">
      <input
        id={id}
        ref={ref}
        type={inputType}
        placeholder=" "
        className={cn(FIELD_BASE, 'placeholder:text-transparent', isPassword && 'pr-11', className)}
        {...props}
      />
      <label htmlFor={id} className={FLOAT_LABEL}>
        {label}
      </label>
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
});
FloatingInput.displayName = 'FloatingInput';

/** Outlined select with a permanently floated label (selects always show a value). */
export const FloatingSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }
>(({ id, label, className, children, ...props }, ref) => (
  <div className="relative">
    <select id={id} ref={ref} className={cn(FIELD_BASE, 'appearance-none pr-10', className)} {...props}>
      {children}
    </select>
    <label htmlFor={id} className="pointer-events-none absolute left-3.5 top-2 text-xs font-medium text-muted-foreground">
      {label}
    </label>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
));
FloatingSelect.displayName = 'FloatingSelect';
