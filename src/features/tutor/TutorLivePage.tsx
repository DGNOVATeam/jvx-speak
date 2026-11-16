import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  Crown,
  Lock,
  Mic,
  MicOff,
  Radio,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { speakText, startSpeechRecognition, type SpeechRecognitionHandle } from '@/lib/speech';

interface TutorMessage {
  role: 'user' | 'assistant';
  text: string;
  translationPt?: string;
  quickTipPt?: string;
}

const PRESET_TOPICS = [
  { id: 'negotiation', label: 'Negociação de Contrato', prompt: 'Contract Negotiation & Pricing' },
  { id: 'interview', label: 'Entrevista Executiva', prompt: 'Executive Job Interview' },
  { id: 'travel', label: 'Viagem & Aeroporto', prompt: 'International Airport & Hotel Travel' },
  { id: 'meeting', label: 'Reunião de Resultados', prompt: 'Weekly Project Results Meeting' },
  { id: 'networking', label: 'Networking em Evento', prompt: 'Business Networking at a Conference' },
  { id: 'restaurant', label: 'Jantar com Cliente', prompt: 'Business Dinner at a Restaurant' },
];

export function TutorLivePage() {
  const { user, profile } = useAuth();

  const [selectedTopic, setSelectedTopic] = useState(PRESET_TOPICS[0].prompt);
  const [customTopic, setCustomTopic] = useState('');
  const [mode, setMode] = useState<'guided' | 'live'>('guided');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live API session state
  const [liveActive, setLiveActive] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [liveInteractionId, setLiveInteractionId] = useState<string | null>(null);
  const [liveStatusText, setLiveStatusText] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionHandle | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: enrollment } = useQuery({
    queryKey: ['tutor-enrollment', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('enrollments')
        .select('estimated_cefr_level, course:courses(target_language, title)')
        .eq('student_id', user!.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: masteredRows = [] } = useQuery({
    queryKey: ['tutor-mastery', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('mastery_records')
        .select('competency_id')
        .eq('student_id', user!.id)
        .eq('status', 'mastered');
      return data ?? [];
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loadingTurn]);

  useEffect(() => {
    if (!liveActive) return;
    const timer = window.setInterval(() => setLiveSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [liveActive]);

  const level = enrollment?.estimated_cefr_level ?? 'A1';
  const courseInfo = enrollment?.course as { target_language?: string; title?: string } | null;
  const targetLanguage = courseInfo?.target_language ?? 'en';
  const masteredCount = masteredRows.length;
  const isUnlocked =
    profile?.role === 'admin' ||
    ['A2', 'B1', 'B2', 'C1', 'C2'].includes(level) ||
    masteredCount >= 2;

  const activeTopic = customTopic.trim() || selectedTopic;

  const playTutorAudio = async (text: string) => {
    if (!autoSpeak || !text.trim()) return;
    setIsSpeaking(true);
    try {
      await speakText(text, targetLanguage === 'es-ES' ? 'es-ES' : 'en-US');
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStartGuided = async () => {
    setErrorMsg(null);
    setStarted(true);
    setMessages([]);
    setLoadingTurn(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-live-tutor', {
        body: {
          action: 'chat_turn',
          topic: activeTopic,
          targetLanguage,
          isStart: true,
          history: [],
        },
      });
      if (error || !data?.turn) throw new Error(error?.message || 'Erro ao iniciar Tutor IA');

      const fullReply = `${data.turn.reply} ${data.turn.follow_up_question}`.trim();
      setMessages([
        {
          role: 'assistant',
          text: fullReply,
          translationPt: data.turn.translation_pt,
          quickTipPt: data.turn.quick_tip_pt,
        },
      ]);
      void playTutorAudio(fullReply);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao conectar com o Tutor IA.');
    } finally {
      setLoadingTurn(false);
    }
  };

  const handleSendTurn = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loadingTurn) return;

    setErrorMsg(null);
    const nextHistory = [...messages, { role: 'user' as const, text }];
    setMessages(nextHistory);
    if (!overrideText) setInput('');
    setLoadingTurn(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-live-tutor', {
        body: {
          action: 'chat_turn',
          topic: activeTopic,
          targetLanguage,
          isStart: false,
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          studentMessage: text,
        },
      });
      if (error || !data?.turn) throw new Error(error?.message || 'Erro na resposta do Tutor IA');

      const fullReply = `${data.turn.reply} ${data.turn.follow_up_question}`.trim();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: fullReply,
          translationPt: data.turn.translation_pt,
          quickTipPt: data.turn.quick_tip_pt,
        },
      ]);
      void playTutorAudio(fullReply);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar mensagem.');
    } finally {
      setLoadingTurn(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }

    setErrorMsg(null);
    setRecording(true);
    recRef.current = startSpeechRecognition({
      lang: targetLanguage === 'es-ES' ? 'es-ES' : 'en-US',
      onResult: (transcript) => {
        setRecording(false);
        if (transcript.trim()) {
          void handleSendTurn(transcript.trim());
        }
      },
      onError: (msg) => {
        setRecording(false);
        setErrorMsg(msg);
      },
      onEnd: () => setRecording(false),
    });
  };

  const handleStartLiveSession = async () => {
    setErrorMsg(null);
    setLiveStatusText('Provisionando sessão Gemini Live...');
    try {
      const { data, error } = await supabase.functions.invoke('ai-live-tutor', {
        body: { action: 'start_live_session', topic: activeTopic },
      });
      if (error) throw new Error(error.message);

      setLiveInteractionId(data?.interactionId ?? null);
      setLiveSeconds(0);
      setLiveActive(true);
      setLiveStatusText(
        data?.liveReady
          ? `Sessão Live conectada (${data.model}) — Áudio & Telemetria ativos`
          : `Modo Voz Contínua ativo (${data?.model ?? 'Gemini Live'}) — Telemetria de custos ativa`
      );
      if (!started) {
        void handleStartGuided();
      }
    } catch (err) {
      setLiveStatusText(null);
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao iniciar sessão Live.');
    }
  };

  const handleStopLiveSession = async () => {
    setLiveActive(false);
    const secs = Math.max(1, liveSeconds);
    setLiveStatusText(`Sessão encerrada (${secs}s registrados no painel de custos).`);
    try {
      await supabase.functions.invoke('ai-live-tutor', {
        body: {
          action: 'log_live_usage',
          seconds: secs,
          interactionId: liveInteractionId,
        },
      });
    } catch {
      // silent
    }
  };

  // Locked Screen for A1 students
  if (!isUnlocked) {
    return (
      <div className="max-w-3xl mx-auto rounded-3xl border border-[#D4AF37]/40 bg-[#0B1F3B] text-white p-8 text-center space-y-5 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37]">
          <Lock className="h-8 w-8" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-[#D4AF37]">
          <Crown className="h-3.5 w-3.5" /> Recurso Premium • Nível A2+
        </span>
        <h1 className="text-2xl font-bold">Tutor IA Conversacional & Live Audio</h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Converse livremente por voz com nosso Tutor IA sobre temas reais de negócios, viagens e entrevistas. Esse recurso é desbloqueado automaticamente ao atingir o <strong>Nível A2</strong> (ou dominar 2 lições do A1).
        </p>

        <div className="max-w-sm mx-auto rounded-2xl bg-[#06152B] border border-[#1F4E79]/50 p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Seu progresso para desbloqueio:</span>
            <span className="font-bold text-[#D4AF37]">{Math.min(2, masteredCount)} / 2 lições</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#0B1F3B] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D4AF37]"
              style={{ width: `${Math.min(100, (masteredCount / 2) * 100)}%` }}
            />
          </div>
        </div>

        <Link
          to="/courses"
          className="jvx-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          Ir para Meus Cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Premium com Avatar */}
      <div className="rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#0B1F3B] via-[#0E274B] to-[#06152B] p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src="/media/tutors/tutor-english.webp"
                alt="Tutor IA JVX SPEAK"
                className={`h-16 w-16 rounded-2xl object-cover border-2 transition ${
                  isSpeaking || liveActive
                    ? 'border-[#D4AF37] ring-4 ring-[#D4AF37]/30'
                    : 'border-[#1F4E79]'
                }`}
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-[#0B1F3B] shadow">
                <Bot className="h-3.5 w-3.5" />
              </span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                <Crown className="h-3.5 w-3.5" /> Tutor IA Premium (A2+)
              </span>
              <h1 className="text-xl sm:text-2xl font-bold mt-0.5">
                Conversação Livre & Live Audio
              </h1>
              <p className="text-xs text-slate-300">
                Escolha um tema, fale por áudio ou texto e pratique em tempo real com monitoramento de custos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoSpeak((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                autoSpeak
                  ? 'border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'border-[#1F4E79] bg-[#06152B] text-slate-400'
              }`}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {autoSpeak ? 'Voz Automática ON' : 'Voz Automática OFF'}
            </button>

            <div className="inline-flex rounded-xl border border-[#1F4E79] bg-[#06152B] p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode('guided')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  mode === 'guided' ? 'bg-[#D4AF37] text-[#0B1F3B]' : 'text-slate-300'
                }`}
              >
                Voz Guiada
              </button>
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition flex items-center gap-1 ${
                  mode === 'live' ? 'bg-rose-500 text-white' : 'text-slate-300'
                }`}
              >
                <Radio className="h-3 w-3" /> Live Tempo Real
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de Tema + Ação */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
            1. Escolha o Tema da Conversa
          </p>
          <span className="text-[11px] text-slate-400">
            Idioma ativo: <strong>{targetLanguage === 'es-ES' ? 'Espanhol' : 'Inglês'}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_TOPICS.map((tp) => {
            const active = !customTopic.trim() && selectedTopic === tp.prompt;
            return (
              <button
                key={tp.id}
                type="button"
                onClick={() => {
                  setCustomTopic('');
                  setSelectedTopic(tp.prompt);
                }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold border transition ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0B1F3B]'
                    : 'border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#06152B] text-slate-600 dark:text-slate-300 hover:border-[#D4AF37]/60'
                }`}
              >
                {tp.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Ou digite um tema personalizado (ex: Apresentar startup para investidores)..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#06152B] px-3.5 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none"
          />

          {mode === 'guided' ? (
            <button
              type="button"
              disabled={loadingTurn}
              onClick={handleStartGuided}
              className="jvx-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              {started ? 'Reiniciar Conversa' : 'Iniciar Conversa IA'}
            </button>
          ) : liveActive ? (
            <button
              type="button"
              onClick={handleStopLiveSession}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition shrink-0"
            >
              <Square className="h-3.5 w-3.5" />
              Encerrar Live ({liveSeconds}s)
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartLiveSession}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow hover:brightness-105 transition shrink-0"
            >
              <Radio className="h-4 w-4" />
              Conectar Sessão Live
            </button>
          )}
        </div>

        {liveStatusText && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300 flex items-center justify-between">
            <span>{liveStatusText}</span>
            {liveActive && <span className="font-mono font-bold">{liveSeconds}s</span>}
          </div>
        )}
      </div>

      {/* Área de Conversa */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] overflow-hidden flex flex-col">
        <div className="p-5 space-y-4 min-h-[300px] max-h-[440px] overflow-y-auto">
          {messages.length === 0 && !loadingTurn && (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Bot className="h-8 w-8 mx-auto text-[#D4AF37] opacity-70" />
              <p className="font-semibold text-sm text-slate-300">
                Pronto para conversar sobre: <span className="text-[#D4AF37]">{activeTopic}</span>
              </p>
              <p>Clique em <strong>"Iniciar Conversa IA"</strong> acima para o Tutor começar falando com você.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm space-y-1.5 ${
                  msg.role === 'user'
                    ? 'bg-[#D4AF37] text-[#0B1F3B] font-medium rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-[#06152B] text-slate-800 dark:text-white border border-slate-200 dark:border-[#1F4E79]/50 rounded-tl-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="leading-relaxed">{msg.text}</p>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => void playTutorAudio(msg.text)}
                      className="rounded-lg p-1 text-[#D4AF37] hover:bg-white/10 shrink-0"
                      title="Ouvir novamente"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {msg.translationPt && (
                  <p className="text-[11px] text-slate-400 border-t border-white/10 pt-1.5">
                    {msg.translationPt}
                  </p>
                )}
                {msg.quickTipPt && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    💡 Dica: {msg.quickTipPt}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loadingTurn && (
            <p className="text-xs text-[#D4AF37] animate-pulse">Tutor IA está formulando resposta...</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input / Microfone */}
        <div className="border-t border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#06152B] p-3.5 space-y-2">
          {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!started || loadingTurn}
              onClick={toggleRecording}
              className={`rounded-xl p-3 transition shrink-0 ${
                recording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'border border-slate-200 dark:border-[#1F4E79]/60 bg-white dark:bg-[#0B1F3B] text-[#D4AF37] hover:border-[#D4AF37]'
              } disabled:opacity-40`}
              title={recording ? 'Parar gravação' : 'Responder por voz'}
            >
              {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              disabled={!started || loadingTurn}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSendTurn();
                }
              }}
              placeholder={
                started
                  ? 'Responda por voz no microfone ou digite aqui...'
                  : 'Inicie a conversa acima para responder...'
              }
              className="flex-1 rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-white dark:bg-[#0B1F3B] px-3.5 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
            />

            <button
              type="button"
              disabled={!started || loadingTurn || !input.trim()}
              onClick={() => void handleSendTurn()}
              className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#0B1F3B] hover:brightness-105 disabled:opacity-40 transition flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
