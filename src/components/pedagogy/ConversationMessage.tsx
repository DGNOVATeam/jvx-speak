import { AudioLines, Sparkles, User, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AITutorAvatar } from './AITutorAvatar';

export interface ConversationCorrection {
  original: string;
  corrected: string;
  reason_pt: string;
}

export interface ConversationMessageData {
  role: 'student' | 'teacher';
  text: string;
  explanationPt?: string;
  corrections?: ConversationCorrection[];
  suggestions?: string[];
}

export interface ConversationMessageProps {
  message: ConversationMessageData;
  avatarUrl?: string;
  targetLanguage?: 'en' | 'es-ES';
  playingText: string | null;
  onPlay: (text: string) => void;
  onSelectSuggestion: (suggestion: string) => void;
}

/**
 * Balão de mensagem da Etapa 3 (Tutor IA à esquerda / Aluno à direita).
 * Preserva explicações em português, correções gramaticais e sugestões clicáveis.
 */
export function ConversationMessage({
  message,
  avatarUrl,
  targetLanguage = 'en',
  playingText,
  onPlay,
  onSelectSuggestion,
}: ConversationMessageProps) {
  const isStudent = message.role === 'student';
  const isPlaying = playingText === message.text;

  return (
    <div className={cn('flex flex-col gap-2', isStudent ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'flex items-end gap-2.5 max-w-[94%] sm:max-w-[86%]',
          isStudent && 'flex-row-reverse'
        )}
      >
        {isStudent ? (
          <div
            aria-hidden="true"
            className="hidden sm:flex h-8 w-8 rounded-full bg-[var(--jvx-info)]/20 border border-[var(--jvx-info)]/40 items-center justify-center shrink-0 text-[var(--jvx-info)]"
          >
            <User className="h-4 w-4" />
          </div>
        ) : (
          <AITutorAvatar
            avatarUrl={avatarUrl}
            targetLanguage={targetLanguage}
            size="sm"
            isSpeaking={isPlaying}
            className="hidden sm:inline-flex"
          />
        )}

        <div
          className={cn(
            'rounded-2xl px-3.5 sm:px-4 py-3 text-sm leading-relaxed shadow-sm min-w-0',
            isStudent
              ? 'rounded-br-md bg-[var(--jvx-info)] text-white'
              : 'rounded-bl-md border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/90 text-slate-900 dark:text-[var(--jvx-text-primary)]'
          )}
        >
          <div className="flex items-start justify-between gap-2.5">
            <p className="break-words">{message.text}</p>
            {!isStudent && (
              <button
                type="button"
                onClick={() => onPlay(message.text)}
                aria-label={`Ouvir fala do Tutor IA: ${message.text}`}
                aria-pressed={isPlaying}
                title="Ouvir voz neural"
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition shrink-0 cursor-pointer',
                  isPlaying
                    ? 'border-[var(--jvx-gold)] bg-[var(--jvx-gold)] text-[var(--jvx-navy)] animate-pulse'
                    : 'border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-white dark:bg-[var(--jvx-surface-card)] text-[var(--jvx-gold)] hover:border-[var(--jvx-gold)]'
                )}
              >
                {isPlaying ? (
                  <AudioLines className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          {message.explanationPt && (
            <p className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-[var(--jvx-text-secondary)] leading-relaxed">
              {message.explanationPt}
            </p>
          )}

          {message.corrections && message.corrections.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {message.corrections.map((corr, cIdx) => (
                <div
                  key={cIdx}
                  className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs space-y-0.5"
                >
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="line-through text-rose-500">{corr.original}</span>
                    <span className="font-semibold text-emerald-500">→ {corr.corrected}</span>
                  </div>
                  <p className="text-slate-600 dark:text-[var(--jvx-text-secondary)]">
                    {corr.reason_pt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isStudent && message.suggestions && message.suggestions.length > 0 && (
        <div className="sm:pl-10 flex flex-wrap gap-1.5 max-w-full">
          {message.suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onSelectSuggestion(sug)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--jvx-info)]/35 bg-[var(--jvx-info)]/10 px-3 py-1.5 min-h-[32px] text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-[var(--jvx-info)]/20 transition cursor-pointer text-left"
            >
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="break-words">{sug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
