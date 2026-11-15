import { AlertTriangle, CheckCircle2, Info, Lock, Sparkles, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'success' | 'info' | 'gold' | 'warning' | 'danger' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  showIcon?: boolean;
  className?: string;
}

const TONE_MAP: Record<BadgeTone, { classes: string; Icon: typeof Info }> = {
  success: {
    classes: 'bg-[#22C9A4]/15 text-[#0F8B6D] dark:text-[#22C9A4] border-[#22C9A4]/35',
    Icon: CheckCircle2,
  },
  info: {
    classes: 'bg-[#3B82F6]/15 text-[#1D4ED8] dark:text-[#60A5FA] border-[#3B82F6]/35',
    Icon: Info,
  },
  gold: {
    classes: 'bg-[#D4AF37]/15 text-[#9A7B16] dark:text-[#D4AF37] border-[#D4AF37]/40',
    Icon: Sparkles,
  },
  warning: {
    classes: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35',
    Icon: AlertTriangle,
  },
  danger: {
    classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35',
    Icon: XCircle,
  },
  neutral: {
    classes: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    Icon: Lock,
  },
};

/**
 * Selo semântico acessível: nunca depende exclusivamente de cor (sempre exibe ícone + texto).
 */
export function StatusBadge({
  label,
  tone = 'info',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const { classes, Icon } = TONE_MAP[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
