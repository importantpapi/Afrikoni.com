/**
 * OpenAI Proxy Edge Function
 * 
 * SECURITY: Moves OpenAI API key to server-side to prevent:
 * - API key theft from frontend bundle
 * - Unauthorized API usage and cost explosion
 * - Prompt injection attacks
 * 
 * Features:
 * - JWT authentication (only authenticated users can call)
 * - Rate limiting per user (prevents abuse)
 * - Content filtering (blocks malicious prompts)
 * - Cost tracking (logs usage for billing)
 * 
 * Called by: src/ai/aiClient.js
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_BASE_URL = Deno.env.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory rate limiter (resets on function cold start)
// For production: use Redis or Supabase table
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per user

/**
 * Check if user has exceeded rate limit
 */
function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // First request or window expired
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  userLimit.count++;
  return { allowed: true };
}

/**
 * Content filtering - blocks malicious prompts
 */
function isPromptSafe(messages: any[]): { safe: boolean; reason?: string } {
  const BLOCKED_PATTERNS = [
    /ignore.*previous.*instructions/i,
    /disregard.*system.*prompt/i,
    /pretend.*you.*are/i,
    /act.*as.*different/i,
    /bypass.*security/i,
    /reveal.*api.*key/i,
    /show.*your.*system.*prompt/i,
  ];

  for (const message of messages) {
    const content = message.content || '';
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
        return { 
          safe: false, 
          reason: 'Potential prompt injection detected' 
        };
      }
    }
  }

  return { safe: true };
}

/**
 * Log AI usage for cost tracking
 */
async function logUsage(supabase: any, userId: string, usage: any) {
  try {
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      model: usage.model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      cost_usd: calculateCost(usage),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[OpenAI Proxy] Failed to log usage:', error);
    // Non-blocking - continue even if logging fails
  }
}

/**
 * Calculate cost based on token usage
 * GPT-4o-mini: $0.15/1M input, $0.60/1M output
 */
function calculateCost(usage: any): number {
  const model = usage.model || 'gpt-4o-mini';
  
  // Pricing per 1M tokens (as of Feb 2026)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
  };

  const rates = pricing[model] || pricing['gpt-4o-mini'];
  const inputCost = (usage.prompt_tokens / 1_000_000) * rates.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * rates.output;
  
  return inputCost + outputCost;
}

async function main(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ✅ SECURITY: JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ SECURITY: Check OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ SECURITY: Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          retry_after: rateLimit.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter)
          } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { messages, model, temperature, max_tokens } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ SECURITY: Content filtering
    const safetyCheck = isPromptSafe(messages);
    if (!safetyCheck.safe) {
      console.warn(`[OpenAI Proxy] Blocked prompt from user ${user.id}: ${safetyCheck.reason}`);
      return new Response(
        JSON.stringify({ 
          error: 'Content policy violation', 
          reason: safetyCheck.reason 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI API
    const openaiResponse = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        temperature: temperature !== undefined ? temperature : 0.4,
        max_tokens: max_tokens || 768
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[OpenAI Proxy] OpenAI API error: ${openaiResponse.status} ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error', 
          status: openaiResponse.status,
          details: errorText 
        }),
        { 
          status: openaiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openaiData = await openaiResponse.json();

    // ✅ COST TRACKING: Log usage (non-blocking)
    if (openaiData.usage) {
      logUsage(supabase, user.id, {
        model: openaiData.model,
        prompt_tokens: openaiData.usage.prompt_tokens,
        completion_tokens: openaiData.usage.completion_tokens,
        total_tokens: openaiData.usage.total_tokens
      });
    }

    // Return OpenAI response
    return new Response(
      JSON.stringify(openaiData),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('[OpenAI Proxy] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

serve(main);
