const SYSTEM_PROMPT = `You are Sign Check Lot Coach, a calm buyer advocate helping someone negotiate at a car dealership.

Rules:
- Use ONLY the deal context provided. Do not invent numbers.
- Keep answers short and usable at the desk: 2-3 bullet points max, then one copy-ready line the buyer can say out loud.
- Never encourage rushing, same-day signing, or skipping written verification.
- If information is missing, say what to ask for next.
- If mode is "compare saved offers", explain differences between the offers and which is better overall. Do not default to generic price-holding scripts unless the numbers support it.
- This is educational guidance, not legal or financial advice.
- Do not mention that you are an AI.`;

/** Visible answer budget. Gemini 2.5 Flash also uses internal thinking tokens. */
const LOT_COACH_MAX_OUTPUT_TOKENS = 2048;
const LOT_COACH_THINKING_BUDGET = 512;

function extractGeminiAnswer(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  const answer = parts
    .filter((part) => typeof part?.text === 'string' && part.text.trim() && part.thought !== true)
    .map((part) => part.text.trim())
    .join('\n')
    .trim();

  return {
    answer,
    finishReason: candidate?.finishReason ?? null,
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

function buildUserPrompt(question, contextSummary) {
  return [
    'Deal context:',
    contextSummary,
    '',
    'Buyer question:',
    question,
    '',
    'Respond with:',
    '1) Quick read of the situation',
    '2) What to ask or verify next',
    '3) One calm script line to say out loud',
  ].join('\n');
}

async function callGemini(apiKey, question, contextSummary) {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildUserPrompt(question, contextSummary) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: LOT_COACH_MAX_OUTPUT_TOKENS,
          thinkingConfig: {
            thinkingBudget: LOT_COACH_THINKING_BUDGET,
          },
        },
      }),
    }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message ?? `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  const { answer, finishReason } = extractGeminiAnswer(payload);
  if (!answer) {
    throw new Error('Gemini returned an empty response.');
  }

  if (finishReason === 'MAX_TOKENS') {
    return `${answer}\n\n(Note: response reached the token limit. Ask a shorter follow-up if you need more detail.)`;
  }

  return answer;
}

export async function handleLotCoachRequest(request, env) {
  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (request.method === 'GET') {
    return jsonResponse({
      ok: true,
      service: 'Sign Check Lot Coach',
      status: 'live',
      hint: 'This endpoint is working. The app sends POST with a question and deal context. Opening this URL in a browser is a health check only.',
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY is not configured on the worker.' }, 500);
  }

  const expectedSecret = env.LOT_COACH_API_SECRET?.trim();
  if (expectedSecret) {
    const authHeader = request.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token !== expectedSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const contextSummary =
    typeof body.contextSummary === 'string'
      ? body.contextSummary.trim()
      : typeof body.context === 'object' && body.context
        ? JSON.stringify(body.context)
        : '';

  if (!question) {
    return jsonResponse({ error: 'Missing question.' }, 400);
  }

  if (!contextSummary) {
    return jsonResponse({ error: 'Missing deal context.' }, 400);
  }

  if (question.length > 500) {
    return jsonResponse({ error: 'Question is too long.' }, 400);
  }

  try {
    const answer = await callGemini(apiKey, question, contextSummary);
    return jsonResponse({ answer });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Lot Coach failed.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    return handleLotCoachRequest(request, env);
  },
};
