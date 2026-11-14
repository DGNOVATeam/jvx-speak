import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Send,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Volume2,
  ClipboardCheck,
  ArrowRight,
  RefreshCw,
  Blocks,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { speakEnglish } from '@/lib/speech';

interface ChatMessage {
  role: 'student' | 'teacher';
  text: string;
  explanationPt?: string;
  corrections?: Array<{ original: string; corrected: string; reason_pt: string }>;
  suggestions?: string[];
}

interface WordItem {
  en: string;
  pt: string;
}

const DEFAULT_WORD_BANK: WordItem[] = [
  { en: 'at night', pt: 'à noite' },
  { en: 'in the afternoon', pt: 'à tarde' },
  { en: 'client', pt: 'cliente' },
  { en: 'team', pt: 'equipe' },
  { en: 'partner', pt: 'sócio / parceiro' },
  { en: 'deadline', pt: 'prazo' },
];

const SCENARIOS = [
  'Networking em evento de negócios',
  'Call com cliente internacional',
  'Reunião diária com sócio',
  'Café com potencial parceiro',
];

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wordBank, setWordBank] = useState<WordItem[]>(DEFAULT_WORD_BANK);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [dialogueRecorded, setDialogueRecorded] = useState(false);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playingText, setPlayingText] = useState<string | null>(null);

  const [exerciseAnswer, setExerciseAnswer] = useState('');
  const [customPrompt, setCustomPrompt] = useState<{ question: string; hint?: string } | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    evaluation: {
      feedback_pt: string;
      score_0_100: number;
      detected_error_tags: string[];
      adapted_exercise?: { question: string; hint_pt: string; expected_chunks: string[] };
    };
    mastery: { masteryScore: number; evidenceCount: number; status: string };
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, errorMsg]);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    enabled: Boolean(lessonId),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_curriculum')
        .from('lessons')
        .select('*, unit:units(*), lesson_competencies(competency_id)')
        .eq('id', lessonId!)
        .single();
      return data;
    },
  });

  const { data: allLessons } = useQuery({
    queryKey: ['all-lessons-nav'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_curriculum')
        .from('lessons')
        .select('id, title, unit:units(order_index)')
        .eq('is_published', true);
      return (data ?? []).sort((a, b) => {
        const ua = (a.unit as { order_index?: number } | null)?.order_index ?? 0;
        const ub = (b.unit as { order_index?: number } | null)?.order_index ?? 0;
        return ua - ub;
      });
    },
  });

  const currentIdx = (allLessons ?? []).findIndex((l) => l.id === lessonId);
  const nextLesson = currentIdx >= 0 && allLessons ? allLessons[currentIdx + 1] : undefined;

  const initSession = (idx = scenarioIdx) => {
    const firstChunk = (lesson?.vocabulary_chunks as Array<{ chunk: string }> | undefined)?.[0]?.chunk;
    setMessages([
      {
        role: 'teacher',
        text: lesson
          ? `Hello! Scenario: ${SCENARIOS[idx]}. Let's practice "${lesson.title}". Build your own sentence using the chunks and word bank!`
          : 'Hello! Ready to practice?',
        explanationPt: `Cenário: ${SCENARIOS[idx]}. Monte sua própria frase combinando os chunks com as peças do Banco de Vocabulário ao lado.`,
        suggestions: firstChunk ? [firstChunk] : [],
      },
    ]);
    setWordBank(DEFAULT_WORD_BANK);
    setLessonProgress(0);
    setDialogueRecorded(false);
    setErrorMsg(null);
  };

  useEffect(() => {
    if (!lesson) return;
    initSession(0);
    setScenarioIdx(0);
    setStep(1);
    setExerciseAnswer('');
    setCustomPrompt(null);
    setEvalResult(null);
  }, [lessonId, lesson?.id]);

  const handlePlay = async (text: string) => {
    setPlayingText(text);
    try {
      await speakEnglish(text);
    } finally {
      setPlayingText(null);
    }
  };

  const handleInsertWord = (word: string) => {
    if (step === 2) {
      setInput((prev) => (prev ? `${prev.trim()} ${word}` : word));
      chatInputRef.current?.focus();
    } else if (step === 3) {
      setExerciseAnswer((prev) => (prev ? `${prev.trim()} ${word}` : word));
    }
  };

  const handleSend = async (textToSend?: string) => {
    const content = (textToSend ?? input).trim();
    if (!content || !lessonId || sending) return;

    setErrorMsg(null);
    const nextHistory = [...messages, { role: 'student' as const, text: content }];
    setMessages(nextHistory);
    setInput('');
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-teacher-chat', {
        body: {
          lessonId,
          studentMessage: content,
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          scenarioVariant: SCENARIOS[scenarioIdx],
        },
      });

      if (error || !data?.teacher) {
        let detailedMsg = error?.message || 'Erro ao chamar TeacherAgent.';
        if (error && 'context' in error && error.context instanceof Response) {
          try {
            const errJson = await error.context.json();
            if (errJson?.error) detailedMsg = errJson.error;
          } catch {
            // ignore
          }
        }
        throw new Error(detailedMsg);
      }

      const t = data.teacher;
      setMessages((prev) => [
        ...prev,
        {
          role: 'teacher',
          text: t.reply_en,
          explanationPt: t.explanation_pt,
          corrections: t.inline_corrections,
          suggestions: t.suggested_next_prompts,
        },
      ]);

      if (Array.isArray(t.word_bank) && t.word_bank.length > 0) {
        setWordBank(t.word_bank);
      }
      if (typeof t.lesson_progress_pct === 'number') {
        setLessonProgress((prev) => Math.max(prev, t.lesson_progress_pct));
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleAdvanceToExercise = async () => {
    const compId = (lesson?.lesson_competencies as Array<{ competency_id: string }> | undefined)?.[0]?.competency_id;
    if (compId && !dialogueRecorded && messages.some((m) => m.role === 'student')) {
      await supabase.functions.invoke('submit-attempt', {
        body: {
          competencyId: compId,
          studentResponse: {
            scenario: SCENARIOS[scenarioIdx],
            turns: messages.filter((m) => m.role === 'student').length,
          },
          isCorrect: true,
          score0To100: Math.max(80, lessonProgress),
          evidenceType: 'ai_dialogue',
        },
      });
      setDialogueRecorded(true);
      queryClient.invalidateQueries({ queryKey: ['mastery'] });
      queryClient.invalidateQueries({ queryKey: ['pedagogical-next'] });
    }
    setStep(3);
  };

  const exercisePrompt = lesson
    ? `Sem usar frases prontas: combine os chunks de "${lesson.title}" com palavras do seu contexto profissional (1 a 3 frases em inglês).`
    : '';
  const activePrompt = customPrompt?.question ?? exercisePrompt;

  const handleEvaluateExercise = async () => {
    const compId = (lesson?.lesson_competencies as Array<{ competency_id: string }> | undefined)?.[0]?.competency_id;
    if (!compId || !lessonId || !exerciseAnswer.trim() || evalLoading) return;

    setErrorMsg(null);
    setEvalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-adaptive-eval', {
        body: {
          lessonId,
          competencyId: compId,
          promptQuestion: activePrompt,
          studentAnswer: exerciseAnswer.trim(),
        },
      });

      if (error || !data?.evaluation) {
        let detailedMsg = error?.message || 'Erro ao avaliar exercício.';
        if (error && 'context' in error && error.context instanceof Response) {
          try {
            const errJson = await error.context.json();
            if (errJson?.error) detailedMsg = errJson.error;
          } catch {
            // ignore
          }
        }
        throw new Error(detailedMsg);
      }

      setEvalResult(data);
      queryClient.invalidateQueries({ queryKey: ['mastery'] });
      queryClient.invalidateQueries({ queryKey: ['pedagogical-next'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setEvalLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500">Carregando aula...</div>;
  }

  if (!lesson) {
    return <div className="text-sm text-rose-500">Aula não encontrada.</div>;
  }

  const chunks = (lesson.vocabulary_chunks as Array<{ chunk: string; pt: string }>) ?? [];

  return (
    <div className="space-y-5">
      {/* Stepper Pedagógico: Início -> Meio -> Fim */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
          {[
            { num: 1 as const, label: '1. Input & Chunks' },
            { num: 2 as const, label: '2. Prática Guiada IA' },
            { num: 3 as const, label: '3. Exercício Final' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`rounded-lg px-3 py-1.5 transition ${
                step === s.num
                  ? 'bg-blue-600 text-white shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            const next = (scenarioIdx + 1) % SCENARIOS.length;
            setScenarioIdx(next);
            initSession(next);
            setStep(2);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-500 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Novo Cenário ({SCENARIOS[scenarioIdx]})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Chunks + Banco de Vocabulário ("Peças de Montar") */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <span className="inline-block rounded-md bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-600 mb-2">
              {(lesson.unit as { cefr_level?: string })?.cefr_level ?? 'A1'}
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{lesson.title}</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {(lesson.unit as { title?: string })?.title}
            </p>

            <div className="mt-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Chunks Estruturais (Ouça e repita)
              </h2>
              <div className="space-y-2">
                {chunks.map((c) => (
                  <div
                    key={c.chunk}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.chunk}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.pt}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlay(c.chunk)}
                      title="Ouvir pronúncia neural (Gemini TTS)"
                      className={`p-1.5 rounded-lg transition shrink-0 ${
                        playingText === c.chunk
                          ? 'text-blue-500 bg-blue-500/15 animate-pulse'
                          : 'text-slate-400 hover:text-blue-500 hover:bg-blue-500/10'
                      }`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Banco de Vocabulário / Peças de Montar */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Blocks className="h-3.5 w-3.5 text-blue-500" />
                Banco de Vocabulário (Peças de Montar)
              </h2>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Clique na palavra para usar na sua frase ou no 🔊 para ouvir.
              </p>
              <div className="flex flex-wrap gap-2">
                {wordBank.map((w) => (
                  <div
                    key={w.en}
                    className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleInsertWord(w.en)}
                      title={`Significado: ${w.pt} (clique para inserir)`}
                      className="px-2.5 py-1.5 text-left hover:bg-blue-600/10 transition"
                    >
                      <span className="font-semibold text-slate-900 dark:text-white">{w.en}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({w.pt})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlay(w.en)}
                      className="px-2 py-1.5 border-l border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Conteúdo por Etapa */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-[640px]">
          {step === 1 && (
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Etapa 1 de 3 • Preparação
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Como funciona esta lição
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  1. Ouça cada <strong>Chunk Estrutural</strong> ao lado clicando no 🔊 e repita em voz alta.
                  <br />
                  2. Olhe o <strong>Banco de Vocabulário</strong> para lembrar palavras extras (como horários, pessoas e prazos) e montar suas próprias frases.
                  <br />
                  3. Na Etapa 2, você fará 4 a 5 trocas com a Teacher IA no cenário <strong>{SCENARIOS[scenarioIdx]}</strong> e depois seguirá para o Exercício Final.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold text-white transition"
              >
                <Bot className="h-4 w-4" />
                Iniciar Prática com Professor IA
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Etapa 2 • Prática Guiada IA</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-500">{lessonProgress}% concluído</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${lessonProgress >= 80 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, lessonProgress)}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex flex-col ${m.role === 'student' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === 'student'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p>{m.text}</p>
                        {m.role === 'teacher' && (
                          <button
                            type="button"
                            onClick={() => handlePlay(m.text)}
                            title="Ouvir voz neural"
                            className={`p-1 rounded-md transition shrink-0 ${
                              playingText === m.text
                                ? 'text-blue-500 bg-blue-500/15 animate-pulse'
                                : 'text-slate-400 hover:text-blue-500 hover:bg-blue-500/10'
                            }`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {m.explanationPt && (
                        <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                          {m.explanationPt}
                        </p>
                      )}
                      {m.corrections && m.corrections.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {m.corrections.map((corr, cIdx) => (
                            <div key={cIdx} className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-xs">
                              <span className="line-through text-rose-500 mr-1.5">{corr.original}</span>
                              <span className="font-semibold text-emerald-500">→ {corr.corrected}</span>
                              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{corr.reason_pt}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {m.role === 'teacher' && m.suggestions && m.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleSend(sug)}
                            className="inline-flex items-center gap-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition"
                          >
                            <Sparkles className="h-3 w-3" />
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex items-start">
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                      Professor IA está respondendo...
                    </div>
                  </div>
                )}

                {lessonProgress >= 80 && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-500">Prática guiada concluída!</p>
                      <p className="text-slate-400">Agora teste sua escrita sem dicas no Exercício Final.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdvanceToExercise}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition shrink-0"
                    >
                      Ir para Exercício Final →
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                    {errorMsg}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Monte sua frase em inglês (ou clique nas peças ao lado)..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-white transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <ClipboardCheck className="h-4 w-4" />
                Etapa 3 de 3 • {customPrompt ? 'Reforço Adaptado' : 'Exercício Final (Sem Dicas)'}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400">Missão</span>
                  {customPrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPrompt(null);
                        setExerciseAnswer('');
                        setEvalResult(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-blue-400 underline"
                    >
                      Voltar à missão original
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200">{activePrompt}</p>
                {customPrompt?.hint && (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Dica: {customPrompt.hint}</p>
                )}
              </div>

              <textarea
                rows={4}
                value={exerciseAnswer}
                onChange={(e) => setExerciseAnswer(e.target.value)}
                placeholder="Escreva suas frases aplicando os chunks + vocabulário..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-sm focus:border-blue-500 focus:outline-none"
              />

              <button
                type="button"
                disabled={evalLoading || !exerciseAnswer.trim()}
                onClick={handleEvaluateExercise}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
              >
                {evalLoading ? 'Avaliando resposta...' : 'Enviar para Avaliação & Atualizar Domínio'}
              </button>

              {errorMsg && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  {errorMsg}
                </div>
              )}

              {evalResult && (
                <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Nota da Tentativa</span>
                    <span className="text-lg font-bold text-emerald-500">
                      {evalResult.evaluation.score_0_100}/100
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {evalResult.evaluation.feedback_pt}
                  </p>
                  {evalResult.evaluation.detected_error_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {evalResult.evaluation.detected_error_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>
                      Domínio consolidado:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {evalResult.mastery.masteryScore}%
                      </strong>{' '}
                      ({evalResult.mastery.evidenceCount} evidências • {evalResult.mastery.status})
                    </span>
                  </div>

                  {evalResult.mastery.status === 'mastered' && nextLesson && (
                    <Link
                      to={`/lessons/${nextLesson.id}`}
                      className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white transition"
                    >
                      Competência Dominada! Ir para a Próxima Aula: {nextLesson.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                  {evalResult.evaluation.adapted_exercise && (
                    <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs space-y-2">
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">Reforço Adaptado Recomendado:</p>
                        <p className="text-slate-200">{evalResult.evaluation.adapted_exercise.question}</p>
                        <p className="text-slate-400 mt-1">Dica: {evalResult.evaluation.adapted_exercise.hint_pt}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const adapted = evalResult.evaluation.adapted_exercise!;
                          setCustomPrompt({ question: adapted.question, hint: adapted.hint_pt });
                          setExerciseAnswer('');
                          setEvalResult(null);
                        }}
                        className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition"
                      >
                        Praticar este Reforço Agora →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
