import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão de página com tipografia Montserrat para títulos e suporte a ações responsivas.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--jvx-gold)]">
            {eyebrow}
          </p>
        )}
        <h1 className="jvx-heading text-xl sm:text-2xl font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] flex items-center gap-2.5">
          {icon && <span className="shrink-0 text-[var(--jvx-gold)]">{icon}</span>}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[var(--jvx-text-secondary)] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
