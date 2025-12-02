import { callChatAsJson, callChat } from './aiClient';

const FALLBACK_RFQ_DRAFT = {
  title: '',
  quantity: 0,
  target_price: 0,
  specifications: {},
  shipping_terms: [],
  delivery_deadline: '',
  notes: ''
};

export async function generateRFQFromProduct(product, overrides = {}) {
  if (!product || !product.id) {
    return { success: false, data: FALLBACK_RFQ_DRAFT };
  }

  const system = `
You are an RFQ assistant for Afrikoni, a B2B marketplace for African trade.
Given a product, propose a concise RFQ draft suitable for B2B buyers.
Respond strictly as a JSON object with:
{
  "title": string,
  "quantity": number,
  "target_price": number,
  "specifications": { [key: string]: string },
  "shipping_terms": string[],
  "delivery_deadline": string,
  "notes": string
}
`.trim();

  const user = `
Product:
${JSON.stringify(
    {
      id: product.id,
      title: product.title || product.name,
      description: product.description,
      category: product.category_name || product.category || product.category_id,
      moq: product.moq || product.min_order_quantity,
      price_min: product.price_min,
      price_max: product.price_max,
      currency: product.currency
    },
    null,
    2
  )}

Buyer context (optional overrides):
${JSON.stringify(overrides || {}, null, 2)}
`.trim();

  const { success, data } = await callChatAsJson(
    { system, user },
    { fallback: FALLBACK_RFQ_DRAFT, schemaDescription: 'Use sensible numeric defaults if unknown.' }
  );

  const draft = { ...FALLBACK_RFQ_DRAFT, ...(data || {}) };

  draft.quantity = Number.isFinite(draft.quantity) ? draft.quantity : 0;
  draft.target_price = Number.isFinite(draft.target_price)
    ? draft.target_price
    : parseFloat(product?.price_min || product?.price || 0) || 0;
  draft.specifications = draft.specifications && typeof draft.specifications === 'object'
    ? draft.specifications
    : {};
  draft.shipping_terms = Array.isArray(draft.shipping_terms) ? draft.shipping_terms : [];

  return { success, data: draft };
}

export async function summarizeSupplierProfile(supplier) {
  if (!supplier || !supplier.id) {
    return { success: false, summary: '' };
  }

  const system = `
You summarize B2B supplier profiles for Afrikoni.
Return a concise, 2–3 sentence summary suitable for a sidebar.
`.trim();

  const user = `
Supplier:
${JSON.stringify(
    {
      id: supplier.id,
      name: supplier.company_name,
      country: supplier.country,
      trust_score: supplier.trust_score,
      certifications: supplier.certifications,
      description: supplier.description
    },
    null,
    2
  )}
`.trim();

  const { success, content } = await callChat({ system, user, maxTokens: 192 });
  return { success, summary: content || '' };
}

export async function generateSupplierReply(rfq, supplier, options = {}) {
  if (!rfq || !rfq.id || !supplier || !supplier.id) {
    return { success: false, data: null };
  }

  const system = `
You draft professional B2B quote responses for Afrikoni RFQs.
Return a JSON object:
{
  "message": string,
  "suggested_price": number,
  "suggested_quantity": number,
  "delivery_estimate": string,
  "logistics": string
}
`.trim();

  const user = `
RFQ:
${JSON.stringify(
    {
      id: rfq.id,
      title: rfq.title,
      description: rfq.description,
      quantity: rfq.quantity,
      target_price: rfq.target_price,
      unit: rfq.unit,
      delivery_location: rfq.delivery_location,
      competition_level: rfq.competition_level,
      avg_quote_price: rfq.avg_quote_price
    },
    null,
    2
  )}

Supplier:
${JSON.stringify(
    {
      id: supplier.id,
      name: supplier.company_name,
      country: supplier.country,
      certifications: supplier.certifications,
      trust_score: supplier.trust_score
    },
    null,
    2
  )}

Additional context:
${JSON.stringify(options || {}, null, 2)}
`.trim();

  const fallback = {
    message: '',
    suggested_price: rfq?.target_price || 0,
    suggested_quantity: rfq?.quantity || 0,
    delivery_estimate: '',
    logistics: ''
  };

  const { success, data } = await callChatAsJson(
    { system, user },
    {
      fallback,
      schemaDescription: 'Use RFQ target_price and quantity if unsure.'
    }
  );

  const reply = { ...fallback, ...(data || {}) };
  reply.suggested_price = Number.isFinite(reply.suggested_price)
    ? reply.suggested_price
    : parseFloat(rfq?.target_price || 0) || 0;
  reply.suggested_quantity = Number.isFinite(reply.suggested_quantity)
    ? reply.suggested_quantity
    : rfq?.quantity || 0;

  return { success, data: reply };
}

export async function suggestSimilarProducts(product, context = {}) {
  if (!product || !Array.isArray(context.candidates)) {
    return { success: false, suggestions: [] };
  }

  const system = `
You help rank similar products for buyers on Afrikoni.
Given a target product and a list of candidate products, return a JSON object:
{ "product_ids": string[] }
sorted from most to least relevant.
`.trim();

  const user = `
Target product:
${JSON.stringify(
    {
      id: product.id,
      title: product.title,
      category_id: product.category_id,
      country_of_origin: product.country_of_origin
    },
    null,
    2
  )}

Candidate products:
${JSON.stringify(
    context.candidates.map(p => ({
      id: p.id,
      title: p.title,
      category_id: p.category_id,
      country_of_origin: p.country_of_origin
    })),
    null,
    2
  )}
`.trim();

  const { success, data } = await callChatAsJson(
    { system, user, maxTokens: 384 },
    { fallback: { product_ids: [] }, schemaDescription: 'IDs must match the input candidate IDs.' }
  );

  const ids = Array.isArray(data?.product_ids) ? data.product_ids.filter(Boolean) : [];
  return { success, suggestions: ids };
}

export async function suggestRFQsForSeller(company, rfqs = []) {
  if (!company || !Array.isArray(rfqs)) {
    return { success: false, rfqIds: [] };
  }

  const system = `
You help sellers pick the best RFQs to respond to on Afrikoni.
Return a JSON object: { "rfq_ids": string[] } sorted from most to least promising.
`.trim();

  const user = `
Company:
${JSON.stringify(
    {
      id: company.id,
      name: company.company_name,
      country: company.country,
      categories: company.categories
    },
    null,
    2
  )}

Candidate RFQs:
${JSON.stringify(
    rfqs.map(r => ({
      id: r.id,
      title: r.title,
      category_id: r.category_id,
      quantity: r.quantity,
      target_price: r.target_price,
      competition_level: r.competition_level,
      timeRemaining: r.timeRemaining
    })),
    null,
    2
  )}
`.trim();

  const { success, data } = await callChatAsJson(
    { system, user, maxTokens: 384 },
    { fallback: { rfq_ids: [] } }
  );

  const ids = Array.isArray(data?.rfq_ids) ? data.rfq_ids.filter(Boolean) : [];
  return { success, rfqIds: ids };
}

export async function suggestProductsForBuyer(company, products = []) {
  if (!company || !Array.isArray(products)) {
    return { success: false, productIds: [] };
  }

  const system = `
You recommend products to buyers on Afrikoni.
Return a JSON object: { "product_ids": string[] } sorted from most to least relevant.
`.trim();

  const user = `
Buyer company:
${JSON.stringify(
    {
      id: company.id,
      name: company.company_name,
      country: company.country,
      categories: company.categories
    },
    null,
    2
  )}

Candidate products:
${JSON.stringify(
    products.map(p => ({
      id: p.id,
      title: p.title,
      category_id: p.category_id,
      country_of_origin: p.country_of_origin
    })),
    null,
    2
  )}
`.trim();

  const { success, data } = await callChatAsJson(
    { system, user, maxTokens: 384 },
    { fallback: { product_ids: [] } }
  );

  const ids = Array.isArray(data?.product_ids) ? data.product_ids.filter(Boolean) : [];
  return { success, productIds: ids };
}

export async function compressLongDescription(text) {
  if (!text || typeof text !== 'string') {
    return { success: false, text: '' };
  }

  const system = `
You are a copy editor for Afrikoni.
Given a long text, return a shorter, clearer version (2–3 sentences).
`.trim();

  const { success, content } = await callChat({
    system,
    user: text.slice(0, 4000),
    maxTokens: 160
  });

  return { success, text: content || text };
}

export async function generateCategoryDescription(category, stats = {}) {
  if (!category) {
    return { success: false, text: '' };
  }

  const system = `
You write short descriptions of B2B categories for Afrikoni.
Max 2 sentences, friendly and business-focused.
`.trim();

  const user = `
Category name: ${category}
Stats: ${JSON.stringify(stats || {}, null, 2)}
`.trim();

  const { success, content } = await callChat({
    system,
    user,
    maxTokens: 120
  });

  return { success, text: content || '' };
}

export async function summarizeRFQ(rfq) {
  if (!rfq || !rfq.id) {
    return { success: false, data: { explanation: '', suggested_price_min: null, suggested_price_max: null } };
  }

  const system = `
You analyze RFQs (Request for Quotation) on Afrikoni, an African B2B marketplace.
Explain briefly why this RFQ might matter to suppliers and suggest a reasonable USD price range.
Respond strictly as JSON:
{
  "explanation": string,
  "suggested_price_min": number | null,
  "suggested_price_max": number | null
}
`.trim();

  const user = `
RFQ:
${JSON.stringify(
    {
      id: rfq.id,
      title: rfq.title,
      description: rfq.description,
      quantity: rfq.quantity,
      target_price: rfq.target_price,
      unit: rfq.unit,
      category_id: rfq.category_id,
      delivery_location: rfq.delivery_location,
      competition_level: rfq.competition_level,
      avg_quote_price: rfq.avg_quote_price
    },
    null,
    2
  )}
`.trim();

  const fallback = {
    explanation: '',
    suggested_price_min: null,
    suggested_price_max: null
  };

  const { success, data } = await callChatAsJson(
    { system, user, maxTokens: 256 },
    {
      fallback,
      schemaDescription: 'Use numeric USD values for suggested_price_min/max when possible, else null.'
    }
  );

  const result = { ...fallback, ...(data || {}) };
  result.suggested_price_min = Number.isFinite(result.suggested_price_min)
    ? result.suggested_price_min
    : null;
  result.suggested_price_max = Number.isFinite(result.suggested_price_max)
    ? result.suggested_price_max
    : null;

  return { success, data: result };
}



