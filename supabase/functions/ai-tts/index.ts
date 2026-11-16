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

    const { text } = await req.json();
    if (typeof text !== 'string' || !text.trim() || text.length > 500) {
      return new Response(JSON.stringify({ error: 'Valid text (1-500 chars) is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const start = Date.now();

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text.trim() }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini TTS error (${response.status}): ${errText}`);
    }

    const payload = await response.json();
    const inlineData = payload?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!inlineData?.data) {
      throw new Error('Gemini TTS returned no audio data');
    }

    // Log usage
    const { data: interaction } = await auth.adminClient
      .schema('core_ai')
      .from('ai_interactions')
      .insert({
        student_id: auth.user.id,
        agent_name: 'NeuralTTS',
        status: 'success',
        sanitized_summary: `TTS (${text.trim().slice(0, 40)})`,
      })
      .select('id')
      .single();

    if (interaction) {
      const inTokens = payload?.usageMetadata?.promptTokenCount ?? 0;
      const outTokens = payload?.usageMetadata?.candidatesTokenCount ?? 0;
      const estimatedCostUsd = Number(
        ((inTokens / 1_000_000) * 0.50 + (outTokens / 1_000_000) * 10.0).toFixed(6)
      );

      await auth.adminClient.schema('core_ai').from('model_usage').insert({
        interaction_id: interaction.id,
        provider: 'google_gemini',
        model_name: 'gemini-2.5-flash-preview-tts',
        input_tokens: inTokens,
        output_tokens: outTokens,
        estimated_cost_usd: estimatedCostUsd,
        latency_ms: Date.now() - start,
      });
    }

    return new Response(
      JSON.stringify({
        audioBase64: inlineData.data,
        mimeType: inlineData.mimeType ?? 'audio/L16;codec=pcm;rate=24000',
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
