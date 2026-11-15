import { corsHeaders, requireAuthenticatedUser } from '../_shared/auth.ts';
import { PedagogicalEngine, type CompetencyNode, type MasteryState, type DueReviewItem } from '../_shared/pedagogy/engine.ts';

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

    const { adminClient, user } = auth;

    const { data: profile } = await adminClient
      .schema('core_identity')
      .from('profiles')
      .select('active_course_id')
      .eq('id', user.id)
      .maybeSingle();

    let activeLang = 'en';
    if (profile?.active_course_id) {
      const { data: course } = await adminClient
        .schema('core_curriculum')
        .from('courses')
        .select('target_language')
        .eq('id', profile.active_course_id)
        .maybeSingle();
      if (course?.target_language) activeLang = course.target_language;
    }

    const [{ data: competencies }, { data: prereqs }, { data: mastery }, { data: reviews }] = await Promise.all([
      adminClient.schema('core_curriculum').from('competencies').select('*').eq('target_language', activeLang),
      adminClient.schema('core_curriculum').from('competency_prerequisites').select('*'),
      adminClient.schema('core_learning').from('mastery_records').select('*').eq('student_id', user.id),
      adminClient.schema('core_learning').from('review_schedule').select('*').eq('student_id', user.id).eq('status', 'pending'),
    ]);

    const prereqMap = new Map<string, string[]>();
    for (const p of prereqs ?? []) {
      const list = prereqMap.get(p.competency_id) ?? [];
      list.push(p.prerequisite_id);
      prereqMap.set(p.competency_id, list);
    }

    const nodes: CompetencyNode[] = (competencies ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      cefrLevel: c.cefr_level,
      skillCategory: c.skill_category,
      title: c.title,
      masteryThreshold: Number(c.mastery_threshold),
      minEvidencesRequired: c.min_evidences_required,
      prerequisiteIds: prereqMap.get(c.id) ?? [],
    }));

    const masteryStates: MasteryState[] = (mastery ?? []).map((m) => ({
      competencyId: m.competency_id,
      masteryScore: Number(m.mastery_score),
      confidence: Number(m.confidence),
      evidenceCount: m.evidence_count,
      status: m.status,
    }));

    const dueReviews: DueReviewItem[] = (reviews ?? []).map((r) => ({
      competencyId: r.competency_id,
      dueAt: r.due_at,
      repetitions: r.repetitions,
    }));

    const decision = PedagogicalEngine.recommendNextActivity({
      studentId: user.id,
      competencies: nodes,
      masteryStates,
      dueReviews,
    });

    return new Response(JSON.stringify({ decision }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
