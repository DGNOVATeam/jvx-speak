import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';

export function DashboardPage() {
  const { user, profile } = useAuth();

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('enrollments')
        .select('estimated_cefr_level, course_id')
        .eq('student_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: lessons } = useQuery({
    queryKey: ['pilot-lessons'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_curriculum')
        .from('lessons')
        .select('id, title, estimated_minutes, unit:units(title, cefr_level, order_index), lesson_competencies(competency_id)')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      return (data ?? []).sort((a, b) => {
        const ua = (a.unit as { order_index?: number } | null)?.order_index ?? 0;
        const ub = (b.unit as { order_index?: number } | null)?.order_index ?? 0;
        return ua - ub;
      });
    },
  });

  const { data: mastery } = useQuery({
    queryKey: ['mastery', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('mastery_records')
        .select('competency_id, mastery_score, evidence_count, status')
        .eq('student_id', user!.id);
      return data ?? [];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('review_schedule')
        .select('id, competency_id, due_at, status')
        .eq('student_id', user!.id)
        .eq('status', 'pending');
      return data ?? [];
    },
  });

  const { data: nextDecision } = useQuery({
    queryKey: ['pedagogical-next', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pedagogical-next');
      if (error) return null;
      return data?.decision ?? null;
    },
  });

  const masteryMap = new Map((mastery ?? []).map((m) => [m.competency_id, m]));
  const recommendedLesson =
    (nextDecision?.competencyId
      ? (lessons ?? []).find((l) =>
          (l.lesson_competencies as Array<{ competency_id: string }> | undefined)?.some(
            (lc) => lc.competency_id === nextDecision.competencyId
          )
        )
      : undefined) ?? lessons?.[0];
  const masteredCount = (mastery ?? []).filter((m) => m.status === 'mastered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Olá, {profile?.full_name || 'Aluno'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Seu cockpit de evolução no padrão CEFR.
          </p>
        </div>

        {recommendedLesson && (
          <Link
            to={`/lessons/${recommendedLesson.id}`}
            className="jvx-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm shadow-sm"
          >
            <img src="/JVX_SPEAK_Brand_Kit/icons/ai-tutor-navy.svg" alt="" className="h-4 w-4" />
            Abrir Professor IA
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">Nível Estimado (Interno)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#D4AF37]">
              {enrollment?.estimated_cefr_level ?? 'A1'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-300">Trilha Negócios & Fundação</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">Competências Dominadas</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-emerald-500">{masteredCount}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">Revisões Pendentes (SRS)</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-[#0B1F3B] dark:text-white">{reviews?.length ?? 0}</span>
            <Clock className="h-5 w-5 text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* Próxima Decisão do PedagogicalEngine */}
      <div className="rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 dark:bg-[#0B1F3B] p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B68D1F] dark:text-[#D4AF37] mb-2">
          <Sparkles className="h-4 w-4" />
          Recomendação do Motor Pedagógico
        </div>
        <p className="text-sm text-[#0B1F3B] dark:text-slate-200 mb-4">
          {nextDecision?.reason ||
            'Comece pela primeira unidade A1 para registrar suas primeiras evidências de aprendizagem.'}
        </p>
        {recommendedLesson && (
          <Link
            to={`/lessons/${recommendedLesson.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F4E79] dark:text-[#D4AF37] hover:underline"
          >
            Ir para a próxima aula: {recommendedLesson.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Aulas Piloto Disponíveis */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          Unidades Piloto (A1 / A2)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(lessons ?? []).map((lesson) => {
            const unit = lesson.unit as { title?: string; cefr_level?: string } | null;
            const compIds =
              (lesson.lesson_competencies as Array<{ competency_id: string }> | undefined)?.map(
                (lc) => lc.competency_id
              ) ?? [];
            const isMastered =
              compIds.length > 0 && compIds.every((cid) => masteryMap.get(cid)?.status === 'mastered');
            return (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className={`group rounded-xl border p-5 transition ${
                  isMastered
                    ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-md bg-blue-600/10 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    {unit?.cefr_level ?? 'A1'}
                  </span>
                  {isMastered ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Dominada
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">{lesson.estimated_minutes} min</span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                  {lesson.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{unit?.title}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
