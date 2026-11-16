import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  CheckCircle2,
  Flame,
  Lock,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';

interface GoalsAndAchievementsPanelProps {
  masteredCount: number;
  cefrLevel: string;
}

export function GoalsPage() {
  const { user } = useAuth();
  const { data: enrollment } = useQuery({
    queryKey: ['goals-page-enrollment', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('enrollments')
        .select('estimated_cefr_level')
        .eq('student_id', user!.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: masteredRows = [] } = useQuery({
    queryKey: ['goals-page-mastery', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('mastery_records')
        .select('competency_id')
        .eq('student_id', user!.id)
        .eq('status', 'mastered');
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3B] dark:text-white">
          Metas, Desafios & Conquistas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Acompanhe sua meta diária de estudo, sequências e troféus desbloqueados.
        </p>
      </div>
      <GoalsAndAchievementsPanel
        masteredCount={masteredRows.length}
        cefrLevel={enrollment?.estimated_cefr_level ?? 'A1'}
      />
    </div>
  );
}

export function GoalsAndAchievementsPanel({
  masteredCount,
  cefrLevel,
}: GoalsAndAchievementsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savingGoal, setSavingGoal] = useState(false);

  const { data: prefs } = useQuery({
    queryKey: ['student-prefs-goal', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_identity')
        .from('student_preferences')
        .select('daily_minutes_goal')
        .eq('student_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: presenceRows = [] } = useQuery({
    queryKey: ['student-daily-presence', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('daily_presence')
        .select('activity_date, seconds_spent')
        .eq('student_id', user!.id)
        .order('activity_date', { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  const { data: aiCount = 0 } = useQuery({
    queryKey: ['student-ai-count', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { count } = await supabase
        .schema('core_ai')
        .from('ai_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user!.id);
      return count ?? 0;
    },
  });

  const dailyGoal = prefs?.daily_minutes_goal ?? 20;
  const todayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const todayRow = presenceRows.find((r) => r.activity_date === todayIso);
  const todayMinutes = Math.round((todayRow?.seconds_spent ?? 0) / 60);
  const totalMinutes = Math.round(
    presenceRows.reduce((acc, r) => acc + Number(r.seconds_spent ?? 0), 0) / 60
  );
  const activeDays = presenceRows.length;

  // Compute streak
  const dateSet = new Set(presenceRows.map((r) => r.activity_date));
  let streakDays = 0;
  const cursor = new Date(`${todayIso}T12:00:00Z`);
  if (!dateSet.has(todayIso)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streakDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const goalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyGoal)) * 100));
  const a2Unlocked =
    ['A2', 'B1', 'B2', 'C1', 'C2'].includes(cefrLevel) || masteredCount >= 2;

  const handleUpdateGoal = async (minutes: number) => {
    if (!user?.id || savingGoal) return;
    setSavingGoal(true);
    try {
      await supabase
        .schema('core_identity')
        .from('student_preferences')
        .update({ daily_minutes_goal: minutes })
        .eq('student_id', user.id);
      queryClient.invalidateQueries({ queryKey: ['student-prefs-goal', user.id] });
    } finally {
      setSavingGoal(false);
    }
  };

  const challenges = [
    {
      id: 'daily_goal',
      title: `Meta Diária (${dailyGoal} min)`,
      desc: `${todayMinutes}/${dailyGoal} min estudados hoje`,
      xp: 50,
      done: todayMinutes >= dailyGoal,
    },
    {
      id: 'streak_3',
      title: 'Consistência de 3 dias',
      desc: `${streakDays}/3 dias seguidos ativos`,
      xp: 120,
      done: streakDays >= 3,
    },
    {
      id: 'mastery_2',
      title: 'Desbloquear Nível A2',
      desc: `${Math.min(2, masteredCount)}/2 lições dominadas`,
      xp: 150,
      done: a2Unlocked,
    },
    {
      id: 'ai_practice',
      title: 'Prática com Tutor IA',
      desc: `${Math.min(5, aiCount)}/5 interações com IA`,
      xp: 100,
      done: aiCount >= 5,
    },
  ];

  const totalXp = challenges.reduce((acc, c) => acc + (c.done ? c.xp : 0), 0) + masteredCount * 80;

  const achievements = [
    {
      id: 'first_day',
      title: 'Primeiro Passo',
      desc: 'Entrou e iniciou sua jornada',
      unlocked: activeDays >= 1,
    },
    {
      id: 'goal_hit',
      title: 'Meta Cumprida',
      desc: `Completou ${dailyGoal}+ min em um dia`,
      unlocked: presenceRows.some((r) => Math.round((r.seconds_spent ?? 0) / 60) >= dailyGoal),
    },
    {
      id: 'streak_3',
      title: 'Foco Executivo',
      desc: 'Manteve 3 dias seguidos',
      unlocked: streakDays >= 3,
    },
    {
      id: 'a2_ready',
      title: 'Acesso Tutor Live A2',
      desc: 'Liberou conversação avançada',
      unlocked: a2Unlocked,
    },
    {
      id: 'ai_speaker',
      title: 'Orador IA',
      desc: '5+ diálogos com Tutor IA',
      unlocked: aiCount >= 5,
    },
    {
      id: 'time_100',
      title: '100 Minutos',
      desc: '100+ min totais de imersão',
      unlocked: totalMinutes >= 100,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Meta Diária & Desafios */}
      <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Meta Diária & Gamificação
            </span>
            <h2 className="text-base font-bold text-[#0B1F3B] dark:text-white mt-0.5">
              Hoje: {todayMinutes} de {dailyGoal} min
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400">
              <Flame className="h-3.5 w-3.5" /> {streakDays}d
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/20 px-2.5 py-1 text-xs font-bold text-[#D4AF37]">
              <Zap className="h-3.5 w-3.5" /> {totalXp} XP
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-[#06152B] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(4, goalPct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{goalPct}% da meta diária</span>
            <div className="flex items-center gap-1">
              <span>Meta:</span>
              {[10, 20, 30, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={savingGoal}
                  onClick={() => handleUpdateGoal(m)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                    dailyGoal === m
                      ? 'bg-[#D4AF37] text-[#0B1F3B]'
                      : 'bg-slate-100 dark:bg-[#06152B] text-slate-400 hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desafios */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
            Desafios Ativos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {challenges.map((ch) => (
              <div
                key={ch.id}
                className={`rounded-xl border p-3 text-xs flex items-start justify-between gap-2 ${
                  ch.done
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#06152B]'
                }`}
              >
                <div>
                  <p className="font-bold text-[#0B1F3B] dark:text-white">{ch.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{ch.desc}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    ch.done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                  }`}
                >
                  {ch.done ? '✓ Feito' : `+${ch.xp} XP`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Gestão de Conquistas */}
      <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> Gestão de Conquistas
            </span>
            <h2 className="text-base font-bold text-[#0B1F3B] dark:text-white mt-0.5">
              {unlockedCount} de {achievements.length} troféus desbloqueados
            </h2>
          </div>
          <Sparkles className="h-5 w-5 text-[#D4AF37]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-xl border p-3 text-xs space-y-1.5 transition ${
                ach.unlocked
                  ? 'border-[#D4AF37]/60 bg-gradient-to-br from-[#D4AF37]/15 to-transparent'
                  : 'border-slate-200 dark:border-[#1F4E79]/30 bg-slate-50 dark:bg-[#06152B]/60 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between">
                {ach.unlocked ? (
                  <Award className="h-5 w-5 text-[#D4AF37]" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-400" />
                )}
                {ach.unlocked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
              <p className="font-bold text-[#0B1F3B] dark:text-white leading-tight">
                {ach.title}
              </p>
              <p className="text-[10px] text-slate-400 leading-snug">{ach.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
