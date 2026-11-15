import { supabase } from '@/lib/supabase';

// Cache em memória para não chamar a API de TTS duas vezes para a mesma frase
const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

function pcm16ToWavBlob(base64Pcm: string, sampleRate = 24000): Blob {
  const binary = atob(base64Pcm);
  const pcmBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    pcmBytes[i] = binary.charCodeAt(i);
  }

  const wavBuffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(wavBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, pcmBytes.length, true);

  new Uint8Array(wavBuffer, 44).set(pcmBytes);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function fallbackSpeak(text: string, lang = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

export async function speakText(text: string, lang = 'en-US'): Promise<void> {
  const clean = text.trim();
  if (!clean) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const cacheKey = `${lang}:${clean}`;
  const cachedUrl = audioCache.get(cacheKey);
  if (cachedUrl) {
    currentAudio = new Audio(cachedUrl);
    await currentAudio.play();
    return;
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-tts', {
      body: { text: clean },
    });

    if (error || !data?.audioBase64) {
      throw new Error(error?.message || 'TTS unavailable');
    }

    const wavBlob = pcm16ToWavBlob(data.audioBase64, 24000);
    const url = URL.createObjectURL(wavBlob);
    audioCache.set(cacheKey, url);

    currentAudio = new Audio(url);
    await currentAudio.play();
  } catch {
    fallbackSpeak(clean, lang);
  }
}

export const speakEnglish = (text: string) => speakText(text, 'en-US');

// ============================================================================
// Reconhecimento de Fala (Speaking Practice)
// Usa Web Speech API nativa (Chrome/Edge/Android/Safari) com fallback automático
// para MediaRecorder + Gemini (ai-stt) em navegadores/PWAs sem SpeechRecognition.
// ============================================================================
export interface SpeechRecognitionHandle {
  stop: () => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Falha ao ler o áudio gravado.'));
    reader.readAsDataURL(blob);
  });
}

function startMediaRecorderFallback(params: {
  lang: 'en-US' | 'es-ES';
  onResult: (transcript: string) => void;
  onError: (msg: string) => void;
  onEnd: () => void;
  onTranscribing?: (busy: boolean) => void;
}): SpeechRecognitionHandle | null {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    params.onError('Seu navegador não suporta captura de áudio. Use Chrome, Edge ou Safari atualizado.');
    params.onEnd();
    return null;
  }

  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let stopped = false;
  const chunks: BlobPart[] = [];

  const cleanupStream = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((mediaStream) => {
      if (stopped) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = mediaStream;

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      recorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        cleanupStream();
        const finalType = recorder?.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: finalType });
        if (blob.size < 400) {
          params.onEnd();
          return;
        }
        try {
          params.onTranscribing?.(true);
          const audioBase64 = await blobToBase64(blob);
          const { data, error } = await supabase.functions.invoke('ai-stt', {
            body: { audioBase64, mimeType: finalType, lang: params.lang },
          });
          if (error) throw new Error(error.message);
          const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';
          if (transcript) {
            params.onResult(transcript);
          } else {
            params.onError('Não foi possível entender a fala. Tente falar mais perto do microfone.');
          }
        } catch (err) {
          params.onError(err instanceof Error ? err.message : 'Erro ao transcrever o áudio.');
        } finally {
          params.onTranscribing?.(false);
          params.onEnd();
        }
      };

      recorder.start();
    })
    .catch(() => {
      cleanupStream();
      params.onError('Permissão de microfone negada. Libere o microfone nas configurações do navegador.');
      params.onEnd();
    });

  return {
    stop: () => {
      stopped = true;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        cleanupStream();
        params.onEnd();
      }
    },
  };
}

export function startSpeechRecognition(params: {
  lang: 'en-US' | 'es-ES';
  onResult: (transcript: string) => void;
  onError: (msg: string) => void;
  onEnd: () => void;
  onTranscribing?: (busy: boolean) => void;
}): SpeechRecognitionHandle | null {
  const win = window as unknown as {
    SpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: (e: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: (e: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
  };

  // Em iOS PWA (standalone), webkitSpeechRecognition pode falhar; usar MediaRecorder + Gemini STT
  const isIosStandalone =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    ((window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches);

  const RecognitionCtor = isIosStandalone
    ? undefined
    : win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!RecognitionCtor) {
    return startMediaRecorderFallback(params);
  }

  const recognition = new RecognitionCtor();
  recognition.lang = params.lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? '';
    if (transcript) params.onResult(transcript);
  };

  recognition.onerror = (event) => {
    params.onError(
      event.error === 'not-allowed'
        ? 'Permissão de microfone negada. Libere o microfone no navegador.'
        : `Erro no microfone: ${event.error}`
    );
  };

  recognition.onend = () => params.onEnd();
  recognition.start();

  return {
    stop: () => recognition.stop(),
  };
}
