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
        .select('student_id, course:courses(title, target_language)')
        .eq('status', 'active'),
      auth.adminClient
        .schema('core_learning')
        .from('student_mastery')
        .select('student_id, mastery_score, status'),
      auth.adminClient
        .schema('core_learning')
        .from('attempts')
        .select('student_id, score_0_100, created_at'),
      auth.adminClient
        .schema('core_learning')
        .from('review_schedule')
        .select('student_id, due_at, status'),
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

    const enrollMap = new Map<string, { course_title: string; target_language: string }>();
    for (const e of enrollmentsRes.data ?? []) {
      const c = e.course as { title?: string; target_language?: string } | null;
      if (c) {
        enrollMap.set(e.student_id, {
          course_title: c.title ?? 'Curso',
          target_language: c.target_language ?? 'en',
        });
      }
    }

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const students = (profilesRes.data ?? []).map((prof) => {
      const myAttempts = (attemptsRes.data ?? []).filter((a) => a.student_id === prof.id);
      const myMastery = (masteryRes.data ?? []).filter((m) => m.student_id === prof.id);
      const myReviews = (reviewsRes.data ?? []).filter((r) => r.student_id === prof.id);

      const activeDaysSet = new Set(
        myAttempts.map((a) => new Date(a.created_at).toISOString().slice(0, 10))
      );

      const lastActivityMs = myAttempts.reduce((max, a) => {
        const t = new Date(a.created_at).getTime();
        return t > max ? t : max;
      }, 0);

      const avgScore =
        myAttempts.length > 0
          ? Math.round(
              myAttempts.reduce((acc, a) => acc + Number(a.score_0_100 ?? 0), 0) / myAttempts.length
            )
          : 0;

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
        target_language: enroll?.target_language ?? 'en',
        course_title: enroll?.course_title ?? 'Inglês CEFR',
        target_cefr_level: goal?.target_cefr_level ?? 'A1',
        focus_area: goal?.focus_area ?? 'business_entrepreneur',
        daily_minutes_goal: pref?.daily_minutes_goal ?? 20,
        total_attempts: myAttempts.length,
        active_days: activeDaysSet.size,
        estimated_minutes: myAttempts.length * 4,
        avg_score: avgScore,
        mastered_count: masteredCount,
        pending_reviews: pendingReviews,
        overdue_reviews: overdueReviews,
        last_activity_at: lastActivityMs > 0 ? new Date(lastActivityMs).toISOString() : null,
        engagement_status: engagementStatus,
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

    return new Response(
      JSON.stringify({
        summary: {
          total_students: students.length,
          active_last_7d: activeLast7d,
          attention_needed: attentionCount,
          avg_score: avgAllScores,
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
