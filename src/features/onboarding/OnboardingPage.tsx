import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { normalizeUiLocale, useI18n, type UiLocale } from '@/lib/i18n';

const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'q1',
    level: 'A1',
    question: 'Como você se apresenta dizendo que é fundador de uma empresa?',
    options: [
      { label: 'I am the founder of my company.', correct: true },
      { label: 'I have founder in my company.', correct: false },
      { label: 'Me founder of company.', correct: false },
    ],
  },
  {
    id: 'q2',
    level: 'A1',
    question: 'Qual frase descreve corretamente uma rotina habitual de trabalho?',
    options: [
      { label: 'I usually start work at 8 a.m.', correct: true },
      { label: 'I starting work at 8 a.m. usually.', correct: false },
      { label: 'I am start work at 8 a.m.', correct: false },
    ],
  },
  {
    id: 'q3',
    level: 'A2',
    question: 'Como pedir educadamente que alguém envie um relatório até sexta-feira?',
    options: [
      { label: 'Could you send the report by Friday?', correct: true },
      { label: 'You send report in Friday.', correct: false },
      { label: 'Can you sending report until Friday?', correct: false },
    ],
  },
];

export function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [nativeLanguage, setNativeLanguage] = useState<UiLocale>(
    normalizeUiLocale(profile?.native_language || locale)
  );
  const [focusArea, setFocusArea] = useState<'business_entrepreneur' | 'general' | 'tech'>('business_entrepreneur');
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let correctCount = 0;
      DIAGNOSTIC_QUESTIONS.forEach((q) => {
        const idx = answers[q.id];
        if (idx !== undefined && q.options[idx]?.correct) {
          correctCount += 1;
        }
      });

      const estimatedLevel = correctCount >= 3 ? 'A2' : 'A1';

      // 1. Atualizar perfil
      await supabase
        .schema('core_identity')
        .from('profiles')
        .update({
          full_name: fullName.trim() || 'Aluno',
          native_language: nativeLanguage,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      // 2. Preferências e metas
      await supabase
        .schema('core_identity')
        .from('student_preferences')
        .update({ daily_minutes_goal: dailyMinutes, ui_locale: nativeLanguage })
        .eq('student_id', user.id);

      await supabase
        .schema('core_identity')
        .from('learning_goals')
        .update({ focus_area: focusArea, target_cefr_level: 'B2' })
        .eq('student_id', user.id);

      // 3. Matrícula no curso piloto
      await supabase
        .schema('core_learning')
        .from('enrollments')
        .upsert(
          {
            student_id: user.id,
            course_id: '11111111-1111-1111-1111-111111111111',
            estimated_cefr_level: estimatedLevel,
            status: 'active',
          },
          { onConflict: 'student_id,course_id' }
        );

      await refreshProfile();
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configuração & Diagnóstico Inicial</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Vamos calibrar seu plano de estudos no padrão CEFR.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Como prefere ser chamado(a)?
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('native_lang_label')}
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => {
                  const val = e.target.value as UiLocale;
                  setNativeLanguage(val);
                  setLocale(val);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Meta diária de estudo
              </label>
              <select
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value={15}>15 min/dia (Essencial)</option>
                <option value={20}>20 min/dia (Recomendado)</option>
                <option value={30}>30 min/dia (Acelerado)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Foco principal do aprendizado
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'business_entrepreneur', label: 'Negócios & Gestão 30+' },
                { id: 'tech', label: 'Tecnologia & Software' },
                { id: 'general', label: 'Inglês Geral & Viagens' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFocusArea(item.id as typeof focusArea)}
                  className={`rounded-lg border p-3 text-left text-xs font-medium transition ${
                    focusArea === item.id
                      ? 'border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Diagnóstico Rápido (3 questões)
            </h2>
            <div className="space-y-5">
              {DIAGNOSTIC_QUESTIONS.map((q, qIdx) => (
                <div key={q.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const selected = answers[q.id] === oIdx;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                          className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition ${
                            selected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {selected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={saving || Object.keys(answers).length < DIAGNOSTIC_QUESTIONS.length}
            onClick={handleComplete}
            className="w-full jvx-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 py-3 text-sm"
          >
            {saving ? 'Gerando seu plano...' : 'Concluir Diagnóstico e Entrar'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
