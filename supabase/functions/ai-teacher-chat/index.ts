import { corsHeaders, requireAuthenticatedUser } from '../_shared/auth.ts';
import { GeminiProvider, wrapStudentInput } from '../_shared/ai/provider.ts';
import { TeacherAgentOutputSchema } from '../_shared/ai/contracts.ts';

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
    const { lessonId, studentMessage, history = [], scenarioVariant = 'business networking' } = body;

    if (!lessonId || typeof studentMessage !== 'string' || studentMessage.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'lessonId and studentMessage are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar contexto da aula no currículo oficial e foco do aluno
    const [{ data: lesson, error: lessonErr }, { data: goal }] = await Promise.all([
      adminClient
        .schema('core_curriculum')
        .from('lessons')
        .select('id, title, vocabulary_chunks, unit:units(cefr_level, objectives, course:courses(target_language, pedagogical_framework))')
        .eq('id', lessonId)
        .single(),
      adminClient
        .schema('core_identity')
        .from('learning_goals')
        .select('focus_area')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    if (lessonErr || !lesson) {
      return new Response(JSON.stringify({ error: 'Lesson not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const provider = new GeminiProvider(geminiKey, 'gemini-flash-lite-latest');

    const unitObj = lesson.unit as {
      cefr_level?: string;
      objectives?: string[];
      course?: { target_language?: string; pedagogical_framework?: string };
    } | null;
    const cefrLevel = unitObj?.cefr_level ?? 'A1';
    const objectives = unitObj?.objectives ?? [];
    const targetLang = unitObj?.course?.target_language ?? 'en';
    const framework = unitObj?.course?.pedagogical_framework ?? 'CEFR';
    const focusArea = goal?.focus_area ?? 'business_entrepreneur';

    const languageInstruction =
      targetLang === 'es-ES'
        ? 'You teach Peninsular Spanish (Spain) following the Instituto Cervantes (PCIC/CEFR) pedagogical mapping. Use natural Spain Spanish vocabulary (e.g. vale, quedar, ordenador, móvil, vosotros when plural).'
        : 'You teach English following the CEFR framework.';

    const systemPrompt = `You are TeacherAgent of JVX SPEAK, a structured language academy for adult learners.
${languageInstruction}
Framework: ${framework} | Current level: ${cefrLevel} | Student focus: ${focusArea}.
Lesson: "${lesson.title}".
Scenario context for this session: "${scenarioVariant}".
Objectives: ${JSON.stringify(objectives)}.
Target lexical chunks: ${JSON.stringify(lesson.vocabulary_chunks)}.

Rules:
- Keep target language vocabulary and complexity adapted strictly to ${cefrLevel} and the student's focus (${focusArea}).
- Vary your questions and context according to the scenario "${scenarioVariant}" so repeating a lesson feels fresh.
- Guide the student to build their OWN sentences using the target chunks + new vocabulary, instead of just repeating fixed phrases.
- Provide gentle, accurate inline corrections in Portuguese (PT-BR) when the student makes grammar or lexical mistakes.
- Provide up to 3 short suggested next replies in the target language (${targetLang}) if the student needs help.
- Provide 4 to 6 helpful "word_bank" items (words or short expressions in ${targetLang} + PT-BR meaning) relevant to ${focusArea}.
- Estimate "lesson_progress_pct" from 0 to 100 based on how many turns/chunks the student has practiced (~20-25% per good turn; reach >= 80% after 4 good turns).
- Return ONLY JSON matching:
{
  "reply_en": string (your reply in ${targetLang}),
  "explanation_pt": string (optional, brief PT-BR tip if needed),
  "inline_corrections": [{ "original": string, "corrected": string, "reason_pt": string }],
  "suggested_next_prompts": string[],
  "word_bank": [{ "en": string, "pt": string }],
  "lesson_progress_pct": number (0 to 100)
}`;

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .map((h: { role: string; text: string }) => `${h.role}: ${String(h.text).slice(0, 400)}`)
          .join('\n')
      : '';

    const userPrompt = `Conversation history:\n${recentHistory || '(start of lesson)'}\n\nStudent message:\n${wrapStudentInput(studentMessage)}`;

    let status: 'success' | 'error' | 'timeout' = 'success';
    let resultData;
    let usageMetrics;

    try {
      const result = await provider.generateStructured(TeacherAgentOutputSchema, {
        systemPrompt,
        userPrompt,
        temperature: 0.4,
        timeoutMs: 25000,
      });
      resultData = result.data;
      usageMetrics = result.usage;
    } catch (aiErr) {
      status = (aiErr as Error).name === 'AbortError' ? 'timeout' : 'error';
      await adminClient.schema('core_ai').from('ai_interactions').insert({
        student_id: user.id,
        agent_name: 'TeacherAgent',
        lesson_id: lessonId,
        status,
        sanitized_summary: `Failed: ${(aiErr as Error).message.slice(0, 120)}`,
      });
      throw aiErr;
    }

    // Registrar interação e consumo de tokens/custo
    const { data: interaction } = await adminClient
      .schema('core_ai')
      .from('ai_interactions')
      .insert({
        student_id: user.id,
        agent_name: 'TeacherAgent',
        lesson_id: lessonId,
        status: 'success',
        sanitized_summary: `Lesson ${lesson.title} turn`,
      })
      .select('id')
      .single();

    if (interaction && usageMetrics) {
      await adminClient.schema('core_ai').from('model_usage').insert({
        interaction_id: interaction.id,
        provider: usageMetrics.provider,
        model_name: usageMetrics.model,
        input_tokens: usageMetrics.inputTokens,
        output_tokens: usageMetrics.outputTokens,
        estimated_cost_usd: usageMetrics.estimatedCostUsd,
        latency_ms: usageMetrics.latencyMs,
      });
    }

    return new Response(JSON.stringify({ teacher: resultData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
