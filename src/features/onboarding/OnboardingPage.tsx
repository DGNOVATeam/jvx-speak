import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Globe2, LogOut, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { LocaleSelector, normalizeUiLocale, useI18n, type UiLocale } from '@/lib/i18n';
import {
  getDiagnosticQuestions,
  type FocusArea,
  type TargetChoice,
} from '@/features/onboarding/diagnosticQuestions';

const COURSE_IDS = {
  en: '11111111-1111-1111-1111-111111111111',
  'es-ES': '22222222-2222-2222-2222-222222222222',
} as const;

const ONBOARDING_TEXT: Record<
  UiLocale,
  {
    title: string;
    subtitle: string;
    signOutBtn: string;
    nameLabel: string;
    namePlaceholder: string;
    dailyGoalLabel: string;
    goal15: string;
    goal20: string;
    goal30: string;
    whichLangLabel: string;
    langEnTitle: string;
    langEnSub: string;
    langEsTitle: string;
    langEsSub: string;
    langBothTitle: string;
    langBothSub: string;
    focusLabel: string;
    focusNames: Record<FocusArea, string>;
    diagnosticTitle: string;
    questionsWord: string;
    savingBtn: string;
    submitBtn: string;
  }
> = {
  'pt-BR': {
    title: 'Configuração & Diagnóstico Inicial',
    subtitle: 'Calibre seu idioma, foco de estudo e nível inicial (CEFR / Cervantes).',
    signOutBtn: 'Sair / Trocar conta',
    nameLabel: 'Como prefere ser chamado(a)?',
    namePlaceholder: 'Ex: João',
    dailyGoalLabel: 'Meta diária de estudo',
    goal15: '15 min/dia (Essencial)',
    goal20: '20 min/dia (Recomendado)',
    goal30: '30 min/dia (Acelerado)',
    whichLangLabel: 'Qual idioma você quer estudar?',
    langEnTitle: 'Inglês (CEFR)',
    langEnSub: 'A1 ao C2 Internacional',
    langEsTitle: 'Espanhol (Espanha)',
    langEsSub: 'Modelo Instituto Cervantes',
    langBothTitle: 'Os dois idiomas',
    langBothSub: 'Inglês + Espanhol liberados',
    focusLabel: 'Foco principal do aprendizado',
    focusNames: {
      business_entrepreneur: 'Negócios & Empreendedorismo',
      travel: 'Viagens & Dia a Dia',
      study: 'Estudos & Acadêmico',
      tech: 'Tecnologia & Software',
      general: 'Comunicação Geral',
    },
    diagnosticTitle: 'Diagnóstico Rápido',
    questionsWord: 'questões',
    savingBtn: 'Gerando seu plano...',
    submitBtn: 'Concluir Diagnóstico e Entrar',
  },
  es: {
    title: 'Configuración y Diagnóstico Inicial',
    subtitle: 'Calibra tu idioma, enfoque de estudio y nivel inicial (CEFR / Cervantes).',
    signOutBtn: 'Salir / Cambiar cuenta',
    nameLabel: '¿Cómo prefieres que te llamemos?',
    namePlaceholder: 'Ej: Carlos',
    dailyGoalLabel: 'Meta diaria de estudio',
    goal15: '15 min/día (Esencial)',
    goal20: '20 min/día (Recomendado)',
    goal30: '30 min/día (Acelerado)',
    whichLangLabel: '¿Qué idioma quieres estudiar?',
    langEnTitle: 'Inglés (CEFR)',
    langEnSub: 'A1 a C2 Internacional',
    langEsTitle: 'Español (España)',
    langEsSub: 'Modelo Instituto Cervantes',
    langBothTitle: 'Ambos idiomas',
    langBothSub: 'Inglés + Español incluidos',
    focusLabel: 'Enfoque principal de aprendizaje',
    focusNames: {
      business_entrepreneur: 'Negocios y Emprendimiento',
      travel: 'Viajes y Día a Día',
      study: 'Estudios y Académico',
      tech: 'Tecnología y Software',
      general: 'Comunicación General',
    },
    diagnosticTitle: 'Diagnóstico Rápido',
    questionsWord: 'preguntas',
    savingBtn: 'Generando tu plan...',
    submitBtn: 'Completar Diagnóstico y Entrar',
  },
  en: {
    title: 'Setup & Initial Assessment',
    subtitle: 'Calibrate your target language, study focus, and starting level (CEFR / Cervantes).',
    signOutBtn: 'Sign out / Switch account',
    nameLabel: 'What should we call you?',
    namePlaceholder: 'e.g. Alex',
    dailyGoalLabel: 'Daily study goal',
    goal15: '15 min/day (Essential)',
    goal20: '20 min/day (Recommended)',
    goal30: '30 min/day (Accelerated)',
    whichLangLabel: 'Which language do you want to learn?',
    langEnTitle: 'English (CEFR)',
    langEnSub: 'International A1 to C2',
    langEsTitle: 'Spanish (Spain)',
    langEsSub: 'Instituto Cervantes Model',
    langBothTitle: 'Both languages',
    langBothSub: 'English + Spanish unlocked',
    focusLabel: 'Main learning focus',
    focusNames: {
      business_entrepreneur: 'Business & Entrepreneurship',
      travel: 'Travel & Everyday Life',
      study: 'Studies & Academic',
      tech: 'Technology & Software',
      general: 'General Communication',
    },
    diagnosticTitle: 'Quick Assessment',
    questionsWord: 'questions',
    savingBtn: 'Building your plan...',
    submitBtn: 'Finish Assessment & Start',
  },
};

const FOCUS_IDS: FocusArea[] = [
  'business_entrepreneur',
  'travel',
  'study',
  'tech',
  'general',
];

export function OnboardingPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [nativeLanguage, setNativeLanguage] = useState<UiLocale>(
    normalizeUiLocale(profile?.native_language || locale)
  );
  const [targetChoice, setTargetChoice] = useState<TargetChoice>('en');
  const [focusArea, setFocusArea] = useState<FocusArea>('business_entrepreneur');
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const ui = ONBOARDING_TEXT[locale];
  const activeQuestions = getDiagnosticQuestions(targetChoice, focusArea);

  const handleTargetChange = (choice: TargetChoice) => {
    setTargetChoice(choice);
    setAnswers({});
  };

  const handleFocusChange = (focus: FocusArea) => {
    setFocusArea(focus);
    setAnswers({});
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let correctCount = 0;
      activeQuestions.forEach((q) => {
        const idx = answers[q.id];
        if (idx !== undefined && q.options[idx]?.correct) {
          correctCount += 1;
        }
      });

      const estimatedLevel = correctCount >= activeQuestions.length ? 'A2' : 'A1';
      const primaryCourseId =
        targetChoice === 'es-ES' ? COURSE_IDS['es-ES'] : COURSE_IDS.en;

      await supabase
        .schema('core_identity')
        .from('profiles')
        .update({
          full_name: fullName.trim() || 'Aluno',
          native_language: nativeLanguage,
          active_course_id: primaryCourseId,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      await supabase
        .schema('core_identity')
        .from('student_preferences')
        .update({ daily_minutes_goal: dailyMinutes, ui_locale: locale })
        .eq('student_id', user.id);

      await supabase
        .schema('core_identity')
        .from('learning_goals')
        .update({ focus_area: focusArea, target_cefr_level: 'B2' })
        .eq('student_id', user.id);

      const coursesToEnroll =
        targetChoice === 'both'
          ? [COURSE_IDS.en, COURSE_IDS['es-ES']]
          : [primaryCourseId];

      await Promise.all(
        coursesToEnroll.map((courseId) =>
          supabase.schema('core_learning').from('enrollments').upsert(
            {
              student_id: user.id,
              course_id: courseId,
              estimated_cefr_level: estimatedLevel,
              status: 'active',
            },
            { onConflict: 'student_id,course_id' }
          )
        )
      );

      await refreshProfile();
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#06152B] py-8 px-4">
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 dark:border-[#1F4E79]/50 bg-white dark:bg-[#0B1F3B] p-6 sm:p-8 shadow-xl">
        {/* Top Bar: Idioma da Interface + Sair */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-[#1F4E79]/40">
          <LocaleSelector compact />
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#1F4E79]/60 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            {ui.signOutBtn}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B1F3B] dark:text-white">{ui.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">{ui.subtitle}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {ui.nameLabel}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={ui.namePlaceholder}
                className="w-full rounded-lg border border-slate-300 dark:border-[#1F4E79] bg-white dark:bg-[#06152B] px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-slate-300 dark:border-[#1F4E79] bg-white dark:bg-[#06152B] px-3 py-2 text-sm"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {ui.dailyGoalLabel}
              </label>
              <select
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-[#1F4E79] bg-white dark:bg-[#06152B] px-3 py-2 text-sm"
              >
                <option value={15}>{ui.goal15}</option>
                <option value={20}>{ui.goal20}</option>
                <option value={30}>{ui.goal30}</option>
              </select>
            </div>
          </div>

          {/* Seleção do Idioma que deseja estudar */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-2 flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5" />
              {ui.whichLangLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'en' as const, title: ui.langEnTitle, sub: ui.langEnSub },
                { id: 'es-ES' as const, title: ui.langEsTitle, sub: ui.langEsSub },
                { id: 'both' as const, title: ui.langBothTitle, sub: ui.langBothSub },
              ].map((langOpt) => (
                <button
                  key={langOpt.id}
                  type="button"
                  onClick={() => handleTargetChange(langOpt.id)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    targetChoice === langOpt.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0B1F3B] dark:text-white'
                      : 'border-slate-200 dark:border-[#1F4E79]/40 hover:border-[#D4AF37]/50'
                  }`}
                >
                  <p className="text-xs font-bold">{langOpt.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">{langOpt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Foco Principal (todas as 5 opções) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-2">
              {ui.focusLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {FOCUS_IDS.map((focusId) => (
                <button
                  key={focusId}
                  type="button"
                  onClick={() => handleFocusChange(focusId)}
                  className={`rounded-xl border p-3 text-left text-xs font-semibold transition ${
                    focusArea === focusId
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0B1F3B] dark:text-white'
                      : 'border-slate-200 dark:border-[#1F4E79]/40 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {ui.focusNames[focusId]}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnóstico Rápido Adaptado */}
          <div className="border-t border-slate-200 dark:border-[#1F4E79]/40 pt-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {ui.diagnosticTitle} ({activeQuestions.length} {ui.questionsWord})
            </h2>
            <div className="space-y-4">
              {activeQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#06152B] p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase text-[#D4AF37]">
                      {q.lang === 'es-ES' ? ui.langEsTitle : ui.langEnTitle} • {q.level}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
                    {qIdx + 1}. {q.question[locale]}
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
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0B1F3B] dark:text-white'
                              : 'border-slate-200 dark:border-[#1F4E79]/40 hover:border-[#D4AF37]/50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {selected && <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />}
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
            disabled={saving || Object.keys(answers).length < activeQuestions.length}
            onClick={handleComplete}
            className="w-full jvx-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 py-3 text-sm"
          >
            {saving ? ui.savingBtn : ui.submitBtn}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
