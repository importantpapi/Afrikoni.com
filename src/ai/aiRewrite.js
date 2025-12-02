import { callChat } from './aiClient';

const DEFAULT_TONE = `
You are a senior B2B copywriter for Afrikoni, an African B2B trade marketplace.
You write clear, premium, honest copy for business users.
`.trim();

export async function rewriteDescription(text, { tone = DEFAULT_TONE } = {}) {
  if (!text || typeof text !== 'string') {
    return { success: false, text: '' };
  }

  const { success, content } = await callChat({
    system: `${tone}\nRewrite the text for a product detail page. Keep it concise (3–5 short sentences).`,
    user: text.slice(0, 4000),
    maxTokens: 256
  });

  return { success, text: content || text };
}

export async function rewriteRFQDescription(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return { success: false, text: '' };
  }

  const { success, content } = await callChat({
    system: `${DEFAULT_TONE}\nRewrite this RFQ description so it is clear for suppliers. Focus on requirements, quantities, quality, and timelines.`,
    user: text.slice(0, 4000),
    maxTokens: 256
  });

  return { success, text: content || text };
}

export async function rewriteShortTitle(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return { success: false, text: '' };
  }

  const { success, content } = await callChat({
    system: `${DEFAULT_TONE}\nTurn this into a short, punchy B2B title (max 80 characters).`,
    user: text.slice(0, 4000),
    maxTokens: 64
  });

  return { success, text: content || text };
}


