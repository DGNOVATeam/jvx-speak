import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';

export function SchedulePage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['srs-schedule', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [{ data: reviews }, { data: competencies }, { data: lessonComps }] = await Promise.all([
        supabase
          .schema('core_learning')
          .from('review_schedule')
          .select('*')
          .eq('student_id', user!.id)
          .order('due_at', { ascending: true }),
        supabase.schema('core_curriculum').from('competencies').select('id, code, title, cefr_level'),
        supabase.schema('core_curriculum').from('lesson_competencies').select('lesson_id, competency_id'),
      ]);

      return {
        reviews: reviews ?? [],
        competencies: competencies ?? [],
        lessonComps: lessonComps ?? [],
      };
    },
  });

  if (isLoading) {
    return <div className="text-sm text-slate-500">Carregando agenda de revisões...</div>;
  }

  const compMap = new Map((data?.competencies ?? []).map((c) => [c.id, c]));
  const lessonByComp = new Map((data?.lessonComps ?? []).map((lc) => [lc.competency_id, lc.lesson_id]));
  const reviews = data?.reviews ?? [];
  const nowMs = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Agenda de Revisões Espaçadas (SRS)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          O algoritmo agenda revisões exatamente antes de você esquecer cada competência.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-500">
            Nenhuma revisão agendada ainda. Complete exercícios nas aulas para gerar seu cronograma SRS.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => {
            const comp = compMap.get(rev.competency_id);
            const lessonId = lessonByComp.get(rev.competency_id);
            const dueDate = new Date(rev.due_at);
            const isOverdue = rev.status === 'pending' && dueDate.getTime() <= nowMs;

            return (
              <div
                key={rev.id}
                className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  isOverdue
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-600/10 px-2 py-0.5 text-xs font-semibold text-blue-600">
                      {comp?.cefr_level ?? 'A1'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{comp?.code}</span>
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Revisar hoje
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Agendada
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {comp?.title ?? 'Competência'}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Próxima revisão: {dueDate.toLocaleDateString('pt-BR')} às{' '}
                      {dueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>• Intervalo: {rev.interval_days} dia(s)</span>
                    <span>• Repetições: {rev.repetitions}</span>
                  </p>
                </div>

                {lessonId && (
                  <Link
                    to={`/lessons/${lessonId}`}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition shrink-0 ${
                      isOverdue
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    Revisar Agora
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
