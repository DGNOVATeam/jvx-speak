import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ContentCardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'highlight' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<ContentCardProps['variant']>, string> = {
  default:
    'bg-white dark:bg-[var(--jvx-surface-card)] border-slate-200 dark:border-[var(--jvx-border-subtle)]',
  elevated:
    'bg-white dark:bg-[var(--jvx-surface-elevated)] border-slate-200 dark:border-[var(--jvx-border-subtle)] shadow-[var(--jvx-shadow-card)]',
  highlight:
    'bg-white dark:bg-[var(--jvx-surface-card)] border-[var(--jvx-gold)]/50 dark:border-[var(--jvx-border-gold)] shadow-[var(--jvx-shadow-card)]',
  subtle:
    'bg-slate-50 dark:bg-[var(--jvx-surface-subtle)] border-slate-200 dark:border-[var(--jvx-border-subtle)]',
};

const PADDING_CLASSES: Record<NonNullable<ContentCardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3.5 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-5 sm:p-8',
};

/**
 * Cartão base do Design System JVX SPEAK 2.0.
 */
export function ContentCard({
  children,
  variant = 'default',
  padding = 'md',
  className,
}: ContentCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border transition-colors min-w-0',
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        className
      )}
    >
      {children}
    </section>
  );
}
