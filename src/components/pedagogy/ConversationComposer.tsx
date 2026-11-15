import type { RefObject } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ConversationComposerProps {
  input: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  isListening: boolean;
  isTranscribing: boolean;
  isSending: boolean;
  micTarget: 'chat' | 'final';
  onChangeInput: (value: string) => void;
  onToggleMic: () => void;
  onSubmit: () => void;
}

/**
 * Barra de resposta moderna da Etapa 3 com destaque para interação por voz (Speaking)
 * e entrada por teclado, compatível com 320px, 390px e teclado virtual.
 */
export function ConversationComposer({
  input,
  inputRef,
  isListening,
  isTranscribing,
  isSending,
  micTarget,
  onChangeInput,
  onToggleMic,
  onSubmit,
}: ConversationComposerProps) {
  const listeningChat = isListening && micTarget === 'chat';

  return (
    <div className="border-t border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50/90 dark:bg-[#091D34] p-3 sm:p-4 space-y-2.5">
      {/* Atalho de voz destacado no mobile para priorizar prática oral */}
      <div className="sm:hidden flex items-center justify-center">
        <button
          type="button"
          onClick={onToggleMic}
          disabled={isTranscribing}
          aria-pressed={listeningChat}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 min-h-[46px] text-xs font-bold transition cursor-pointer',
            listeningChat
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-sm'
              : 'border-[var(--jvx-gold)]/60 bg-[var(--jvx-gold)]/12 text-[#9A7B16] dark:text-[var(--jvx-gold)] hover:bg-[var(--jvx-gold)]/20'
          )}
        >
          {listeningChat ? (
            <>
              <MicOff className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Parar gravação</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isTranscribing ? 'Transcrevendo áudio...' : 'Falar resposta (Speaking)'}</span>
            </>
          )}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex items-center gap-2"
      >
        {/* Microfone destacado em telas >= sm */}
        <button
          type="button"
          onClick={onToggleMic}
          disabled={isTranscribing}
          aria-label={listeningChat ? 'Parar microfone' : 'Falar resposta no microfone'}
          aria-pressed={listeningChat}
          title={listeningChat ? 'Parar microfone' : 'Praticar Fala (Speaking)'}
          className={cn(
            'hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full border-2 transition shrink-0 cursor-pointer',
            listeningChat
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-md'
              : 'border-[var(--jvx-gold)]/70 bg-[var(--jvx-gold)]/15 text-[#9A7B16] dark:text-[var(--jvx-gold)] hover:bg-[var(--jvx-gold)] hover:text-[var(--jvx-navy)]'
          )}
        >
          {listeningChat ? (
            <MicOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Mic className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <label htmlFor="ai-tutor-chat-input" className="sr-only">
          Sua resposta para o Tutor IA
        </label>
        <input
          id="ai-tutor-chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => onChangeInput(e.target.value)}
          placeholder={
            isTranscribing
              ? 'Transcrevendo sua fala...'
              : listeningChat
                ? 'Ouvindo sua fala...'
                : 'Fale no microfone ou escreva sua resposta...'
          }
          className="min-w-0 flex-1 rounded-xl border border-slate-300 dark:border-[var(--jvx-border-subtle)] bg-white dark:bg-[var(--jvx-bg)] px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 dark:text-[var(--jvx-text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--jvx-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--jvx-gold)]/20 transition"
        />

        <button
          type="submit"
          disabled={isSending || !input.trim()}
          aria-label="Enviar mensagem para o Tutor IA"
          className="jvx-btn-primary disabled:opacity-50 inline-flex h-11 w-11 sm:w-auto sm:px-4 items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline text-xs font-bold">Enviar</span>
        </button>
      </form>
    </div>
  );
}
