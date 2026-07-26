import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'green' | 'amber' | 'purple' | 'sky' | 'red';

const chips: Record<Tone, string> = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
  sky: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  trend,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  trend?: { value: string; up?: boolean };
  hint?: string;
}) {
  return (
    <div className="shadow-card rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', chips[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              trend.up
                ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
