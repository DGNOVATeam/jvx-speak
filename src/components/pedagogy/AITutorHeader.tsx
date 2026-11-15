import { AudioLines, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AITutorAvatar } from './AITutorAvatar';
import type { VoiceInteractionState } from './VoiceInteractionIndicator';

export interface AITutorHeaderProps {
  cefrLevel?: string;
  targetLanguage?: 'en' | 'es-ES';
  avatarUrl?: string;
  lessonProgress: number;
  interactionState: VoiceInteractionState;
  lastTeacherText?: string;
  isPlayingLast?: boolean;
  onPlayLastTeacher?: () => void;
}

const STATE_META: Record<
  VoiceInteractionState,
  { label: string; dotClass: string }
> = {
  idle: {
    label: 'Pronto para prática',
    dotClass: 'bg-[var(--jvx-success)]',
  },
  listening: {
    label: 'Escutando você',
    dotClass: 'bg-rose-500 animate-pulse',
  },
  transcribing: {
    label: 'Transcrevendo fala',
    dotClass: 'bg-[var(--jvx-info)] animate-pulse',
  },
  sending: {
    label: 'Elaborando resposta',
    dotClass: 'bg-[var(--jvx-gold)] animate-pulse',
  },
  playing: {
    label: 'Falando agora',
    dotClass: 'bg-[var(--jvx-gold)] animate-pulse',
  },
  error: {
    label: 'Atenção necessária',
    dotClass: 'bg-rose-500',
  },
};

/**
 * Cabeçalho visual do Tutor IA na Etapa 3.
 * Exibe avatar, identificação, estado real da interação, áudio rápido e progresso da sessão.
 */
export function AITutorHeader({
  cefrLevel,
  targetLanguage = 'en',
  avatarUrl,
  lessonProgress,
  interactionState,
  lastTeacherText,
  isPlayingLast = false,
  onPlayLastTeacher,
}: AITutorHeaderProps) {
  const statusInfo = STATE_META[interactionState];

  return (
    <div className="border-b border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-[#0C2139] dark:via-[var(--jvx-surface-card)] dark:to-[#102E4F] px-4 sm:px-5 py-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AITutorAvatar
            avatarUrl={avatarUrl}
            targetLanguage={targetLanguage}
            size="md"
            cefrBadge={cefrLevel}
            isSpeaking={interactionState === 'playing'}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="jvx-heading text-sm sm:text-base font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] truncate">
                Tutor IA
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/70 dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-[var(--jvx-text-secondary)]">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusInfo.dotClass)} />
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)] truncate">
              Prática Guiada de Conversação
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lastTeacherText && onPlayLastTeacher && (
            <button
              type="button"
              onClick={onPlayLastTeacher}
              aria-pressed={isPlayingLast}
              title="Ouvir última fala do Tutor IA"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 min-h-[38px] text-xs font-semibold transition cursor-pointer',
                isPlayingLast
                  ? 'border-[var(--jvx-gold)] bg-[var(--jvx-gold)] text-[var(--jvx-navy)] animate-pulse'
                  : 'border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-white dark:bg-[var(--jvx-bg)]/80 text-[#9A7B16] dark:text-[var(--jvx-gold)] hover:border-[var(--jvx-gold)]'
              )}
            >
              {isPlayingLast ? (
                <AudioLines className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Ouvir pronúncia</span>
            </button>
          )}
        </div>
      </div>

      {/* Progresso real da Etapa 3 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-slate-500 dark:text-[var(--jvx-text-secondary)]">
            Etapa 3 de 4 • Progresso da prática
          </span>
          <span
            className={cn(
              lessonProgress >= 80
                ? 'text-[#0F8B6D] dark:text-[var(--jvx-success)]'
                : 'text-[var(--jvx-info)]'
            )}
          >
            {lessonProgress}% concluído
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              lessonProgress >= 80 ? 'bg-[var(--jvx-success)]' : 'bg-[var(--jvx-info)]'
            )}
            style={{ width: `${Math.min(100, lessonProgress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
