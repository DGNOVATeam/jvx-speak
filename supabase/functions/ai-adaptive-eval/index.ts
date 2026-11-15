import { corsHeaders, requireAuthenticatedUser } from '../_shared/auth.ts';
import { GeminiProvider, wrapStudentInput } from '../_shared/ai/provider.ts';
import { AdaptiveTutorOutputSchema } from '../_shared/ai/contracts.ts';
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
    const { lessonId, competencyId, promptQuestion, studentAnswer } = body;

    if (!lessonId || !competencyId || !promptQuestion || typeof studentAnswer !== 'string' || !studentAnswer.trim()) {
      return new Response(
        JSON.stringify({ error: 'lessonId, competencyId, promptQuestion and studentAnswer are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [{ data: lesson }, { data: comp }] = await Promise.all([
      adminClient
        .schema('core_curriculum')
        .from('lessons')
        .select('id, title, vocabulary_chunks, unit:units(cefr_level)')
        .eq('id', lessonId)
        .single(),
      adminClient.schema('core_curriculum').from('competencies').select('*').eq('id', competencyId).single(),
    ]);

    if (!lesson || !comp) {
      return new Response(JSON.stringify({ error: 'Lesson or competency not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cefrLevel = (lesson.unit as { cefr_level?: string })?.cefr_level ?? 'A1';
    const targetLang = comp.target_language ?? 'en';
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const provider = new GeminiProvider(geminiKey, 'gemini-flash-lite-latest');

    const langRule =
      targetLang === 'es-ES'
        ? 'Evaluate Peninsular Spanish (Spain / Instituto Cervantes PCIC) expectations.'
        : 'Evaluate English CEFR expectations.';

    const systemPrompt = `You are AdaptiveTutorAgent of JVX SPEAK.
${langRule}
Evaluate the student's written exercise response for level ${cefrLevel} competency "${comp.title}".
Lesson target chunks: ${JSON.stringify(lesson.vocabulary_chunks)}.

Rules:
- Score fairly from 0 to 100 based on CEFR ${cefrLevel} expectations (clarity, correct chunk usage, basic grammar).
- Write clear, encouraging feedback in Portuguese (PT-BR).
- Tag specific error categories if any (e.g. "verb_to_be", "preposition", "word_order", "vocabulary").
- If score_0_100 < 75, include an "adapted_exercise" to reinforce the weak point.
- Return ONLY JSON matching:
{
  "feedback_pt": string,
  "score_0_100": number,
  "detected_error_tags": string[],
  "adapted_exercise": { "question": string, "hint_pt": string, "expected_chunks": string[] } (optional)
}`;

    const userPrompt = `Exercise prompt: ${promptQuestion}\n\nStudent answer:\n${wrapStudentInput(studentAnswer)}`;

    const { data: evalData, usage } = await provider.generateStructured(AdaptiveTutorOutputSchema, {
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      timeoutMs: 20000,
    });

    // 1. Log AI interaction & usage
    const { data: interaction } = await adminClient
      .schema('core_ai')
      .from('ai_interactions')
      .insert({
        student_id: user.id,
        agent_name: 'AdaptiveTutorAgent',
        lesson_id: lessonId,
        status: 'success',
        sanitized_summary: `Exercise eval (${comp.code}): ${evalData.score_0_100}%`,
      })
      .select('id')
      .single();

    if (interaction) {
      await adminClient.schema('core_ai').from('model_usage').insert({
        interaction_id: interaction.id,
        provider: usage.provider,
        model_name: usage.model,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        estimated_cost_usd: usage.estimatedCostUsd,
        latency_ms: usage.latencyMs,
      });
    }

    // 2. Record attempt & learning_evidence
    const { data: attemptRow } = await adminClient
      .schema('core_learning')
      .from('attempts')
      .insert({
        student_id: user.id,
        competency_id: competencyId,
        student_response: { question: promptQuestion, answer: studentAnswer },
        is_correct: evalData.score_0_100 >= 70,
        score_0_100: evalData.score_0_100,
        feedback_data: evalData,
      })
      .select('id')
      .single();

    await adminClient.schema('core_learning').from('learning_evidence').insert({
      student_id: user.id,
      competency_id: competencyId,
      attempt_id: attemptRow?.id ?? null,
      evidence_type: 'exercise',
      score_0_100: evalData.score_0_100,
      weight: 1.0,
      metadata: { error_tags: evalData.detected_error_tags },
    });

    // 3. Recalculate mastery & SRS review
    const [{ data: evidences }, { data: existingReview }] = await Promise.all([
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

    const nextReview = PedagogicalEngine.computeNextReview(
      evalData.score_0_100,
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
        evaluation: evalData,
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
