import { CheckCircle2, Volume2, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { GrammarCardProps } from './types';

/**
 * Cartão de regra gramatical prática com contraste acessível (ícone + rótulo) e áudio de exemplo.
 */
export function GrammarCard({
  rule,
  isPlaying = false,
  onPlay,
}: GrammarCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/85 p-3.5 sm:p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2.5">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[var(--jvx-text-primary)] leading-snug">
          {rule.title}
        </h3>
        <button
          type="button"
          onClick={() => onPlay(rule.audioExample)}
          aria-label={`Ouvir exemplo da regra: ${rule.title}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 min-h-[36px] text-[11px] font-semibold transition shrink-0 cursor-pointer',
            isPlaying
              ? 'border-[var(--jvx-gold)] bg-[var(--jvx-gold)] text-[var(--jvx-navy)] animate-pulse'
              : 'border-[var(--jvx-border-gold)] bg-[var(--jvx-gold)]/10 text-[#9A7B16] dark:text-[var(--jvx-gold)] hover:bg-[var(--jvx-gold)]/20'
          )}
        >
          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Ouvir</span>
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-[var(--jvx-text-secondary)] leading-relaxed">
        {rule.explanation}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 px-3 py-2 text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong className="font-bold">Evite:</strong> {rule.dontSay}
          </span>
        </div>
        <div className="rounded-lg bg-[#22C9A4]/10 border border-[#22C9A4]/30 px-3 py-2 text-[#0F8B6D] dark:text-[#22C9A4] flex items-start gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong className="font-bold">Use:</strong> {rule.sayInstead}
          </span>
        </div>
      </div>
    </article>
  );
}
