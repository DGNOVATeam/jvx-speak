import { BookMarked, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { VocabularyPanelProps } from './types';

/**
 * Painel de vocabulário contextualizado da lição com inserção rápida e reprodução de áudio.
 */
export function VocabularyPanel({
  items,
  playingText,
  onInsertWord,
  onPlay,
  onOpenGlossary,
}: VocabularyPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)]">
          Toque na palavra para usar na frase ou no ícone para ouvir.
        </p>
        <button
          type="button"
          onClick={onOpenGlossary}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--jvx-border-gold)] bg-[var(--jvx-gold)]/10 px-2.5 py-1.5 text-xs font-semibold text-[#9A7B16] dark:text-[var(--jvx-gold)] hover:bg-[var(--jvx-gold)]/20 transition cursor-pointer"
        >
          <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
          Glossário Completo
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((w) => {
          const active = playingText === w.en;
          return (
            <div
              key={w.en}
              className={cn(
                'inline-flex items-center rounded-xl border text-xs overflow-hidden transition',
                active
                  ? 'border-[var(--jvx-gold)] bg-[var(--jvx-gold)]/10'
                  : 'border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]'
              )}
            >
              <button
                type="button"
                onClick={() => onInsertWord(w.en)}
                title={`Significado: ${w.pt} (clique para inserir)`}
                className="px-3 py-2 min-h-[40px] text-left hover:bg-[var(--jvx-gold)]/10 transition cursor-pointer"
              >
                <span className="font-semibold text-slate-900 dark:text-[var(--jvx-text-primary)]">
                  {w.en}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[var(--jvx-text-secondary)] ml-1.5">
                  ({w.pt})
                </span>
              </button>
              <button
                type="button"
                onClick={() => onPlay(w.en)}
                aria-label={`Ouvir palavra ${w.en}`}
                className={cn(
                  'px-2.5 py-2 min-h-[40px] border-l border-slate-200 dark:border-[var(--jvx-border-subtle)] transition cursor-pointer',
                  active
                    ? 'text-[var(--jvx-gold)] animate-pulse'
                    : 'text-slate-400 hover:text-[var(--jvx-gold)]'
                )}
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
