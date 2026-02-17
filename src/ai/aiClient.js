import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

/**
 * Core AI client for Afrikoni.
 *
 * ✅ SECURITY FIX (ZONE 1): OpenAI API calls now go through Edge Function
 * - API key secured on server-side (not exposed in frontend bundle)
 * - JWT authentication (only logged-in users can call)
 * - Rate limiting (20 requests/minute per user)
 * - Content filtering (blocks prompt injection attacks)
 * - Cost tracking (logs usage for billing)
 *
 * All AI calls should go through this helper so we have:
 * - centralized error handling
 * - consistent prompts
 * - easy swapping of providers if needed
 */

// Edge Function URL for OpenAI proxy
const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
const OPENAI_PROXY_URL = `${EDGE_FUNCTION_BASE}/openai-proxy`;

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
  // ✅ SECURITY: Get user session token for Edge Function authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    if (import.meta.env.DEV) {
      console.warn('[AI Client] No active session. User must be logged in to use AI features.');
    }
    return { success: false, content: null, raw: null, error: new Error('Authentication required') };
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

  // ✅ SECURITY: Call Edge Function instead of OpenAI directly
  const json = await safeFetch(OPENAI_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}` // JWT token for auth
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

  // Extract temperature from options if provided, otherwise use default
  const temperature = options.temperature !== undefined ? options.temperature : 0.4;
  const result = await callChat({ ...options, system, temperature });

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


