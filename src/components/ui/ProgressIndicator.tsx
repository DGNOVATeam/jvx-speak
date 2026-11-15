import { cn } from '@/lib/cn';

export interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  tone?: 'gold' | 'success' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const BAR_TONE: Record<NonNullable<ProgressIndicatorProps['tone']>, string> = {
  gold: 'bg-[var(--jvx-gold)]',
  success: 'bg-[var(--jvx-success)]',
  info: 'bg-[var(--jvx-info)]',
};

/**
 * Barra de progresso acessível com `role="progressbar"` e rótulo opcional.
 */
export function ProgressIndicator({
  value,
  max = 100,
  label,
  showPercentage = true,
  tone = 'success',
  size = 'md',
  className,
}: ProgressIndicatorProps) {
  const safeMax = max > 0 ? max : 100;
  const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && (
            <span className="font-medium text-slate-600 dark:text-[var(--jvx-text-secondary)] truncate">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] tabular-nums">
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progresso'}
        className={cn(
          'w-full rounded-full bg-slate-200 dark:bg-[#07182E] overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', BAR_TONE[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
