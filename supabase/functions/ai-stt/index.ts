import { corsHeaders, requireAuthenticatedUser } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req);
    if (auth.error || !auth.user) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { audioBase64, mimeType, lang } = await req.json();
    if (typeof audioBase64 !== 'string' || !audioBase64.trim() || audioBase64.length > 6_000_000) {
      return new Response(JSON.stringify({ error: 'Valid audioBase64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeMime =
      typeof mimeType === 'string' && mimeType.startsWith('audio/')
        ? mimeType.split(';')[0]
        : 'audio/webm';
    const targetLang = lang === 'es-ES' ? 'Spanish (Spain)' : 'English';

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const start = Date.now();
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Transcribe the spoken ${targetLang} audio verbatim. Return ONLY the plain transcribed text without quotes, labels, or explanations. If no speech is audible, return an empty string.`,
                },
                {
                  inlineData: {
                    mimeType: safeMime,
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Gemini STT error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const transcript =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (auth.adminClient) {
      const inTokens = data?.usageMetadata?.promptTokenCount ?? 0;
      const outTokens = data?.usageMetadata?.candidatesTokenCount ?? 0;
      const estimatedCostUsd = Number(
        ((inTokens / 1_000_000) * 0.30 + (outTokens / 1_000_000) * 0.30).toFixed(6)
      );

      const { data: interaction } = await auth.adminClient
        .schema('core_ai')
        .from('ai_interactions')
        .insert({
          student_id: auth.user.id,
          agent_name: 'SpeechToText',
          status: 'success',
          sanitized_summary: `STT (${targetLang})`,
        })
        .select('id')
        .single();

      if (interaction) {
        await auth.adminClient.schema('core_ai').from('model_usage').insert({
          interaction_id: interaction.id,
          provider: 'google_gemini',
          model_name: 'gemini-flash-lite-latest',
          input_tokens: inTokens,
          output_tokens: outTokens,
          estimated_cost_usd: estimatedCostUsd,
          latency_ms: Date.now() - start,
        });
      }
    }

    return new Response(JSON.stringify({ transcript }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
