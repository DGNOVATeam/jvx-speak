import { AlertCircle, AudioLines, Loader2, Mic } from 'lucide-react';
import { cn } from '@/lib/cn';

export type VoiceInteractionState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'sending'
  | 'playing'
  | 'error';

export interface VoiceInteractionIndicatorProps {
  state: VoiceInteractionState;
  errorMessage?: string | null;
  className?: string;
}

/**
 * Indicador visual dos estados reais de interação por voz e processamento de IA.
 * Reflete exclusivamente os estados reais de STT, TTS e envio de mensagem.
 */
export function VoiceInteractionIndicator({
  state,
  errorMessage,
  className,
}: VoiceInteractionIndicatorProps) {
  if (state === 'idle') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border transition',
        state === 'listening' &&
          'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300',
        state === 'transcribing' &&
          'border-[var(--jvx-info)]/40 bg-[var(--jvx-info)]/10 text-[var(--jvx-info)]',
        state === 'sending' &&
          'border-[var(--jvx-gold)]/40 bg-[var(--jvx-gold)]/10 text-[#9A7B16] dark:text-[var(--jvx-gold)]',
        state === 'playing' &&
          'border-[var(--jvx-gold)]/40 bg-[var(--jvx-gold)]/10 text-[#9A7B16] dark:text-[var(--jvx-gold)]',
        state === 'error' &&
          'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400',
        className
      )}
    >
      {state === 'listening' && (
        <>
          <Mic className="h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden="true" />
          <span>Escutando sua fala no microfone...</span>
        </>
      )}
      {state === 'transcribing' && (
        <>
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          <span>Transcrevendo áudio...</span>
        </>
      )}
      {state === 'sending' && (
        <>
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          <span>Tutor IA preparando resposta...</span>
        </>
      )}
      {state === 'playing' && (
        <>
          <AudioLines className="h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden="true" />
          <span>Reproduzindo pronúncia...</span>
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage || 'Não foi possível processar o áudio.'}</span>
        </>
      )}
    </div>
  );
}
