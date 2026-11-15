import { AudioLines, Play, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AudioPhraseCardProps } from './types';

/**
 * Cartão de frase/chunk estrutural com botão de áudio confortável para toque (>= 44px)
 * e indicador visual de reprodução.
 */
export function AudioPhraseCard({
  phrase,
  translation,
  isPlaying = false,
  onPlay,
}: AudioPhraseCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 sm:p-3.5 flex items-center justify-between gap-3 transition',
        isPlaying
          ? 'border-[var(--jvx-gold)] bg-[var(--jvx-gold)]/10 dark:bg-[var(--jvx-surface-elevated)] shadow-sm'
          : 'border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/80 hover:border-[var(--jvx-gold)]/60'
      )}
    >
      <button
        type="button"
        onClick={() => onPlay(phrase)}
        aria-label={`Ouvir pronúncia de: ${phrase}`}
        aria-pressed={isPlaying}
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded-full border transition shrink-0 cursor-pointer',
          isPlaying
            ? 'border-[var(--jvx-gold)] bg-[var(--jvx-gold)] text-[var(--jvx-navy)] shadow-sm animate-pulse'
            : 'border-[var(--jvx-gold)]/40 bg-[var(--jvx-gold)]/15 text-[var(--jvx-gold)] hover:bg-[var(--jvx-gold)] hover:text-[var(--jvx-navy)]'
        )}
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-[var(--jvx-text-primary)] leading-snug">
          {phrase}
        </p>
        <p className="text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)] leading-relaxed">
          {translation}
        </p>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          'shrink-0 transition-colors',
          isPlaying
            ? 'text-[var(--jvx-gold)] animate-pulse'
            : 'text-slate-400/70 dark:text-[var(--jvx-text-secondary)]/50'
        )}
      >
        <AudioLines className="h-4 w-4" />
      </span>
    </div>
  );
}
