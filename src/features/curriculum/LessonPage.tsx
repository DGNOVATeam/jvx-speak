import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  CheckCircle2,
  Volume2,
  ArrowRight,
  Blocks,
  Mic,
  MicOff,
  BookMarked,
  Lightbulb,
  Trophy,
  Headphones,
  LifeBuoy,
} from 'lucide-react';
import { openStudentSupportChat } from '@/components/support/StudentSupportWidget';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { normalizeUiLocale } from '@/lib/i18n';
import { resolveLessonMedia } from '@/lib/pedagogicalMedia';
import {
  ContentCard,
  PageContainer,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui';
import {
  AIConversationPanel,
  AudioPhraseCard,
  GrammarCard,
  LessonHero,
  LessonStepper,
  LessonSupportPanel,
  VocabularyPanel,
} from '@/components/pedagogy';
import { speakText, startSpeechRecognition, type SpeechRecognitionHandle } from '@/lib/speech';
import {
  buildFixationChallenges,
  getLessonPedagogy,
  type WordItem,
} from '@/features/curriculum/lessonPedagogy';
import { FixationGameStage } from '@/features/curriculum/FixationGameStage';
import { LessonReferenceModal } from '@/features/curriculum/LessonReferenceModal';

interface ChatMessage {
  role: 'student' | 'teacher';
  text: string;
  explanationPt?: string;
  corrections?: Array<{ original: string; corrected: string; reason_pt: string }>;
  suggestions?: string[];
}

const SCENARIOS = [
  'Networking em evento de negócios',
  'Call com cliente internacional',
  'Reunião diária com sócio',
  'Café com potencial parceiro',
];

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { profile } = useAuth();
  const nativeLang = normalizeUiLocale(profile?.native_language);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [refModal, setRefModal] = useState<'glossary' | 'grammar' | null>(null);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wordBank, setWordBank] = useState<WordItem[]>([]);
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
        .select('*, unit:units(*, course:courses(target_language)), lesson_competencies(competency_id)')
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
    const langForLesson =
      ((lesson?.unit as { course?: { target_language?: string } } | null)?.course?.target_language as
        | 'en'
        | 'es-ES'
        | undefined) ?? 'en';
    const ped = lesson ? getLessonPedagogy(lesson.title, langForLesson, nativeLang) : null;
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
    setWordBank(ped?.quickWords ?? []);
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

  const targetLang =
    ((lesson?.unit as { course?: { target_language?: string } } | null)?.course?.target_language as
      | 'en'
      | 'es-ES'
      | undefined) ?? 'en';
  const speechLang: 'en-US' | 'es-ES' = targetLang === 'es-ES' ? 'es-ES' : 'en-US';

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micTarget, setMicTarget] = useState<'chat' | 'final'>('chat');
  const recognitionRef = useRef<SpeechRecognitionHandle | null>(null);

  const toggleMicFor = (target: 'chat' | 'final') => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    setErrorMsg(null);
    setMicTarget(target);
    setIsListening(true);
    recognitionRef.current = startSpeechRecognition({
      lang: speechLang,
      onResult: (transcript) => {
        if (target === 'final') {
          setExerciseAnswer((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        } else {
          setInput((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        }
      },
      onError: (msg) => setErrorMsg(msg),
      onEnd: () => setIsListening(false),
      onTranscribing: setIsTranscribing,
    });
  };

  const toggleMic = () => toggleMicFor('chat');

  const handlePlay = async (text: string) => {
    setPlayingText(text);
    try {
      await speakText(text, speechLang);
    } finally {
      setPlayingText(null);
    }
  };

  const handleInsertWord = (word: string) => {
    if (step === 3) {
      setInput((prev) => (prev ? `${prev.trim()} ${word}` : word));
      chatInputRef.current?.focus();
    } else if (step === 4) {
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
    setStep(4);
  };

  const exercisePrompt = lesson
    ? `Sem usar frases prontas: combine os chunks de "${lesson.title}" com palavras do seu contexto profissional (1 a 3 frases em ${targetLang === 'es-ES' ? 'espanhol' : 'inglês'}).`
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
  const pedagogy = getLessonPedagogy(lesson.title, targetLang, nativeLang);
  const activeWordBank = wordBank.length > 0 ? wordBank : pedagogy.quickWords;
  const fixationChallenges = buildFixationChallenges(chunks, pedagogy.quickWords);
  const media = resolveLessonMedia(lesson.title);
  const cefrLevel = (lesson.unit as { cefr_level?: string })?.cefr_level ?? 'A1';
  const unitTitle = (lesson.unit as { title?: string })?.title;
  const lessonObjective =
    (lesson as { objective_pt?: string; description?: string }).objective_pt ??
    (lesson as { description?: string }).description ??
    `Dominar os chunks de "${lesson.title}" com áudio, fixação e prática guiada no cenário ${SCENARIOS[scenarioIdx]}.`;

  return (
    <PageContainer>
      {/* Cabeçalho Contextual da Lição (JVX SPEAK 2.0) */}
      <LessonHero
        title={lesson.title}
        unitTitle={unitTitle}
        cefrLevel={cefrLevel}
        targetLanguage={targetLang}
        media={media}
        estimatedMinutes={(lesson as { estimated_minutes?: number }).estimated_minutes}
        objective={lessonObjective}
        progressPct={lessonProgress > 0 ? lessonProgress : null}
        progressLabel="Progresso nesta sessão"
      />

      {/* Contextual Help Bar for this Lesson */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4AF37]/30 bg-white/80 dark:bg-[#0B1F3B]/80 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <LifeBuoy className="h-4 w-4 text-[#D4AF37] shrink-0" />
          <span>
            Ficou com dúvida em <strong>{lesson.title}</strong>? Envie sua pergunta ou print da tela para o professor.
          </span>
        </div>
        <button
          type="button"
          onClick={openStudentSupportChat}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 px-3 py-1.5 text-xs font-bold text-[#0B1F3B] dark:text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B1F3B] transition"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          Tirar Dúvida (Help)
        </button>
      </div>

      {/* Stepper Pedagógico: 4 Etapas */}
      <LessonStepper
        steps={[
          { step: 1, label: 'Input & Vocabulário' },
          { step: 2, label: 'Fixação (XP)' },
          { step: 3, label: 'Prática Guiada IA' },
          { step: 4, label: 'Exercício Final' },
        ]}
        currentStep={step}
        onSelectStep={(nextStep) => setStep(nextStep)}
        scenarioLabel={SCENARIOS[scenarioIdx]}
        onChangeScenario={() => {
          const next = (scenarioIdx + 1) % SCENARIOS.length;
          setScenarioIdx(next);
          initSession(next);
          setStep(3);
        }}
      />

      {step === 1 ? (
        /* ETAPA 1 — REDESENHO JVX SPEAK 2.0 (Desktop 2 colunas / Mobile coluna única) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Coluna Principal: Chunks Estruturais + Vocabulário */}
          <div className="lg:col-span-7 min-w-0 space-y-5">
            <ContentCard variant="default" padding="md" className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="jvx-heading text-sm sm:text-base font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-[var(--jvx-gold)]" aria-hidden="true" />
                  Chunks Estruturais (Ouça e repita)
                </h2>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-[var(--jvx-text-secondary)]">
                  {chunks.length} frases-chave
                </span>
              </div>
              <div className="space-y-2.5">
                {chunks.map((c) => (
                  <AudioPhraseCard
                    key={c.chunk}
                    phrase={c.chunk}
                    translation={c.pt}
                    isPlaying={playingText === c.chunk}
                    onPlay={handlePlay}
                  />
                ))}
              </div>
            </ContentCard>

            <ContentCard variant="default" padding="md" className="space-y-3">
              <h2 className="jvx-heading text-sm sm:text-base font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] flex items-center gap-2">
                <Blocks className="h-4 w-4 text-[var(--jvx-gold)]" aria-hidden="true" />
                Vocabulário da Lição (Peças de Montar)
              </h2>
              <VocabularyPanel
                items={activeWordBank}
                playingText={playingText}
                onInsertWord={handleInsertWord}
                onPlay={handlePlay}
                onOpenGlossary={() => setRefModal('glossary')}
              />
            </ContentCard>
          </div>

          {/* Coluna Complementar: Objetivos, Regras Gramaticais & Avanço */}
          <div className="lg:col-span-5 min-w-0 space-y-5">
            <ContentCard variant="highlight" padding="md" className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--jvx-info)]">
                  Etapa 1 de 4 • Preparação Guiada
                </p>
                <h2 className="jvx-heading text-base sm:text-lg font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)]">
                  Como estudar esta lição
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[var(--jvx-text-secondary)] leading-relaxed">
                  1. Ouça cada <strong>Chunk Estrutural</strong> e repita em voz alta.
                  <br />
                  2. Explore o <strong>Vocabulário</strong> e o <strong>Glossário Completo</strong>.
                  <br />
                  3. Avance para a <strong>Fixação (XP)</strong> antes de conversar com a Teacher IA.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-[var(--jvx-border-subtle)]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--jvx-gold)] flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                    Regras Gramaticais ({pedagogy.grammarRules.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRefModal('grammar')}
                    className="text-xs font-semibold text-[var(--jvx-info)] hover:underline cursor-pointer"
                  >
                    Expandir regras
                  </button>
                </div>

                <div className="space-y-3">
                  {pedagogy.grammarRules.map((rule) => (
                    <GrammarCard
                      key={rule.title}
                      rule={rule}
                      isPlaying={playingText === rule.audioExample}
                      onPlay={handlePlay}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <PrimaryButton fullWidth size="lg" onClick={() => setStep(2)}>
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  <span>Avançar para Fixação (XP)</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
                <SecondaryButton
                  fullWidth
                  size="sm"
                  onClick={() => setRefModal('glossary')}
                >
                  <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Consultar Glossário Completo</span>
                </SecondaryButton>
              </div>
            </ContentCard>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Coluna Esquerda (Desktop) / Seção Expansível abaixo (Mobile na Etapa 4): Material de Apoio */}
          <div className="lg:col-span-5 min-w-0 order-2 lg:order-1">
            <LessonSupportPanel
              chunks={chunks}
              wordBank={activeWordBank}
              grammarRules={pedagogy.grammarRules}
              playingText={playingText}
              onPlay={handlePlay}
              onInsertWord={handleInsertWord}
              onOpenGlossary={() => setRefModal('glossary')}
              onOpenGrammarModal={() => setRefModal('grammar')}
              collapsibleOnMobile={step === 3 || step === 4}
            />
          </div>

          {/* Coluna Direita (Desktop) / Primeiro bloco (Mobile): Etapa ativa */}
          {step === 4 ? (
            <div className="lg:col-span-7 min-w-0 order-1 lg:order-2">
              <ContentCard
                variant="highlight"
                padding="none"
                className="overflow-hidden border-[var(--jvx-gold)]/65 dark:border-[var(--jvx-border-gold)] shadow-[var(--jvx-shadow-card)]"
              >
                <div className="relative p-4 sm:p-6 space-y-5 bg-gradient-to-b from-[var(--jvx-gold)]/[0.06] via-transparent to-transparent">
                  {/* Identificação da Etapa + Áudio da Missão */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9A7B16] dark:text-[var(--jvx-gold)]">
                      <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        Etapa 4 de 4 — {customPrompt ? 'Reforço Adaptado' : 'Exercício Final'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlay(activePrompt)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/80 px-2.5 py-1.5 min-h-[34px] text-xs font-medium text-[#9A7B16] dark:text-[var(--jvx-gold)] hover:border-[var(--jvx-gold)] transition cursor-pointer"
                        title="Ouvir missão em áudio"
                      >
                        <Volume2
                          className={`h-3.5 w-3.5 ${playingText === activePrompt ? 'animate-pulse' : ''}`}
                          aria-hidden="true"
                        />
                        <span>Ouvir missão</span>
                      </button>

                      {customPrompt && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomPrompt(null);
                            setExerciseAnswer('');
                            setEvalResult(null);
                          }}
                          className="text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)] hover:text-[var(--jvx-info)] underline cursor-pointer"
                        >
                          Voltar à missão original
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Título + Instrução Real da Missão */}
                  <div className="space-y-2">
                    <h2 className="jvx-heading text-xl sm:text-2xl font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)]">
                      Seu desafio final
                    </h2>
                    <p className="text-sm sm:text-[15px] text-slate-700 dark:text-[var(--jvx-text-secondary)] leading-relaxed">
                      {activePrompt}
                    </p>
                    {customPrompt?.hint && (
                      <p className="text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)] bg-slate-100 dark:bg-[var(--jvx-bg)]/70 rounded-lg px-3 py-2 border border-slate-200 dark:border-[var(--jvx-border-subtle)]">
                        Dica de reforço: {customPrompt.hint}
                      </p>
                    )}
                  </div>

                  {/* Área de Resposta */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <label htmlFor="final-exercise-answer" className="sr-only">
                        Resposta do desafio final
                      </label>
                      <textarea
                        id="final-exercise-answer"
                        rows={4}
                        value={exerciseAnswer}
                        onChange={(e) => setExerciseAnswer(e.target.value)}
                        placeholder={
                          isTranscribing
                            ? 'Transcrevendo sua fala...'
                            : isListening && micTarget === 'final'
                              ? 'Ouvindo sua fala no microfone...'
                              : 'Fale no microfone ou escreva suas frases aplicando os chunks + vocabulário...'
                        }
                        className="w-full rounded-xl border border-slate-300 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/90 p-3.5 pb-7 text-sm text-slate-900 dark:text-[var(--jvx-text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--jvx-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--jvx-gold)]/20 transition resize-y min-h-[120px]"
                      />
                      <span
                        aria-live="polite"
                        className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] font-medium text-slate-400 dark:text-slate-500"
                      >
                        {exerciseAnswer.length} caracteres
                      </span>
                    </div>

                    {/* Controles de Microfone e Áudio da Própria Resposta */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMicFor('final')}
                        disabled={isTranscribing}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 min-h-[44px] text-xs font-semibold transition cursor-pointer ${
                          isListening && micTarget === 'final'
                            ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                            : 'border-slate-300 dark:border-[var(--jvx-border-subtle)] bg-white dark:bg-[var(--jvx-bg)]/80 text-[#9A7B16] dark:text-[var(--jvx-gold)] hover:border-[var(--jvx-gold)]'
                        }`}
                      >
                        {isListening && micTarget === 'final' ? (
                          <>
                            <MicOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Parar gravação</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{isTranscribing ? 'Transcrevendo...' : 'Falar resposta (Speaking)'}</span>
                          </>
                        )}
                      </button>

                      {exerciseAnswer.trim() && (
                        <button
                          type="button"
                          onClick={() => handlePlay(exerciseAnswer)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/80 px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-slate-700 dark:text-[var(--jvx-text-secondary)] hover:border-[var(--jvx-gold)] hover:text-[var(--jvx-gold)] transition cursor-pointer"
                        >
                          <Volume2
                            className={`h-3.5 w-3.5 shrink-0 ${
                              playingText === exerciseAnswer ? 'animate-pulse text-[var(--jvx-gold)]' : ''
                            }`}
                            aria-hidden="true"
                          />
                          <span>Ouvir minha resposta</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CTA Principal */}
                  <PrimaryButton
                    fullWidth
                    size="lg"
                    disabled={evalLoading || !exerciseAnswer.trim()}
                    onClick={handleEvaluateExercise}
                    className="shadow-md"
                  >
                    <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {evalLoading ? 'Avaliando resposta...' : 'Enviar para Avaliação & Atualizar Domínio'}
                    </span>
                  </PrimaryButton>

                  {errorMsg && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500 dark:text-rose-400">
                      {errorMsg}
                    </div>
                  )}

                  {evalResult && (
                    <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-[var(--jvx-text-secondary)]">
                          Nota da Tentativa
                        </span>
                        <span className="text-lg font-bold text-emerald-500">
                          {evalResult.evaluation.score_0_100}/100
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
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
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-[var(--jvx-text-secondary)] flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
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
                          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-4 text-xs font-semibold text-white transition"
                        >
                          <span>Competência Dominada! Ir para a Próxima Aula: {nextLesson.title}</span>
                          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Link>
                      )}

                      {evalResult.evaluation.adapted_exercise && (
                        <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs space-y-2">
                          <div>
                            <p className="font-semibold text-blue-500 dark:text-blue-400 mb-1">
                              Reforço Adaptado Recomendado:
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                              {evalResult.evaluation.adapted_exercise.question}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                              Dica: {evalResult.evaluation.adapted_exercise.hint_pt}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const adapted = evalResult.evaluation.adapted_exercise!;
                              setCustomPrompt({ question: adapted.question, hint: adapted.hint_pt });
                              setExerciseAnswer('');
                              setEvalResult(null);
                            }}
                            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                          >
                            Praticar este Reforço Agora →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ContentCard>
            </div>
          ) : step === 3 ? (
            /* Coluna Direita (Desktop) / Primeiro bloco (Mobile): Etapa 3 — Tutor IA */
            <div className="lg:col-span-7 min-w-0 order-1 lg:order-2">
              <AIConversationPanel
                cefrLevel={cefrLevel}
                targetLanguage={targetLang}
                messages={messages}
                lessonProgress={lessonProgress}
                input={input}
                inputRef={chatInputRef}
                messagesEndRef={messagesEndRef}
                isSending={sending}
                isListening={isListening}
                isTranscribing={isTranscribing}
                micTarget={micTarget}
                playingText={playingText}
                errorMsg={errorMsg}
                onChangeInput={setInput}
                onToggleMic={toggleMic}
                onSend={handleSend}
                onPlay={handlePlay}
                onAdvanceToExercise={handleAdvanceToExercise}
              />
            </div>
          ) : (
            /* Coluna Direita: Etapa 2 (preservada) */
            <div className="lg:col-span-7 min-w-0 order-1 lg:order-2 flex flex-col rounded-2xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-white dark:bg-[var(--jvx-surface-card)] overflow-hidden min-h-[460px] lg:h-[640px]">
              <FixationGameStage
                challenges={fixationChallenges}
                playingText={playingText}
                onPlay={handlePlay}
                onComplete={() => setStep(3)}
              />
            </div>
          )}
        </div>
      )}

      <LessonReferenceModal
        mode={refModal}
        lessonTitle={lesson.title}
        glossary={pedagogy.glossary}
        grammarRules={pedagogy.grammarRules}
        playingText={playingText}
        onPlay={handlePlay}
        onClose={() => setRefModal(null)}
      />
    </PageContainer>
  );
}
