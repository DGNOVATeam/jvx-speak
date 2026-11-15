import { corsHeaders, requireAuthenticatedUser } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req);
    if (auth.error || !auth.user || !auth.adminClient) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile } = await auth.adminClient
      .schema('core_identity')
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso restrito a administradores.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [
      usersRes,
      profilesRes,
      prefsRes,
      goalsRes,
      enrollmentsRes,
      masteryRes,
      attemptsRes,
      reviewsRes,
      presenceRes,
      lessonsRes,
      competenciesRes,
      lessonCompRes,
      supportThreadsRes,
    ] = await Promise.all([
      auth.adminClient.auth.admin.listUsers({ perPage: 500 }),
      auth.adminClient
        .schema('core_identity')
        .from('profiles')
        .select('id, role, full_name, native_language, onboarding_completed, created_at'),
      auth.adminClient
        .schema('core_identity')
        .from('student_preferences')
        .select('student_id, ui_locale, daily_minutes_goal'),
      auth.adminClient
        .schema('core_identity')
        .from('learning_goals')
        .select('student_id, target_cefr_level, focus_area, weekly_sessions_target, is_active')
        .eq('is_active', true),
      auth.adminClient
        .schema('core_learning')
        .from('enrollments')
        .select('student_id, course_id, course:courses(id, title, target_language)')
        .eq('status', 'active'),
      auth.adminClient
        .schema('core_learning')
        .from('mastery_records')
        .select('student_id, competency_id, mastery_score, status, evidence_count, last_practiced_at'),
      auth.adminClient
        .schema('core_learning')
        .from('attempts')
        .select('student_id, competency_id, is_correct, score_0_100, created_at')
        .order('created_at', { ascending: false }),
      auth.adminClient
        .schema('core_learning')
        .from('review_schedule')
        .select('student_id, due_at, status'),
      auth.adminClient
        .schema('core_learning')
        .from('daily_presence')
        .select('student_id, activity_date, seconds_spent, sessions_count, last_lesson_id, last_seen_at')
        .order('activity_date', { ascending: false }),
      auth.adminClient
        .schema('core_curriculum')
        .from('lessons')
        .select('id, title, unit:units(title, cefr_level, course_id)'),
      auth.adminClient
        .schema('core_curriculum')
        .from('competencies')
        .select('id, title, cefr_level, skill_domain'),
      auth.adminClient
        .schema('core_curriculum')
        .from('lesson_competencies')
        .select('lesson_id, competency_id'),
      auth.adminClient
        .schema('core_learning')
        .from('support_threads')
        .select('id, student_id, status, unread_by_admin'),
    ]);

    const emailMap = new Map<string, string>();
    for (const u of usersRes.data?.users ?? []) {
      if (u.email) emailMap.set(u.id, u.email);
    }

    const prefsMap = new Map<string, { ui_locale: string; daily_minutes_goal: number }>();
    for (const p of prefsRes.data ?? []) {
      prefsMap.set(p.student_id, p);
    }

    const goalsMap = new Map<
      string,
      { target_cefr_level: string; focus_area: string; weekly_sessions_target: number }
    >();
    for (const g of goalsRes.data ?? []) {
      goalsMap.set(g.student_id, g);
    }

    const enrollMap = new Map<
      string,
      { course_id: string | null; course_title: string; target_language: string }
    >();
    for (const e of enrollmentsRes.data ?? []) {
      const c = e.course as { id?: string; title?: string; target_language?: string } | null;
      if (c) {
        enrollMap.set(e.student_id, {
          course_id: c.id ?? e.course_id ?? null,
          course_title: c.title ?? 'Curso',
          target_language: c.target_language ?? 'en',
        });
      }
    }

    const lessonMap = new Map<
      string,
      { id: string; title: string; unit_title: string; cefr_level: string }
    >();
    for (const l of lessonsRes.data ?? []) {
      const u = l.unit as { title?: string; cefr_level?: string } | null;
      lessonMap.set(l.id, {
        id: l.id,
        title: l.title,
        unit_title: u?.title ?? '',
        cefr_level: u?.cefr_level ?? 'A1',
      });
    }

    const compMap = new Map<
      string,
      { id: string; title: string; cefr_level: string; skill_domain: string }
    >();
    for (const c of competenciesRes.data ?? []) {
      compMap.set(c.id, c);
    }

    const compToLessonMap = new Map<string, string>();
    for (const lc of lessonCompRes.data ?? []) {
      if (!compToLessonMap.has(lc.competency_id)) {
        compToLessonMap.set(lc.competency_id, lc.lesson_id);
      }
    }

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const todayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    const computeStreak = (datesDesc: string[]): number => {
      if (datesDesc.length === 0) return 0;
      const dateSet = new Set(datesDesc);
      const cursor = new Date(`${todayIso}T12:00:00Z`);
      if (!dateSet.has(todayIso)) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        const yesterdayIso = cursor.toISOString().slice(0, 10);
        if (!dateSet.has(yesterdayIso)) return 0;
      }
      let streak = 0;
      while (true) {
        const iso = cursor.toISOString().slice(0, 10);
        if (!dateSet.has(iso)) break;
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      return streak;
    };

    const students = (profilesRes.data ?? []).map((prof) => {
      const myAttempts = (attemptsRes.data ?? []).filter((a) => a.student_id === prof.id);
      const myMastery = (masteryRes.data ?? []).filter((m) => m.student_id === prof.id);
      const myReviews = (reviewsRes.data ?? []).filter((r) => r.student_id === prof.id);
      const myPresence = (presenceRes.data ?? []).filter((p) => p.student_id === prof.id);
      const myThreads = (supportThreadsRes.data ?? []).filter((t) => t.student_id === prof.id);

      const presenceByDate = new Map<
        string,
        { date: string; minutes: number; sessions: number; lesson_title: string | null }
      >();

      for (const p of myPresence) {
        const lInfo = p.last_lesson_id ? lessonMap.get(p.last_lesson_id) : null;
        presenceByDate.set(p.activity_date, {
          date: p.activity_date,
          minutes: Math.max(1, Math.round((p.seconds_spent ?? 0) / 60)),
          sessions: p.sessions_count ?? 1,
          lesson_title: lInfo?.title ?? null,
        });
      }

      // Ensure any attempt date not in daily_presence also appears
      for (const a of myAttempts) {
        const d = new Date(a.created_at).toLocaleDateString('en-CA', {
          timeZone: 'America/Sao_Paulo',
        });
        if (!presenceByDate.has(d)) {
          presenceByDate.set(d, {
            date: d,
            minutes: 4,
            sessions: 1,
            lesson_title: null,
          });
        }
      }

      const dailyCalendar = Array.from(presenceByDate.values()).sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      const activeDaysCount = dailyCalendar.length;
      const totalMinutes =
        myPresence.length > 0
          ? Math.max(
              myAttempts.length * 2,
              Math.round(
                myPresence.reduce((acc, p) => acc + Number(p.seconds_spent ?? 0), 0) / 60
              )
            )
          : myAttempts.length * 4;

      const lastPresenceMs = myPresence.reduce((max, p) => {
        const t = new Date(p.last_seen_at).getTime();
        return t > max ? t : max;
      }, 0);
      const lastAttemptMs = myAttempts.reduce((max, a) => {
        const t = new Date(a.created_at).getTime();
        return t > max ? t : max;
      }, 0);
      const lastActivityMs = Math.max(lastPresenceMs, lastAttemptMs);

      const avgScore =
        myAttempts.length > 0
          ? Math.round(
              myAttempts.reduce((acc, a) => acc + Number(a.score_0_100 ?? 0), 0) / myAttempts.length
            )
          : 0;

      // Current lesson: latest daily_presence.last_lesson_id OR latest attempt's competency -> lesson
      let currentLesson: {
        id: string;
        title: string;
        unit_title: string;
        cefr_level: string;
      } | null = null;
      const latestPresenceWithLesson = myPresence.find((p) => p.last_lesson_id);
      if (latestPresenceWithLesson?.last_lesson_id) {
        currentLesson = lessonMap.get(latestPresenceWithLesson.last_lesson_id) ?? null;
      }
      if (!currentLesson && myAttempts.length > 0) {
        const mappedLessonId = compToLessonMap.get(myAttempts[0].competency_id);
        if (mappedLessonId) {
          currentLesson = lessonMap.get(mappedLessonId) ?? null;
        }
      }

      // Difficulty analysis by competency
      const compStats = new Map<
        string,
        { attempts: number; errors: number; scoreSum: number; masteryScore: number | null }
      >();
      for (const a of myAttempts) {
        const prev = compStats.get(a.competency_id) ?? {
          attempts: 0,
          errors: 0,
          scoreSum: 0,
          masteryScore: null,
        };
        prev.attempts += 1;
        if (a.is_correct === false || Number(a.score_0_100 ?? 0) < 70) {
          prev.errors += 1;
        }
        prev.scoreSum += Number(a.score_0_100 ?? 0);
        compStats.set(a.competency_id, prev);
      }
      for (const m of myMastery) {
        const prev = compStats.get(m.competency_id) ?? {
          attempts: m.evidence_count ?? 0,
          errors: 0,
          scoreSum: Number(m.mastery_score ?? 0) * Math.max(1, m.evidence_count ?? 1),
          masteryScore: Number(m.mastery_score ?? 0),
        };
        prev.masteryScore = Number(m.mastery_score ?? 0);
        compStats.set(m.competency_id, prev);
      }

      const difficulties = Array.from(compStats.entries())
        .map(([compId, st]) => {
          const comp = compMap.get(compId);
          const avg = st.attempts > 0 ? Math.round(st.scoreSum / st.attempts) : 0;
          const lId = compToLessonMap.get(compId);
          const lInfo = lId ? lessonMap.get(lId) : null;
          return {
            competency_id: compId,
            title: comp?.title ?? 'Competência',
            skill_domain: comp?.skill_domain ?? 'general',
            cefr_level: comp?.cefr_level ?? 'A1',
            lesson_title: lInfo?.title ?? null,
            avg_score: avg,
            mastery_score: st.masteryScore !== null ? Math.round(st.masteryScore) : avg,
            attempts: st.attempts,
            errors: st.errors,
          };
        })
        .filter((d) => d.avg_score < 80 || d.errors > 0 || d.mastery_score < 70)
        .sort((a, b) => a.avg_score - b.avg_score || b.errors - a.errors)
        .slice(0, 5);

      const errorRate =
        myAttempts.length > 0
          ? myAttempts.filter((a) => a.is_correct === false || Number(a.score_0_100 ?? 0) < 70)
              .length / myAttempts.length
          : 0;
      const difficultyLevel: 'baixa' | 'moderada' | 'alta' =
        myAttempts.length === 0
          ? 'baixa'
          : errorRate >= 0.45 || avgScore < 60
          ? 'alta'
          : errorRate >= 0.2 || avgScore < 80
          ? 'moderada'
          : 'baixa';

      // Frequency & Dedication (last 30 days)
      const createdMs = new Date(prof.created_at).getTime();
      const daysSinceJoin = Math.max(
        1,
        Math.min(30, Math.ceil((now - createdMs) / (24 * 60 * 60 * 1000)))
      );
      const cutoff30d = new Date(now - 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const activeLast30d = dailyCalendar.filter((d) => d.date >= cutoff30d).length;
      const frequencyPct = Math.min(100, Math.round((activeLast30d / daysSinceJoin) * 100));
      const streakDays = computeStreak(dailyCalendar.map((d) => d.date));

      let dedicationLabel: 'Alta dedicação' | 'Regular' | 'Irregular' | 'Iniciando' = 'Iniciando';
      if (activeDaysCount >= 5 && (frequencyPct >= 60 || streakDays >= 3)) {
        dedicationLabel = 'Alta dedicação';
      } else if (activeDaysCount >= 2 && frequencyPct >= 30) {
        dedicationLabel = 'Regular';
      } else if (activeDaysCount >= 1) {
        dedicationLabel = 'Irregular';
      }

      const masteredCount = myMastery.filter((m) => m.status === 'mastered').length;
      const pendingReviews = myReviews.filter((r) => r.status === 'pending').length;
      const overdueReviews = myReviews.filter(
        (r) => r.status === 'pending' && new Date(r.due_at).getTime() < now
      ).length;

      let engagementStatus: 'em_dia' | 'atencao' | 'inativo' = 'inativo';
      if (lastActivityMs > 0) {
        const daysSince = (now - lastActivityMs) / (24 * 60 * 60 * 1000);
        if (daysSince <= 3 && overdueReviews <= 2) {
          engagementStatus = 'em_dia';
        } else if (daysSince <= 7) {
          engagementStatus = 'atencao';
        } else {
          engagementStatus = 'inativo';
        }
      }

      const openSupportTickets = myThreads.filter((t) => t.status !== 'resolved').length;
      const unreadSupportMessages = myThreads.reduce(
        (acc, t) => acc + Number(t.unread_by_admin ?? 0),
        0
      );

      const pref = prefsMap.get(prof.id);
      const goal = goalsMap.get(prof.id);
      const enroll = enrollMap.get(prof.id);

      return {
        id: prof.id,
        full_name: prof.full_name || 'Aluno sem nome',
        email: emailMap.get(prof.id) ?? '',
        role: prof.role,
        native_language: prof.native_language ?? 'pt-BR',
        onboarding_completed: prof.onboarding_completed,
        created_at: prof.created_at,
        course_id: enroll?.course_id ?? null,
        target_language: enroll?.target_language ?? 'en',
        course_title: enroll?.course_title ?? 'Inglês CEFR',
        target_cefr_level: goal?.target_cefr_level ?? 'A1',
        focus_area: goal?.focus_area ?? 'business_entrepreneur',
        daily_minutes_goal: pref?.daily_minutes_goal ?? 20,
        total_attempts: myAttempts.length,
        active_days: activeDaysCount,
        estimated_minutes: totalMinutes,
        avg_score: avgScore,
        mastered_count: masteredCount,
        pending_reviews: pendingReviews,
        overdue_reviews: overdueReviews,
        last_activity_at: lastActivityMs > 0 ? new Date(lastActivityMs).toISOString() : null,
        engagement_status: engagementStatus,
        current_lesson: currentLesson,
        difficulty_level: difficultyLevel,
        difficulties,
        daily_calendar: dailyCalendar,
        streak_days: streakDays,
        frequency_pct: frequencyPct,
        dedication_label: dedicationLabel,
        open_support_tickets: openSupportTickets,
        unread_support_messages: unreadSupportMessages,
      };
    });

    const activeLast7d = students.filter(
      (s) => s.last_activity_at && now - new Date(s.last_activity_at).getTime() <= sevenDaysMs
    ).length;

    const attentionCount = students.filter((s) => s.engagement_status !== 'em_dia').length;
    const avgAllScores =
      students.length > 0
        ? Math.round(students.reduce((acc, s) => acc + s.avg_score, 0) / students.length)
        : 0;
    const unreadSupportTotal = students.reduce(
      (acc, s) => acc + s.unread_support_messages,
      0
    );

    return new Response(
      JSON.stringify({
        summary: {
          total_students: students.length,
          active_last_7d: activeLast7d,
          attention_needed: attentionCount,
          avg_score: avgAllScores,
          unread_support_total: unreadSupportTotal,
        },
        students,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro interno' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
