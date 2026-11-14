import { corsHeaders, requireAuthenticatedUser } from '../_shared/auth.ts';
import { PedagogicalEngine, type CompetencyNode, type EvidencePoint } from '../_shared/pedagogy/engine.ts';

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
    const body = await req.json();
    const {
      competencyId,
      activityId = null,
      sessionId = null,
      studentResponse,
      isCorrect = null,
      score0To100,
      evidenceType = 'exercise',
      feedbackData = {},
    } = body;

    if (!competencyId || typeof score0To100 !== 'number' || score0To100 < 0 || score0To100 > 100) {
      return new Response(JSON.stringify({ error: 'Invalid attempt payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Registrar tentativa
    const { data: attemptRow, error: attemptErr } = await adminClient
      .schema('core_learning')
      .from('attempts')
      .insert({
        student_id: user.id,
        activity_id: activityId,
        competency_id: competencyId,
        session_id: sessionId,
        student_response: studentResponse ?? {},
        is_correct: isCorrect,
        score_0_100: score0To100,
        feedback_data: feedbackData,
      })
      .select()
      .single();

    if (attemptErr) throw attemptErr;

    // 2. Registrar evidência histórica
    const { error: evErr } = await adminClient
      .schema('core_learning')
      .from('learning_evidence')
      .insert({
        student_id: user.id,
        competency_id: competencyId,
        attempt_id: attemptRow.id,
        evidence_type: evidenceType,
        score_0_100: score0To100,
        weight: evidenceType === 'assessment' ? 1.5 : 1.0,
      });

    if (evErr) throw evErr;

    // 3. Recalcular domínio com todo o histórico de evidências
    const [{ data: comp }, { data: evidences }, { data: existingReview }] = await Promise.all([
      adminClient.schema('core_curriculum').from('competencies').select('*').eq('id', competencyId).single(),
      adminClient
        .schema('core_learning')
        .from('learning_evidence')
        .select('score_0_100, weight, created_at')
        .eq('student_id', user.id)
        .eq('competency_id', competencyId),
      adminClient
        .schema('core_learning')
        .from('review_schedule')
        .select('*')
        .eq('student_id', user.id)
        .eq('competency_id', competencyId)
        .maybeSingle(),
    ]);

    const compNode: CompetencyNode = {
      id: comp.id,
      code: comp.code,
      cefrLevel: comp.cefr_level,
      skillCategory: comp.skill_category,
      title: comp.title,
      masteryThreshold: Number(comp.mastery_threshold),
      minEvidencesRequired: comp.min_evidences_required,
      prerequisiteIds: [],
    };

    const points: EvidencePoint[] = (evidences ?? []).map((e) => ({
      score0To100: Number(e.score_0_100),
      weight: Number(e.weight),
      createdAt: e.created_at,
    }));

    const masteryUpdate = PedagogicalEngine.computeMasteryUpdate(compNode, points);

    await adminClient.schema('core_learning').from('mastery_records').upsert(
      {
        student_id: user.id,
        competency_id: competencyId,
        mastery_score: masteryUpdate.masteryScore,
        confidence: masteryUpdate.confidence,
        evidence_count: masteryUpdate.evidenceCount,
        status: masteryUpdate.status,
        last_practiced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,competency_id' }
    );

    // 4. Atualizar agenda de revisão espaçada (SRS)
    const nextReview = PedagogicalEngine.computeNextReview(
      score0To100,
      existingReview?.interval_days ?? 1,
      existingReview ? Number(existingReview.ease_factor) : 2.5,
      existingReview?.repetitions ?? 0
    );

    await adminClient.schema('core_learning').from('review_schedule').upsert(
      {
        student_id: user.id,
        competency_id: competencyId,
        due_at: nextReview.dueAt,
        interval_days: nextReview.intervalDays,
        ease_factor: nextReview.easeFactor,
        repetitions: nextReview.repetitions,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,competency_id' }
    );

    return new Response(
      JSON.stringify({
        attemptId: attemptRow.id,
        mastery: masteryUpdate,
        nextReview,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
