import { BookMarked, Lightbulb, Volume2, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[#1F4E79] bg-white dark:bg-[#0B1F3B] text-slate-900 dark:text-white shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1F4E79]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mode === 'glossary' ? (
              <BookMarked className="h-5 w-5 text-[#D4AF37]" />
            ) : (
              <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
            )}
            <div>
              <h3 className="text-base font-bold">
                {mode === 'glossary'
                  ? 'Glossário & Vocabulário Completo'
                  : 'Regras Gramaticais desta Lição'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">{lessonTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-[#1F4E79]/40"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {mode === 'glossary' ? (
            glossary.map((group) => (
              <div key={group.category} className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  {group.category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item) => (
                    <div
                      key={item.term}
                      className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#06152B] p-3 flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.term}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{item.pt}</p>
                        {item.example && (
                          <p className="text-[11px] text-slate-400 italic mt-1">“{item.example}”</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onPlay(item.example || item.term)}
                        className="p-1.5 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/10 shrink-0"
                        title="Ouvir pronúncia"
                      >
                        <Volume2
                          className={`h-4 w-4 ${
                            playingText === (item.example || item.term) ? 'animate-pulse' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-4">
              {grammarRules.map((rule) => (
                <div
                  key={rule.title}
                  className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#06152B] p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-bold text-[#D4AF37]">{rule.title}</h4>
                    <button
                      type="button"
                      onClick={() => onPlay(rule.audioExample)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1F4E79]/60 px-2.5 py-1 text-[11px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 shrink-0"
                    >
                      <Volume2
                        className={`h-3.5 w-3.5 ${playingText === rule.audioExample ? 'animate-pulse' : ''}`}
                      />
                      Ouvir exemplo
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rule.explanation}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-rose-400">
                      <span className="font-bold">Evite:</span> {rule.dontSay}
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-emerald-400">
                      <span className="font-bold">Use:</span> {rule.sayInstead}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
