/**
 * AI Contract Generation Service
 * Generates professional contracts from RFQ + Quote using AI
 * Supports: Purchase Orders, Service Agreements, Supply Contracts
 */

import { supabase } from '@/api/supabaseClient';
import { emitTradeEvent, TRADE_EVENT_TYPE } from './tradeEvents';
import { checkCompliance } from './afcftaRulesEngine';

/**
 * Generate contract from RFQ and Quote using AI
 */
export async function generateContractFromQuote(tradeId, quoteId) {
  try {
    // Fetch trade, quote, and company details
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError) throw tradeError;

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError) throw quoteError;

    // Get buyer and supplier company details
    const { data: buyerCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('id', trade.buyer_id)
      .single();

    const { data: supplierCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('id', quote.supplier_id)
      .single();

    // Get AfCFTA Compliance & Legal Clauses
    const compliance = checkCompliance({
      origin: supplierCompany?.country,
      destination: buyerCompany?.country,
      hsCode: trade.metadata?.hs_code,
      valueAdded: trade.metadata?.value_added || 40 // Default for demo if not set
    });

    // Call AI contract generation service
    const { data, error } = await supabase.functions.invoke('generate-contract-ai', {
      body: {
        trade: {
          id: trade.id,
          title: trade.title,
          description: trade.description,
          quantity: trade.quantity,
          quantity_unit: trade.quantity_unit,
          created_at: trade.created_at,
          compliance: compliance.summary,
          legal_clauses: compliance.legalClauses
        },
        quote: {
          unit_price: quote.price_per_unit,
          total_price: quote.total_price,
          currency: quote.currency,
          lead_time_days: quote.lead_time_days,
          incoterms: quote.incoterms,
          delivery_location: quote.delivery_location,
          payment_terms: quote.payment_terms
        },
        buyer: {
          name: buyerCompany?.name,
          country: buyerCompany?.country,
          tax_id: buyerCompany?.tax_id
        },
        supplier: {
          name: supplierCompany?.name,
          country: supplierCompany?.country,
          tax_id: supplierCompany?.tax_id
        }
      }
    });

    if (error) throw error;

    // Store generated contract in database
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        trade_id: tradeId,
        quote_id: quoteId,
        title: data?.title || `${trade.title} Supply Contract`,
        content_html: data.html || null,
        content_json: data.contract || {},
        version: 1,
        status: 'generated',
        total_amount: quote.total_price,
        currency: quote.currency,
        created_at: new Date()
      })
      .select()
      .single();

    if (contractError) throw contractError;

    // Emit event
    await emitTradeEvent({
      tradeId,
      eventType: TRADE_EVENT_TYPE.CONTRACT_GENERATED,
      metadata: {
        contract_id: contract.id,
        generated_by: 'ai',
        model: data.model
      }
    });

    return { success: true, contract };
  } catch (err) {
    console.error('[contractService] Generate contract failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get contract for a trade
 */
export async function getTradeContract(tradeId) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('trade_id', tradeId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, contract: data };
  } catch (err) {
    console.error('[contractService] Get contract failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get contract HTML for display/printing
 */
export async function getContractHTML(contractId) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('content_html, content_json')
      .eq('id', contractId)
      .single();

    if (error) throw error;

    // If HTML exists, return it; otherwise generate from JSON
    if (data.content_html) {
      return { success: true, html: data.content_html };
    }

    // Generate HTML from JSON if needed
    const html = generateHTMLFromJSON(data.content_json);
    return { success: true, html };
  } catch (err) {
    console.error('[contractService] Get contract HTML failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sign contract (buyer acceptance)
 */
export async function signContract(contractId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: contract, error: getError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (getError) throw getError;

    // Update contract status
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        buyer_signed_by: user.id,
        buyer_signed_at: new Date(),
        version: contract.version + 1,
        updated_at: new Date()
      })
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Emit event
    await emitTradeEvent({
      tradeId: contract.trade_id,
      eventType: TRADE_EVENT_TYPE.CONTRACT_SIGNED,
      metadata: {
        contract_id: contractId,
        signed_by: user.id,
        signed_at: new Date()
      }
    });

    return { success: true, contract: updatedContract };
  } catch (err) {
    console.error('[contractService] Sign contract failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Reject contract and request changes
 */
export async function rejectContract(contractId, reason) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: updatedContract, error } = await supabase
      .from('contracts')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: user.id,
        rejected_at: new Date()
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) throw error;

    // Emit event
    await emitTradeEvent({
      tradeId: updatedContract.trade_id,
      eventType: TRADE_EVENT_TYPE.CONTRACT_REJECTED,
      metadata: {
        contract_id: contractId,
        reason,
        rejected_by: user.id
      }
    });

    return { success: true, contract: updatedContract };
  } catch (err) {
    console.error('[contractService] Reject contract failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get contract history for a trade
 */
export async function getContractHistory(tradeId) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('trade_id', tradeId)
      .order('version', { ascending: false });

    if (error) throw error;

    return { success: true, contracts: data || [] };
  } catch (err) {
    console.error('[contractService] Get contract history failed:', err);
    return { success: false, error: err.message, contracts: [] };
  }
}

/**
 * Helper: Generate simple HTML from contract JSON
 */
function generateHTMLFromJSON(contractJSON) {
  if (!contractJSON) return '';

  const {
    buyer_name = 'Buyer',
    supplier_name = 'Supplier',
    contract_date = new Date().toLocaleDateString(),
    items = [],
    total_amount = '0.00',
    currency = 'USD',
    payment_terms = 'Net 30',
    delivery_terms = 'FOB'
  } = contractJSON;

  const itemRows = items
    .map(
      (item, i) =>
        `<tr>
          <td style="padding: 8px;">${i + 1}</td>
          <td style="padding: 8px;">${item.description || ''}</td>
          <td style="padding: 8px; text-align: right;">${item.quantity || 0}</td>
          <td style="padding: 8px; text-align: right;">${item.unit_price || '0.00'}</td>
          <td style="padding: 8px; text-align: right;">${item.total || '0.00'}</td>
        </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { text-align: center; color: #d97706; }
        .header { text-align: center; margin-bottom: 30px; }
        .parties { display: flex; justify-content: space-between; margin: 30px 0; }
        .party { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #d97706; }
        td { border-bottom: 1px solid #e5e7eb; }
        .total-row { font-weight: bold; background: #f9fafb; }
        .total-amount { font-size: 18px; color: #d97706; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature { text-align: center; }
      </style>
    </head>
    <body>
      <h1>Purchase Contract</h1>
      
      <div class="header">
        <p>Contract Date: ${contract_date}</p>
      </div>

      <div class="parties">
        <div class="party">
          <h3>BUYER</h3>
          <p>${buyer_name}</p>
        </div>
        <div class="party">
          <h3>SUPPLIER</h3>
          <p>${supplier_name}</p>
        </div>
      </div>

      <h3>Order Details</h3>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td colspan="4" style="text-align: right; padding: 10px;">TOTAL:</td>
            <td style="padding: 10px; text-align: right;" class="total-amount">${currency} ${total_amount}</td>
          </tr>
        </tbody>
      </table>

      <h3>Terms & Conditions</h3>
      <p><strong>Payment Terms:</strong> ${payment_terms}</p>
      <p><strong>Delivery Terms:</strong> ${delivery_terms}</p>
      
      <p style="font-size: 12px; color: #666; margin-top: 40px;">
        This contract is binding upon signature by both parties. All terms and conditions are as agreed above.
      </p>

      <div class="signature-section">
        <div class="signature">
          <p>_________________________</p>
          <p>Buyer Representative</p>
          <p style="font-size: 12px; color: #666;">Date: ___________</p>
        </div>
        <div class="signature">
          <p>_________________________</p>
          <p>Supplier Representative</p>
          <p style="font-size: 12px; color: #666;">Date: ___________</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default {
  generateContractFromQuote,
  getTradeContract,
  getContractHTML,
  signContract,
  rejectContract,
  getContractHistory
};
