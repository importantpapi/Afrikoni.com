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

/**
 * Generate optimized product listing from draft/product info
 * Used by KoniAI Product Assistant
 */
export async function generateProductListing(productDraft) {
  if (!productDraft || (!productDraft.title && !productDraft.description)) {
    return { 
      success: false, 
      data: { 
        title: '', 
        description: '', 
        tags: [], 
        suggestedCategory: '' 
      } 
    };
  }

  const system = `
You are KoniAI, the intelligence behind African trade on Afrikoni B2B marketplace.
Generate an optimized product listing that will help sellers attract serious B2B buyers.

IMPORTANT: Each product description MUST be unique. Never use the same description twice.
Use the product's specific details, origin, and characteristics to create a distinct description.

Given product information, return a JSON object:
{
  "title": string - optimized, SEO-friendly product title (max 80 chars),
  "description": string - professional B2B product description (2-4 paragraphs, MUST be unique),
  "tags": string[] - array of 5-8 relevant keywords/tags for search,
  "suggestedCategory": string - best matching B2B category name
}

Guidelines:
- Title should be clear, professional, include key attributes (quality, origin, quantity)
- Description MUST be unique - focus on specific product characteristics, origin details, quality attributes, and use cases
- Never reuse the same description - vary sentence structure, emphasis, and details
- Description should highlight: quality, specifications, use cases, certifications, MOQ, pricing flexibility
- Tags should include product type, materials, applications, certifications
- Category should match common B2B categories (Agricultural Products, Textiles, Food & Beverages, Raw Materials, Handicrafts, etc.)
- Language: ${productDraft.language || 'English'}
- Tone: ${productDraft.tone || 'Professional'}
- Be creative and specific - no generic templates
`.trim();

  // Add unique context to ensure different descriptions
  const uniqueContext = productDraft.uniqueSeed ? `\nUnique Request ID: ${productDraft.uniqueSeed}` : '';
  const timestampContext = productDraft.timestamp ? `\nGenerated at: ${productDraft.timestamp}` : '';
  const contextInfo = productDraft.context ? `\nAdditional Context: ${JSON.stringify(productDraft.context)}` : '';

  const user = `
Product Information:
${JSON.stringify(
    {
      title: productDraft.title || '',
      description: productDraft.description || '',
      category: productDraft.category || '',
      country: productDraft.country || '',
      city: productDraft.city || '',
      existingTags: productDraft.tags || []
    },
    null,
    2
  )}
${uniqueContext}${timestampContext}${contextInfo}

IMPORTANT: Generate a completely unique description. Do not use generic templates or repeat previous descriptions.
`.trim();

  const fallback = {
    title: productDraft.title || 'Product',
    description: productDraft.description || 'High-quality product from Africa.',
    tags: [],
    suggestedCategory: productDraft.category || 'General Products'
  };

  const { success, data } = await callChatAsJson(
    { system, user, maxTokens: 800 },
    {
      fallback,
      schemaDescription: 'Ensure title is under 80 characters, description is 2-4 paragraphs, tags array has 5-8 items.'
    }
  );

  const result = { ...fallback, ...(data || {}) };
  
  // Ensure tags is an array
  if (!Array.isArray(result.tags)) {
    result.tags = [];
  }
  
  // Ensure title and description are strings
  result.title = String(result.title || fallback.title).trim();
  result.description = String(result.description || fallback.description).trim();
  result.suggestedCategory = String(result.suggestedCategory || fallback.suggestedCategory).trim();

  return { success, data: result };
}

/**
 * Suggest suppliers based on query and filters
 * Used by KoniAI Supplier Finder
 */
export async function suggestSuppliers(query, filters = {}) {
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return { success: false, suggestions: [] };
  }

  // First, query Supabase for relevant products/suppliers
  // This is a simplified version - in production, you'd want more sophisticated matching
  try {
    const { supabase } = await import('@/api/supabaseClient');
    
    let productsQuery = supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        company_id,
        category_id,
        country_of_origin,
        companies:company_id (
          id,
          company_name,
          country,
          verified,
          trust_score,
          certifications
        )
      `)
      .eq('status', 'active')
      .limit(20);

    // Apply filters
    if (filters.category) {
      productsQuery = productsQuery.eq('category_id', filters.category);
    }
    if (filters.country) {
      productsQuery = productsQuery.eq('country_of_origin', filters.country);
    }
    if (filters.minQty) {
      productsQuery = productsQuery.gte('min_order_quantity', filters.minQty);
    }

    const { data: products, error } = await productsQuery;

    if (error) {
      console.error('Error fetching products:', error);
    }

    const candidates = (products || []).map(p => ({
      productId: p.id,
      productTitle: p.title,
      supplierId: p.companies?.id,
      supplierName: p.companies?.company_name,
      country: p.companies?.country || p.country_of_origin,
      verified: p.companies?.verified,
      trustScore: p.companies?.trust_score || 50,
      certifications: p.companies?.certifications || []
    }));

    // If we have candidates, use AI to rank and explain
    if (candidates.length > 0) {
      const system = `
You are KoniAI, helping buyers find the best suppliers on Afrikoni B2B marketplace.
Given a buyer's query and a list of candidate suppliers, rank them and explain why each is a good match.

Return a JSON array of supplier suggestions:
[
  {
    "supplierId": string,
    "supplierName": string,
    "companyName": string,
    "confidence": "High" | "Medium" | "Low",
    "reason": string - brief explanation (1-2 sentences),
    "productExample": string - example product title from this supplier
  }
]

Rank by: relevance to query, trust score, verification status, certifications.
`.trim();

      const user = `
Buyer Query: "${query}"

Filters:
${JSON.stringify(filters || {}, null, 2)}

Candidate Suppliers:
${JSON.stringify(candidates, null, 2)}
`.trim();

      const { success, data } = await callChatAsJson(
        { system, user, maxTokens: 1000 },
        {
          fallback: { suggestions: [] },
          schemaDescription: 'Return an array of supplier objects, sorted by relevance.'
        }
      );

      if (success && Array.isArray(data?.suggestions)) {
        return { success: true, suggestions: data.suggestions };
      }

      // Fallback: return candidates with basic ranking
      return {
        success: true,
        suggestions: candidates.slice(0, 10).map((c, idx) => ({
          supplierId: c.supplierId,
          supplierName: c.supplierName,
          companyName: c.supplierName,
          confidence: idx < 3 ? 'High' : idx < 6 ? 'Medium' : 'Low',
          reason: `Matches your search for "${query}"`,
          productExample: c.productTitle
        }))
      };
    }

    // No candidates found - return empty
    return { success: true, suggestions: [] };
  } catch (error) {
    console.error('Error in suggestSuppliers:', error);
    return { success: false, suggestions: [], error: error.message };
  }
}

/**
 * Auto-detect product category, country, and city from product title and description
 * Uses AI to intelligently categorize products and determine location for transport facilitation
 */
export async function autoDetectProductLocation(productInfo) {
  if (!productInfo || (!productInfo.title && !productInfo.description)) {
    return {
      success: false,
      category: null,
      country: null,
      city: null
    };
  }

  const system = `
You are KoniAI, helping sellers on Afrikoni B2B marketplace automatically categorize products and determine their location.

Given product information (title, description, keywords), determine:
1. The most appropriate B2B category
2. The country of origin (must be an African country)
3. The city (if mentioned or can be inferred)

Respond with a JSON object:
{
  "category": "string - category name (e.g., 'Agriculture', 'Food & Beverages', 'Textiles & Apparel', 'Beauty & Personal Care', 'Consumer Electronics', 'Industrial Machinery')",
  "country": "string - African country name (e.g., 'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Senegal', 'Tanzania', 'Ethiopia', 'Angola')",
  "city": "string - city name if mentioned or can be inferred (e.g., 'Lagos', 'Accra', 'Nairobi', 'Cairo', 'Casablanca', 'Dakar', 'Dar es Salaam', 'Addis Ababa', 'Luanda')",
  "confidence": "number between 0 and 1"
}

Guidelines:
- Category must match common B2B categories
- Country MUST be an African country
- City should be a major city in that country if mentioned
- If location is unclear, use seller's company location as fallback
- Focus on transport facilitation - accurate location helps buyers find logistics
`.trim();

  const user = `
Product Information:
${JSON.stringify({
  title: productInfo.title || '',
  description: productInfo.description || '',
  keywords: productInfo.keywords || [],
  sellerCountry: productInfo.sellerCountry || '',
  sellerCity: productInfo.sellerCity || ''
}, null, 2)}

Determine the best category, country, and city for this product to facilitate transport and logistics.
`.trim();

  const fallback = {
    category: null,
    country: productInfo.sellerCountry || null,
    city: productInfo.sellerCity || null,
    confidence: 0.3
  };

  const { success, data } = await callChatAsJson(
    { system, user, maxTokens: 400 },
    {
      fallback,
      schemaDescription: 'Category must be a valid B2B category name. Country must be an African country. City is optional but helpful for logistics.'
    }
  );

  return {
    success,
    category: data?.category || fallback.category,
    country: data?.country || fallback.country,
    city: data?.city || fallback.city,
    confidence: data?.confidence || fallback.confidence
  };
}

/**
 * Generate a professional buyer inquiry message for contacting suppliers
 * Used when buyers click "Contact Supplier" from marketplace
 */
export async function generateBuyerInquiry(product, buyerContext = {}) {
  if (!product || !product.id) {
    return { 
      success: false, 
      message: 'Hello, I am interested in learning more about your products.' 
    };
  }

  const system = `
You are KoniAI, helping buyers craft professional B2B inquiry messages on Afrikoni marketplace.
Generate a concise, professional message that:
- Shows genuine interest in the product
- Asks relevant questions (pricing, MOQ, delivery, samples)
- Maintains professional B2B tone
- Is friendly but business-focused
- Mentions the specific product

Keep it 2-3 short paragraphs, professional but approachable.
`.trim();

  const user = `
Product Information:
${JSON.stringify({
  title: product.title || product.name,
  price: product.price || product.price_min,
  currency: product.currency || 'USD',
  moq: product.moq || product.min_order_quantity,
  country: product.country_of_origin,
  category: product.category_name || product.category
}, null, 2)}

Buyer Context (optional):
${JSON.stringify(buyerContext || {}, null, 2)}
`.trim();

  const fallback = `Hello,

I came across your ${product.title || 'product'} on Afrikoni and I'm interested in learning more.

Could you please provide:
- Current pricing and payment terms
- Minimum order quantity (MOQ)
- Delivery timeframes
- Sample availability (if applicable)

I look forward to hearing from you.

Best regards`;

  const { success, content } = await callChat({ 
    system, 
    user, 
    maxTokens: 300,
    temperature: 0.7
  });

  return { 
    success, 
    message: content || fallback 
  };
}



