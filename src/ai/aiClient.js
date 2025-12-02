import { toast } from 'sonner';

const OPENAI_BASE_URL =
  import.meta.env.VITE_OPENAI_API_BASE_URL || 'https://api.openai.com/v1';

/**
 * Core AI client for Afrikoni.
 *
 * All AI calls should go through this helper so we have:
 * - centralized error handling
 * - consistent prompts
 * - easy swapping of providers if needed
 */

async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AI request failed (${res.status}): ${text || res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('AI client error:', error);
    }
    return { error };
  }
}

export async function callChat({
  system,
  user,
  messages = [],
  model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  temperature = 0.4,
  maxTokens = 768
}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('VITE_OPENAI_API_KEY is not set. AI features are disabled.');
    }
    return { success: false, content: null, raw: null, error: new Error('Missing API key') };
  }

  const finalMessages = [];

  if (system) {
    finalMessages.push({ role: 'system', content: system });
  }
  if (user) {
    finalMessages.push({ role: 'user', content: user });
  }
  if (Array.isArray(messages) && messages.length > 0) {
    finalMessages.push(...messages);
  }

  const body = {
    model,
    messages: finalMessages,
    temperature,
    max_tokens: maxTokens
  };

  const json = await safeFetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (json?.error) {
    if (!import.meta.env.DEV) {
      toast.error('AI is temporarily unavailable. Please try again later.');
    }
    return { success: false, content: null, raw: json, error: json.error };
  }

  const content =
    json?.choices?.[0]?.message?.content && typeof json.choices[0].message.content === 'string'
      ? json.choices[0].message.content.trim()
      : null;

  if (!content) {
    return {
      success: false,
      content: null,
      raw: json,
      error: new Error('Empty AI response')
    };
  }

  return { success: true, content, raw: json, error: null };
}

/**
 * Helper to ask the model to return JSON and parse it safely.
 */
export async function callChatAsJson(options, { fallback = {}, schemaDescription } = {}) {
  const system = `${options.system || ''}\n\nYou MUST respond with a single valid JSON object only. ${
    schemaDescription || ''
  }`.trim();

  const result = await callChat({ ...options, system });

  if (!result.success || !result.content) {
    return { success: false, data: fallback, raw: result.raw, error: result.error };
  }

  try {
    const json = JSON.parse(result.content);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      return { success: true, data: json, raw: result.raw, error: null };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse AI JSON response:', error, result.content);
    }
  }

  return { success: false, data: fallback, raw: result.raw, error: new Error('Invalid JSON') };
}


