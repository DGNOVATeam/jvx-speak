import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Settings, CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { normalizeUiLocale, useI18n, type UiLocale } from '@/lib/i18n';

const FOCUS_OPTIONS = [
  { id: 'business_entrepreneur', label: 'Negócios & Empreendedorismo', desc: 'Reuniões, clientes, parceiros e gestão' },
  { id: 'travel', label: 'Viagens & Dia a Dia', desc: 'Aeroportos, hotéis, restaurantes e cidade' },
  { id: 'study', label: 'Estudos & Acadêmico', desc: 'Aulas, apresentações e leitura' },
  { id: 'tech', label: 'Tecnologia & Software', desc: 'Projetos, prazos, produto e times remotos' },
  { id: 'general', label: 'Comunicação Geral', desc: 'Conversação cotidiana equilibrada' },
];

export function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeCourseId, setActiveCourseId] = useState('11111111-1111-1111-1111-111111111111');
  const [nativeLanguage, setNativeLanguage] = useState<UiLocale>(locale);
  const [focusArea, setFocusArea] = useState('business_entrepreneur');
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['student-settings', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [{ data: profile }, { data: prefs }, { data: goal }, { data: courses }] = await Promise.all([
        supabase.schema('core_identity').from('profiles').select('active_course_id, native_language').eq('id', user!.id).maybeSingle(),
        supabase.schema('core_identity').from('student_preferences').select('daily_minutes_goal, ui_locale').eq('student_id', user!.id).maybeSingle(),
        supabase.schema('core_identity').from('learning_goals').select('focus_area').eq('student_id', user!.id).eq('is_active', true).maybeSingle(),
        supabase.schema('core_curriculum').from('courses').select('id, title, target_language').eq('is_published', true),
      ]);
      return { profile, prefs, goal, courses: courses ?? [] };
    },
  });

  useEffect(() => {
    if (data?.profile?.active_course_id) setActiveCourseId(data.profile.active_course_id);
    if (data?.profile?.native_language) setNativeLanguage(normalizeUiLocale(data.profile.native_language));
    if (data?.goal?.focus_area) setFocusArea(data.goal.focus_area);
    if (data?.prefs?.daily_minutes_goal) setDailyMinutes(data.prefs.daily_minutes_goal);
  }, [data]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      await Promise.all([
        supabase
          .schema('core_identity')
          .from('profiles')
          .update({ active_course_id: activeCourseId, native_language: nativeLanguage })
          .eq('id', user.id),
        supabase
          .schema('core_identity')
          .from('student_preferences')
          .update({ daily_minutes_goal: dailyMinutes, ui_locale: locale })
          .eq('student_id', user.id),
        supabase.schema('core_identity').from('learning_goals').update({ focus_area: focusArea }).eq('student_id', user.id).eq('is_active', true),
        supabase.schema('core_learning').from('enrollments').upsert(
          { student_id: user.id, course_id: activeCourseId, estimated_cefr_level: 'A1', status: 'active' },
          { onConflict: 'student_id,course_id' }
        ),
      ]);
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['pedagogical-next'] });
      queryClient.invalidateQueries({ queryKey: ['student-settings'] });
      setSavedMsg('Preferências atualizadas! A Teacher IA e o currículo já seguem sua nova configuração.');
    } finally {
      setSaving(false);
    }
  };

  const handleRedoDiagnostic = async () => {
    if (!user) return;
    await supabase.schema('core_identity').from('profiles').update({ onboarding_completed: false }).eq('id', user.id);
    await refreshProfile();
    navigate('/onboarding');
  };

  const handleExportData = async () => {
    const { data: exported } = await supabase.schema('core_identity').rpc('export_my_data');
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jvxspeak-meus-dados.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3B] dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#D4AF37]" />
          Meu Plano & Configurações
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Troque de idioma, ajuste seu objetivo (Trabalho, Viagem, Estudos) e gerencie seus dados.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-2">
            1. Idioma Ativo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data?.courses ?? []).map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setActiveCourseId(course.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  activeCourseId === course.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-slate-200 dark:border-[#1F4E79]/40 hover:border-[#D4AF37]/50'
                }`}
              >
                <p className="text-sm font-bold text-[#0B1F3B] dark:text-white">{course.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                  {course.target_language === 'es-ES' ? 'Modelo Espanha (Cervantes)' : 'Padrão Internacional CEFR'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-2">
              {t('native_lang_label')}
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value as UiLocale)}
              className="w-full rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-slate-50 dark:bg-[#06152B] px-3.5 py-2.5 text-sm"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-400">{t('native_lang_hint')}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-2">
              {t('ui_lang_label')}
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as UiLocale)}
              className="w-full rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-slate-50 dark:bg-[#06152B] px-3.5 py-2.5 text-sm"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-2">
            2. Foco / Contexto das Aulas
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFocusArea(opt.id)}
                className={`rounded-xl border p-3.5 text-left transition ${
                  focusArea === opt.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-slate-200 dark:border-[#1F4E79]/40 hover:border-[#D4AF37]/50'
                }`}
              >
                <p className="text-sm font-semibold text-[#0B1F3B] dark:text-white">{opt.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-2">
            3. Meta Diária
          </label>
          <select
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
            className="w-full sm:w-64 rounded-xl border border-slate-300 dark:border-[#1F4E79] bg-[#F4F6FA] dark:bg-[#06152B] px-3.5 py-2.5 text-sm"
          >
            <option value={15}>15 min/dia (Essencial)</option>
            <option value={20}>20 min/dia (Recomendado)</option>
            <option value={30}>30 min/dia (Acelerado)</option>
          </select>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="jvx-btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>

        {savedMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-6 flex flex-col sm:flex-row gap-3 justify-between">
        <button
          type="button"
          onClick={handleRedoDiagnostic}
          className="jvx-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refazer Diagnóstico Inicial
        </button>

        <button
          type="button"
          onClick={handleExportData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-[#1F4E79] px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#1F4E79]/30 transition"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar Meus Dados (RGPD / LGPD)
        </button>
      </div>
    </div>
  );
}
