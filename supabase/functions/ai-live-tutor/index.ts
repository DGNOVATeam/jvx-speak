import { z } from 'zod';
import { corsHeaders, requireAuthenticatedUser } from '../_shared/auth.ts';
import { GeminiProvider, wrapStudentInput } from '../_shared/ai/provider.ts';

const TutorTurnSchema = z.object({
  reply: z.string(),
  translation_pt: z.string(),
  quick_tip_pt: z.string().optional().default(''),
  follow_up_question: z.string(),
});

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const LIVE_COST_PER_SECOND_USD = 0.0002; // ~$0.012/min

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

    const body = await req.json();
    const action = body.action ?? 'chat_turn';

    // Check A2+ unlock or admin
    const [{ data: prof }, { data: enrollment }, { data: masteredRows }] = await Promise.all([
      auth.adminClient
        .schema('core_identity')
        .from('profiles')
        .select('role, native_language')
        .eq('id', auth.user.id)
        .single(),
      auth.adminClient
        .schema('core_learning')
        .from('enrollments')
        .select('estimated_cefr_level')
        .eq('student_id', auth.user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
      auth.adminClient
        .schema('core_learning')
        .from('mastery_records')
        .select('competency_id')
        .eq('student_id', auth.user.id)
        .eq('status', 'mastered'),
    ]);

    const level = enrollment?.estimated_cefr_level ?? 'A1';
    const masteredCount = masteredRows?.length ?? 0;
    const isUnlocked =
      prof?.role === 'admin' ||
      ['A2', 'B1', 'B2', 'C1', 'C2'].includes(level) ||
      masteredCount >= 2;

    if (!isUnlocked) {
      return new Response(
        JSON.stringify({
          error: 'Recurso Premium exclusivo a partir do nível A2 (domine ao menos 2 lições A1).',
          locked: true,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

    if (action === 'start_live_session') {
      // Try generating a short-lived ephemeral token for Gemini Live WebSocket
      let ephemeralToken: string | null = null;
      let tokenError: string | null = null;

      try {
        const expireTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const tokenRes = await fetch(
          `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uses: 1,
              expireTime,
              bidiGenerateContentSetup: {
                model: `models/${LIVE_MODEL}`,
              },
            }),
          }
        );

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          ephemeralToken = tokenData?.name ?? null;
        } else {
          tokenError = await tokenRes.text();
        }
      } catch (e) {
        tokenError = e instanceof Error ? e.message : 'Token endpoint unavailable';
      }

      const { data: interaction } = await auth.adminClient
        .schema('core_ai')
        .from('ai_interactions')
        .insert({
          student_id: auth.user.id,
          agent_name: 'GeminiLiveAudio',
          status: 'success',
          sanitized_summary: `Live session (${body.topic ?? 'Livre'})`,
        })
        .select('id')
        .single();

      return new Response(
        JSON.stringify({
          interactionId: interaction?.id ?? null,
          model: LIVE_MODEL,
          wsEndpoint:
            'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained',
          ephemeralToken,
          liveReady: Boolean(ephemeralToken),
          fallbackReason: ephemeralToken ? null : tokenError ?? 'Use o modo Voz Guiada (STT+TTS).',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'log_live_usage') {
      const seconds = Math.min(3600, Math.max(1, Number(body.seconds ?? 15)));
      const interactionId = body.interactionId as string | undefined;
      const estimatedCostUsd = Number((seconds * LIVE_COST_PER_SECOND_USD).toFixed(6));

      let targetInteractionId = interactionId;
      if (!targetInteractionId) {
        const { data: inter } = await auth.adminClient
          .schema('core_ai')
          .from('ai_interactions')
          .insert({
            student_id: auth.user.id,
            agent_name: 'GeminiLiveAudio',
            status: 'success',
            sanitized_summary: `Live Audio (${seconds}s)`,
          })
          .select('id')
          .single();
        targetInteractionId = inter?.id;
      }

      if (targetInteractionId) {
        await auth.adminClient.schema('core_ai').from('model_usage').insert({
          interaction_id: targetInteractionId,
          provider: 'google_gemini',
          model_name: LIVE_MODEL,
          input_tokens: seconds * 25,
          output_tokens: seconds * 25,
          estimated_cost_usd: estimatedCostUsd,
          latency_ms: 150,
        });
      }

      return new Response(JSON.stringify({ ok: true, estimatedCostUsd }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: chat_turn (Tutor IA conversacional por tema)
    const topic = String(body.topic ?? 'Business Networking & Strategy').slice(0, 120);
    const targetLanguage = body.targetLanguage === 'es-ES' ? 'Spanish (Spain)' : 'English';
    const nativeLanguage = prof?.native_language ?? 'pt-BR';
    const isStart = Boolean(body.isStart);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const studentMessage = String(body.studentMessage ?? '').trim();

    const provider = new GeminiProvider(geminiKey, 'gemini-flash-lite-latest');

    const systemPrompt = `You are a premium, warm, executive AI Language Tutor at JVX SPEAK.
Target language: ${targetLanguage}. Student's native language: ${nativeLanguage}.
Topic of conversation: "${topic}".
Student CEFR Level: ${level} (A2+ unlocked).
Rules:
1. Speak naturally in ${targetLanguage} (2-3 concise sentences max per turn, ideal for spoken audio playback).
2. Always end with a clear, engaging follow_up_question in ${targetLanguage} to keep the conversation flowing.
3. Provide a natural translation of your reply in ${nativeLanguage} in "translation_pt".
4. If the student made a small grammar/vocabulary mistake, give a brief encouraging tip in ${nativeLanguage} in "quick_tip_pt" (otherwise leave empty "").
5. Return ONLY valid JSON with keys: reply, translation_pt, quick_tip_pt, follow_up_question.`;

    const historyText = history
      .map((h: { role: string; text: string }) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.text}`)
      .join('\n');

    const userPrompt = isStart
      ? `Start a realistic spoken conversation with the student about "${topic}" in ${targetLanguage}. Greet them warmly and ask your first engaging question.`
      : `Conversation so far:\n${historyText}\n\nLatest student message:\n${wrapStudentInput(studentMessage)}`;

    const result = await provider.generateStructured(TutorTurnSchema, {
      systemPrompt,
      userPrompt,
      temperature: 0.65,
      maxOutputTokens: 500,
    });

    const { data: interaction } = await auth.adminClient
      .schema('core_ai')
      .from('ai_interactions')
      .insert({
        student_id: auth.user.id,
        agent_name: 'LiveTutorChat',
        status: 'success',
        sanitized_summary: `Tutor Tema: ${topic.slice(0, 35)}`,
      })
      .select('id')
      .single();

    if (interaction) {
      await auth.adminClient.schema('core_ai').from('model_usage').insert({
        interaction_id: interaction.id,
        provider: result.usage.provider,
        model_name: result.usage.model,
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        estimated_cost_usd: result.usage.estimatedCostUsd,
        latency_ms: result.usage.latencyMs,
      });
    }

    return new Response(
      JSON.stringify({
        turn: result.data,
        usage: result.usage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro no Tutor IA' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
