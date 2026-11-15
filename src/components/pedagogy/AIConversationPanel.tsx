import type { RefObject } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ContentCard, PrimaryButton } from '@/components/ui';
import { AITutorHeader } from './AITutorHeader';
import { ConversationComposer } from './ConversationComposer';
import {
  ConversationMessage,
  type ConversationMessageData,
} from './ConversationMessage';
import {
  VoiceInteractionIndicator,
  type VoiceInteractionState,
} from './VoiceInteractionIndicator';

export interface AIConversationPanelProps {
  cefrLevel?: string;
  targetLanguage?: 'en' | 'es-ES';
  avatarUrl?: string;
  messages: ConversationMessageData[];
  lessonProgress: number;
  input: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
  isSending: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  micTarget: 'chat' | 'final';
  playingText: string | null;
  errorMsg: string | null;
  onChangeInput: (value: string) => void;
  onToggleMic: () => void;
  onSend: (textOverride?: string) => void;
  onPlay: (text: string) => void;
  onAdvanceToExercise: () => void;
}

/**
 * Painel principal da Etapa 3 (Prática Guiada IA).
 * Integra cabeçalho do Tutor IA, histórico de balões, indicadores reais de voz/IA e composer.
 */
export function AIConversationPanel({
  cefrLevel,
  targetLanguage = 'en',
  avatarUrl,
  messages,
  lessonProgress,
  input,
  inputRef,
  messagesEndRef,
  isSending,
  isListening,
  isTranscribing,
  micTarget,
  playingText,
  errorMsg,
  onChangeInput,
  onToggleMic,
  onSend,
  onPlay,
  onAdvanceToExercise,
}: AIConversationPanelProps) {
  const lastTeacherMessage = [...messages].reverse().find((m) => m.role === 'teacher');

  const interactionState: VoiceInteractionState = errorMsg
    ? 'error'
    : isListening && micTarget === 'chat'
      ? 'listening'
      : isTranscribing
        ? 'transcribing'
        : isSending
          ? 'sending'
          : playingText
            ? 'playing'
            : 'idle';

  return (
    <ContentCard
      variant="highlight"
      padding="none"
      className="flex flex-col overflow-hidden border-[var(--jvx-border-gold)] min-h-[460px] sm:min-h-[520px] lg:h-[640px]"
    >
      <AITutorHeader
        cefrLevel={cefrLevel}
        targetLanguage={targetLanguage}
        avatarUrl={avatarUrl}
        lessonProgress={lessonProgress}
        interactionState={interactionState}
        lastTeacherText={lastTeacherMessage?.text}
        isPlayingLast={Boolean(lastTeacherMessage && playingText === lastTeacherMessage.text)}
        onPlayLastTeacher={
          lastTeacherMessage ? () => onPlay(lastTeacherMessage.text) : undefined
        }
      />

      {/* Área de Conversação */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 flex flex-col gap-4 bg-gradient-to-b from-transparent to-slate-50/40 dark:to-[#07182E]/40">
        <div className="space-y-4">
          {messages.map((m, idx) => (
            <ConversationMessage
              key={idx}
              message={m}
              avatarUrl={avatarUrl}
              targetLanguage={targetLanguage}
              playingText={playingText}
              onPlay={onPlay}
              onSelectSuggestion={(sug) => onSend(sug)}
            />
          ))}

          {isSending && (
            <div className="flex items-start">
              <div className="rounded-2xl rounded-bl-md border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-100 dark:bg-[var(--jvx-bg)]/90 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-[var(--jvx-text-secondary)] animate-pulse">
                Tutor IA está respondendo...
              </div>
            </div>
          )}
        </div>

        {/* Banner de conclusão da Etapa 3 */}
        {lessonProgress >= 80 && (
          <div className="mt-auto rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  Prática guiada concluída!
                </p>
                <p className="text-slate-600 dark:text-[var(--jvx-text-secondary)]">
                  Agora teste sua escrita sem dicas no Exercício Final.
                </p>
              </div>
            </div>
            <PrimaryButton
              size="sm"
              onClick={onAdvanceToExercise}
              className="shrink-0 bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500"
            >
              <span>Ir para Exercício Final</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </PrimaryButton>
          </div>
        )}

        <VoiceInteractionIndicator
          state={interactionState === 'error' ? 'error' : interactionState === 'listening' || interactionState === 'transcribing' ? interactionState : 'idle'}
          errorMessage={errorMsg}
        />

        <div ref={messagesEndRef} />
      </div>

      <ConversationComposer
        input={input}
        inputRef={inputRef}
        isListening={isListening}
        isTranscribing={isTranscribing}
        isSending={isSending}
        micTarget={micTarget}
        onChangeInput={onChangeInput}
        onToggleMic={onToggleMic}
        onSubmit={() => onSend()}
      />
    </ContentCard>
  );
}
