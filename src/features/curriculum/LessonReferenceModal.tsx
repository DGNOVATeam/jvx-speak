import { BookMarked, Lightbulb, Volume2, X } from 'lucide-react';
import { GrammarCard } from '@/components/pedagogy';
import type { GlossaryGroup, GrammarRule } from './lessonPedagogy';

interface LessonReferenceModalProps {
  mode: 'glossary' | 'grammar' | null;
  lessonTitle: string;
  glossary: GlossaryGroup[];
  grammarRules: GrammarRule[];
  playingText: string | null;
  onPlay: (text: string) => void;
  onClose: () => void;
}

export function LessonReferenceModal({
  mode,
  lessonTitle,
  glossary,
  grammarRules,
  playingText,
  onPlay,
  onClose,
}: LessonReferenceModalProps) {
  if (!mode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'glossary' ? 'Glossário & Vocabulário Completo' : 'Regras Gramaticais'}
    >
      <div className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-2xl border border-[var(--jvx-border-gold)] bg-white dark:bg-[var(--jvx-surface-card)] text-slate-900 dark:text-[var(--jvx-text-primary)] shadow-2xl overflow-hidden jvx-safe-bottom">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-[var(--jvx-border-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {mode === 'glossary' ? (
              <BookMarked className="h-5 w-5 text-[var(--jvx-gold)] shrink-0" aria-hidden="true" />
            ) : (
              <Lightbulb className="h-5 w-5 text-[var(--jvx-gold)] shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <h3 className="jvx-heading text-sm sm:text-base font-bold truncate">
                {mode === 'glossary'
                  ? 'Glossário & Vocabulário Completo'
                  : 'Regras Gramaticais desta Lição'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)] truncate">
                {lessonTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-[var(--jvx-gold)] hover:bg-slate-100 dark:hover:bg-[var(--jvx-surface-elevated)] transition shrink-0 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {mode === 'glossary' ? (
            glossary.map((group) => (
              <div key={group.category} className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--jvx-gold)]">
                  {group.category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item) => {
                    const phrase = item.example || item.term;
                    const active = playingText === phrase;
                    return (
                      <div
                        key={item.term}
                        className="rounded-xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/85 p-3 flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{item.term}</p>
                          <p className="text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)]">
                            {item.pt}
                          </p>
                          {item.example && (
                            <p className="text-[11px] text-slate-400 italic mt-1">“{item.example}”</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onPlay(phrase)}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--jvx-gold)] hover:bg-[var(--jvx-gold)]/10 shrink-0 cursor-pointer ${
                            active ? 'animate-pulse bg-[var(--jvx-gold)]/15' : ''
                          }`}
                          aria-label={`Ouvir pronúncia de ${item.term}`}
                        >
                          <Volume2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-3.5">
              {grammarRules.map((rule) => (
                <GrammarCard
                  key={rule.title}
                  rule={rule}
                  isPlaying={playingText === rule.audioExample}
                  onPlay={onPlay}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
