/**
 * Supabase Edge Function: AI Contract Generation
 * Uses Claude AI to generate professional contracts from RFQ + Quote
 * 
 * Deploy: supabase functions deploy generate-contract-ai
 */

const CLAUDE_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function generateContractWithClaude(prompt) {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

async function main(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const {
      trade,
      quote,
      buyer,
      supplier
    } = await req.json();

    if (!trade || !quote || !buyer || !supplier) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Create prompt for Claude to generate contract
    const contractPrompt = `Generate a professional purchase contract in JSON format for the following trade:

BUYER INFORMATION:
- Company Name: ${buyer.name}
- Country: ${buyer.country}
- Tax ID: ${buyer.tax_id || 'Not provided'}

SUPPLIER INFORMATION:
- Company Name: ${supplier.name}
- Country: ${supplier.country}
- Tax ID: ${supplier.tax_id || 'Not provided'}

TRADE DETAILS:
- Product: ${trade.title}
- Description: ${trade.description}
- Quantity: ${trade.quantity} ${trade.quantity_unit}

QUOTE DETAILS:
- Unit Price: ${quote.currency} ${quote.unit_price}
- Total Price: ${quote.currency} ${quote.total_price}
- Lead Time: ${quote.lead_time_days} days
- Incoterms: ${quote.incoterms}
- Delivery Location: ${quote.delivery_location}
- Payment Terms: ${quote.payment_terms}

Generate the contract in the following JSON format:
{
  "contract_type": "purchase_agreement",
  "buyer_name": "${buyer.name}",
  "buyer_country": "${buyer.country}",
  "buyer_tax_id": "${buyer.tax_id || ''}",
  "supplier_name": "${supplier.name}",
  "supplier_country": "${supplier.country}",
  "supplier_tax_id": "${supplier.tax_id || ''}",
  "contract_date": "YYYY-MM-DD",
  "items": [
    {
      "description": "product description",
      "quantity": ${trade.quantity},
      "unit_price": "${quote.unit_price}",
      "total": "${quote.total_price}"
    }
  ],
  "total_amount": "${quote.total_price}",
  "currency": "${quote.currency}",
  "payment_terms": "${quote.payment_terms}",
  "incoterms": "${quote.incoterms}",
  "delivery_location": "${quote.delivery_location}",
  "lead_time_days": ${quote.lead_time_days},
  "terms_and_conditions": [
    "list of important terms",
    "payment conditions",
    "delivery conditions",
    "dispute resolution clause",
    "force majeure clause"
  ],
  "special_conditions": "any special conditions or notes"
}

Only respond with valid JSON, no other text.`;

    // Get contract from Claude
    const contractJSON = await generateContractWithClaude(contractPrompt);

    // Parse and validate JSON
    let parsedContract;
    try {
      parsedContract = JSON.parse(contractJSON);
    } catch (e) {
      console.error('Failed to parse Claude response as JSON:', contractJSON);
      // Try to extract JSON from response if wrapped in other text
      const jsonMatch = contractJSON.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContract = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse contract JSON from AI response');
      }
    }

    return new Response(
      JSON.stringify({
        contract: parsedContract,
        model: 'claude-3-sonnet-20240229',
        generated_at: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Contract generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(main);
