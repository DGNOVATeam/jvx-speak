import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, PlayCircle, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';

export function SkillsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['skills-map', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [{ data: competencies }, { data: prereqs }, { data: mastery }, { data: lessonComps }] =
        await Promise.all([
          supabase.schema('core_curriculum').from('competencies').select('*').order('cefr_level'),
          supabase.schema('core_curriculum').from('competency_prerequisites').select('*'),
          supabase
            .schema('core_learning')
            .from('mastery_records')
            .select('*')
            .eq('student_id', user!.id),
          supabase.schema('core_curriculum').from('lesson_competencies').select('lesson_id, competency_id'),
        ]);

      return {
        competencies: competencies ?? [],
        prereqs: prereqs ?? [],
        mastery: mastery ?? [],
        lessonComps: lessonComps ?? [],
      };
    },
  });

  if (isLoading) {
    return <div className="text-sm text-slate-500">Carregando mapa de competências...</div>;
  }

  const competencies = data?.competencies ?? [];
  const masteryMap = new Map((data?.mastery ?? []).map((m) => [m.competency_id, m]));
  const compById = new Map(competencies.map((c) => [c.id, c]));
  const lessonByComp = new Map((data?.lessonComps ?? []).map((lc) => [lc.competency_id, lc.lesson_id]));

  const prereqMap = new Map<string, string[]>();
  for (const p of data?.prereqs ?? []) {
    const list = prereqMap.get(p.competency_id) ?? [];
    list.push(p.prerequisite_id);
    prereqMap.set(p.competency_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Painel de Competências CEFR
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Domínio interno (0–100%) baseado em evidências reais e pré-requisitos pedagógicos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {competencies.map((comp) => {
          const m = masteryMap.get(comp.id);
          const reqIds = prereqMap.get(comp.id) ?? [];
          const missingPrereqs = reqIds.filter((pid) => masteryMap.get(pid)?.status !== 'mastered');
          const isLocked = missingPrereqs.length > 0 && m?.status !== 'mastered';
          const isMastered = m?.status === 'mastered';
          const score = Number(m?.mastery_score ?? 0);
          const evidences = m?.evidence_count ?? 0;
          const lessonId = lessonByComp.get(comp.id);

          return (
            <div
              key={comp.id}
              className={`rounded-2xl border p-5 transition ${
                isMastered
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : isLocked
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 opacity-80'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-600/10 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    {comp.cefr_level}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{comp.code}</span>
                </div>

                {isMastered ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Dominada
                  </span>
                ) : isLocked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Lock className="h-3.5 w-3.5" />
                    Bloqueada
                  </span>
                ) : (
                  <span className="text-xs font-medium text-blue-500">Em progresso</span>
                )}
              </div>

              <h2 className="font-semibold text-slate-900 dark:text-white">{comp.title}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{comp.description}</p>

              {/* Barra de Domínio */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">
                    Evidências: {evidences}/{comp.min_evidences_required}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{score}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isMastered ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
              </div>

              {isLocked && (
                <p className="mt-3 text-[11px] text-amber-500">
                  Pré-requisitos pendentes:{' '}
                  {missingPrereqs.map((pid) => compById.get(pid)?.code ?? pid).join(', ')}
                </p>
              )}

              {!isLocked && lessonId && (
                <Link
                  to={`/lessons/${lessonId}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  {isMastered ? 'Revisar Aula' : 'Praticar Aula'}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
