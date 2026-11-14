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
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, pcmBytes.length, true);

  new Uint8Array(wavBuffer, 44).set(pcmBytes);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function fallbackSpeak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

export async function speakEnglish(text: string): Promise<void> {
  const clean = text.trim();
  if (!clean) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const cachedUrl = audioCache.get(clean);
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
    audioCache.set(clean, url);

    currentAudio = new Audio(url);
    await currentAudio.play();
  } catch {
    fallbackSpeak(clean);
  }
}
