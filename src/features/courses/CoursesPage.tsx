import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Play, BookOpen, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { resolveLessonMedia } from '@/lib/pedagogicalMedia';

export function CoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: courses } = useQuery({
    queryKey: ['courses-all'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_curriculum')
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('target_language', { ascending: true });
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile-active-course', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_identity')
        .from('profiles')
        .select('active_course_id')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const activeCourseId =
    selectedCourseId ?? profile?.active_course_id ?? courses?.[0]?.id ?? '11111111-1111-1111-1111-111111111111';

  const activeCourse = (courses ?? []).find((c) => c.id === activeCourseId) ?? courses?.[0];

  const { data: curriculumData, isLoading } = useQuery({
    queryKey: ['course-curriculum', activeCourseId, user?.id],
    enabled: Boolean(activeCourseId && user?.id),
    queryFn: async () => {
      const [{ data: units }, { data: mastery }, { data: prereqs }] = await Promise.all([
        supabase
          .schema('core_curriculum')
          .from('units')
          .select('*, lessons(*, lesson_competencies(competency_id))')
          .eq('course_id', activeCourseId)
          .eq('is_published', true)
          .order('order_index', { ascending: true }),
        supabase
          .schema('core_learning')
          .from('mastery_records')
          .select('competency_id, mastery_score, status')
          .eq('student_id', user!.id),
        supabase.schema('core_curriculum').from('competency_prerequisites').select('*'),
      ]);

      return {
        units: units ?? [],
        mastery: mastery ?? [],
        prereqs: prereqs ?? [],
      };
    },
  });

  const handleSelectCourse = async (courseId: string) => {
    setSelectedCourseId(courseId);
    if (!user) return;
    await supabase
      .schema('core_identity')
      .from('profiles')
      .update({ active_course_id: courseId })
      .eq('id', user.id);

    await supabase
      .schema('core_learning')
      .from('enrollments')
      .upsert(
        { student_id: user.id, course_id: courseId, estimated_cefr_level: 'A1', status: 'active' },
        { onConflict: 'student_id,course_id' }
      );

    queryClient.invalidateQueries({ queryKey: ['pedagogical-next'] });
    queryClient.invalidateQueries({ queryKey: ['profile-active-course'] });
  };

  const masteryMap = new Map((curriculumData?.mastery ?? []).map((m) => [m.competency_id, m]));
  const prereqMap = new Map<string, string[]>();
  for (const p of curriculumData?.prereqs ?? []) {
    const list = prereqMap.get(p.competency_id) ?? [];
    list.push(p.prerequisite_id);
    prereqMap.set(p.competency_id, list);
  }

  return (
    <div className="space-y-6">
      {/* Header Premium + Seletor de Idioma */}
      <div className="rounded-2xl border border-[#1F4E79]/40 bg-gradient-to-br from-[#0B1F3B] to-[#06152B] p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#D4AF37]">
              <Globe className="h-3.5 w-3.5" />
              Grade Curricular Oficial
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {activeCourse?.title ?? 'Mapa de Cursos'}
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl">
              {activeCourse?.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(courses ?? []).map((course) => {
              const isSelected = course.id === activeCourseId;
              const isSpanish = course.target_language === 'es-ES';
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleSelectCourse(course.id)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#0B1F3B] border-[#D4AF37] shadow'
                      : 'bg-[#06152B]/70 text-slate-200 border-[#1F4E79] hover:border-[#D4AF37]/60'
                  }`}
                >
                  {isSpanish ? '🇪🇸 Espanhol (Cervantes)' : '🇺🇸 Inglês (CEFR)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Carregando grade curricular...</div>
      ) : (
        <div className="space-y-5">
          {(curriculumData?.units ?? []).map((unit) => {
            const lessons = ((unit.lessons as Array<{
              id: string;
              title: string;
              order_index: number;
              estimated_minutes: number;
              vocabulary_chunks: unknown[];
              lesson_competencies: Array<{ competency_id: string }>;
            }>) ?? []).sort((a, b) => a.order_index - b.order_index);

            const objectives = (unit.objectives as string[]) ?? [];

            return (
              <div
                key={unit.id}
                className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-md bg-[#D4AF37]/15 px-2.5 py-0.5 text-xs font-bold text-[#B68D1F] dark:text-[#D4AF37]">
                        Nível {unit.cefr_level}
                      </span>
                      <span className="text-xs text-slate-400">Unidade {unit.order_index}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#0B1F3B] dark:text-white">{unit.title}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">{unit.description}</p>
                  </div>
                </div>

                {objectives.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {objectives.map((obj) => (
                      <span
                        key={obj}
                        className="rounded-full bg-[#F4F6FA] dark:bg-[#06152B] px-3 py-1 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F4E79]/30"
                      >
                        • {obj}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessons.map((lesson) => {
                    const compId = lesson.lesson_competencies?.[0]?.competency_id;
                    const m = compId ? masteryMap.get(compId) : undefined;
                    const isMastered = m?.status === 'mastered';
                    const reqs = compId ? prereqMap.get(compId) ?? [] : [];
                    const isLocked =
                      reqs.length > 0 &&
                      reqs.some((pid) => masteryMap.get(pid)?.status !== 'mastered') &&
                      !isMastered;
                    const media = resolveLessonMedia(lesson.title);

                    return (
                      <div
                        key={lesson.id}
                        className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition ${
                          isMastered
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : isLocked
                            ? 'border-slate-200 dark:border-[#1F4E79]/20 bg-slate-50 dark:bg-[#06152B]/60 opacity-75'
                            : 'border-slate-200 dark:border-[#1F4E79]/40 bg-[#F4F6FA]/50 dark:bg-[#06152B] hover:border-[#D4AF37]/60'
                        }`}
                      >
                        <div>
                          {/* Capa Contextualizada da Lição */}
                          <div
                            className={`relative h-36 w-full overflow-hidden bg-gradient-to-br ${media.fallbackGradient}`}
                          >
                            {media.heroImageUrl && (
                              <img
                                src={media.heroImageUrl}
                                alt={media.altText}
                                loading="lazy"
                                className={`h-full w-full object-cover transition-transform duration-500 ${
                                  isLocked ? 'grayscale opacity-50' : 'group-hover:scale-105'
                                }`}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#06152B] via-[#06152B]/25 to-transparent" />

                            {/* Badges superiores */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-slate-200 font-medium">
                                <BookOpen className="h-3 w-3 text-[#D4AF37]" />
                                {lesson.estimated_minutes} min
                              </span>
                              {isMastered ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 font-semibold text-white shadow">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Dominada ({Number(m?.mastery_score ?? 0)}%)
                                </span>
                              ) : isLocked ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-slate-300">
                                  <Lock className="h-3 w-3" />
                                  Bloqueada
                                </span>
                              ) : (
                                <span className="rounded-full bg-[#D4AF37] px-2.5 py-0.5 font-bold text-[#0B1F3B] shadow">
                                  Disponível
                                </span>
                              )}
                            </div>

                            {/* Tag do Cenário */}
                            <span className="absolute bottom-2 left-3 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                              {media.scenarioLabel}
                            </span>
                          </div>

                          <div className="p-4 pb-2">
                            <h3 className="font-bold text-sm text-[#0B1F3B] dark:text-white leading-snug">
                              {lesson.title}
                            </h3>
                          </div>
                        </div>

                        {!isLocked && (
                          <div className="p-4 pt-2">
                            <Link
                              to={`/lessons/${lesson.id}`}
                              className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition ${
                                isMastered
                                  ? 'border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10'
                                  : 'jvx-btn-primary'
                              }`}
                            >
                              <Play className="h-3 w-3" />
                              {isMastered ? 'Revisar Lição' : 'Estudar Agora'}
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
