import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Flame, RotateCcw, Trophy, Volume2, XCircle } from 'lucide-react';
import type { FixationChallenge } from './lessonPedagogy';

interface FixationGameStageProps {
  challenges: FixationChallenge[];
  playingText: string | null;
  onPlay: (text: string) => void;
  onComplete: () => void;
}

export function FixationGameStage({
  challenges,
  playingText,
  onPlay,
  onComplete,
}: FixationGameStageProps) {
  const [idx, setIdx] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const current = challenges[idx];

  const builtSentence = useMemo(() => {
    if (!current?.tokens) return '';
    return selectedTokens.map((i) => current.tokens![i]).join(' ');
  }, [current, selectedTokens]);

  const resetGame = () => {
    setIdx(0);
    setXp(0);
    setStreak(0);
    setCorrectCount(0);
    setSelectedTokens([]);
    setSelectedOption(null);
    setFeedback(null);
    setFinished(false);
  };

  if (!challenges.length) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-sm text-slate-400">Nenhum desafio disponível para esta lição.</p>
        <button type="button" onClick={onComplete} className="jvx-btn-primary px-5 py-2.5 text-sm">
          Ir para Prática com Teacher IA →
        </button>
      </div>
    );
  }

  const registerAnswer = (isCorrect: boolean) => {
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setCorrectCount((c) => c + 1);
      setXp((prev) => prev + 25 + (nextStreak > 1 ? 10 : 0));
    } else {
      setStreak(0);
    }
  };

  const handleCheckOrder = () => {
    if (!current || feedback) return;
    const isCorrect = builtSentence.trim().toLowerCase() === current.targetText.trim().toLowerCase();
    registerAnswer(isCorrect);
  };

  const handleSelectOption = (label: string, isCorrect: boolean) => {
    if (feedback) return;
    setSelectedOption(label);
    registerAnswer(isCorrect);
  };

  const handleNext = () => {
    if (idx + 1 >= challenges.length) {
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setSelectedTokens([]);
    setSelectedOption(null);
    setFeedback(null);
  };

  if (finished) {
    const accuracy = Math.round((correctCount / challenges.length) * 100);
    const medal =
      accuracy >= 90
        ? { label: 'Medalha de Ouro', color: 'text-[#D4AF37]' }
        : accuracy >= 65
          ? { label: 'Medalha de Prata', color: 'text-slate-300' }
          : { label: 'Medalha de Bronze', color: 'text-amber-500' };

    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5 overflow-y-auto">
        <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
          <Trophy className={`h-8 w-8 ${medal.color}`} />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            Fixação Concluída
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{medal.label}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            Você acertou <strong>{correctCount}</strong> de <strong>{challenges.length}</strong> desafios ({accuracy}%) e ganhou{' '}
            <strong className="text-[#D4AF37]">+{xp} XP</strong>!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={resetGame}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-[#1F4E79] px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1F4E79]/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Jogar de Novo
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="flex-1 jvx-btn-primary px-5 py-2.5 text-sm"
          >
            Ir para Teacher IA →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Gamificado */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#1F4E79]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Award className="h-4 w-4 text-[#D4AF37]" />
          <span>
            Desafio {idx + 1} de {challenges.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-amber-400">
            <Flame className="h-3.5 w-3.5" />
            {streak}x
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#D4AF37]/15 px-2.5 py-1 text-[#D4AF37]">
            +{xp} XP
          </span>
        </div>
      </div>

      {/* Corpo do Desafio */}
      <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto space-y-5">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{current.promptPt}</p>

          {current.audioText && (
            <button
              type="button"
              onClick={() => onPlay(current.audioText!)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#1F4E79]/60 bg-[#06152B] px-4 py-2.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#1F4E79]/30 transition"
            >
              <Volume2 className={`h-4 w-4 ${playingText === current.audioText ? 'animate-pulse' : ''}`} />
              {current.type === 'listen' ? 'Ouvir frase em áudio' : 'Ouvir pronúncia'}
            </button>
          )}

          {current.type === 'cloze' && current.clozeSentence && (
            <div className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#06152B] p-4 text-base font-semibold tracking-wide text-slate-900 dark:text-white">
              {current.clozeSentence}
            </div>
          )}

          {current.type === 'order' && current.tokens && (
            <div className="space-y-4">
              <div className="min-h-14 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#1F4E79] bg-slate-50 dark:bg-[#06152B] p-3 flex flex-wrap gap-2 items-center">
                {selectedTokens.length === 0 ? (
                  <span className="text-xs text-slate-400">Toque nas palavras abaixo na ordem certa...</span>
                ) : (
                  selectedTokens.map((tokenIdx) => (
                    <button
                      key={`sel-${tokenIdx}`}
                      type="button"
                      disabled={Boolean(feedback)}
                      onClick={() => setSelectedTokens((prev) => prev.filter((i) => i !== tokenIdx))}
                      className="rounded-lg bg-[#D4AF37] text-[#0B1F3B] px-3 py-1.5 text-xs font-bold shadow-sm"
                    >
                      {current.tokens![tokenIdx]}
                    </button>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {current.tokens.map((tok, tokenIdx) => {
                  const used = selectedTokens.includes(tokenIdx);
                  return (
                    <button
                      key={`tok-${tokenIdx}`}
                      type="button"
                      disabled={used || Boolean(feedback)}
                      onClick={() => setSelectedTokens((prev) => [...prev, tokenIdx])}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        used
                          ? 'opacity-30 border-slate-700 bg-slate-800 text-slate-500'
                          : 'border-slate-300 dark:border-[#1F4E79] bg-white dark:bg-[#06152B] text-slate-800 dark:text-slate-100 hover:border-[#D4AF37]'
                      }`}
                    >
                      {tok}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(current.type === 'listen' || current.type === 'cloze') && current.options && (
            <div className="space-y-2.5">
              {current.options.map((opt) => {
                const isSelected = selectedOption === opt.label;
                let style =
                  'border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#06152B] text-slate-800 dark:text-slate-100 hover:border-[#D4AF37]';
                if (feedback) {
                  if (opt.isCorrect) {
                    style = 'border-emerald-500 bg-emerald-500/15 text-emerald-400';
                  } else if (isSelected) {
                    style = 'border-rose-500 bg-rose-500/15 text-rose-400';
                  }
                }
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() => handleSelectOption(opt.label, opt.isCorrect)}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition ${style}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé de Feedback / Ação */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-[#1F4E79]/40">
          {feedback && (
            <div
              className={`rounded-xl p-3 text-xs flex items-center gap-2 font-medium ${
                feedback === 'correct'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedback === 'correct' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Excelente! +25 XP garantidos.
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Resposta esperada: <strong>{current.targetText}</strong>
                  </span>
                </>
              )}
            </div>
          )}

          {current.type === 'order' && !feedback ? (
            <button
              type="button"
              disabled={selectedTokens.length === 0}
              onClick={handleCheckOrder}
              className="w-full jvx-btn-primary disabled:opacity-50 py-2.5 text-sm"
            >
              Verificar Resposta
            </button>
          ) : feedback ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full jvx-btn-primary py-2.5 text-sm"
            >
              {idx + 1 >= challenges.length ? 'Ver Resultado & Medalha →' : 'Próximo Desafio →'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
