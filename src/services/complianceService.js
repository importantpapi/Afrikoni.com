/**
 * Compliance Document Validator
 * Validates required trade documents for AfCFTA compliance
 * Handles: Certificate of Origin, Harmonized System codes, etc.
 */

import { supabase } from '@/api/supabaseClient';

// Required documents for different product categories
const REQUIRED_DOCUMENTS = {
  'agricultural': ['certificate_of_origin', 'phytosanitary_certificate', 'health_certificate'],
  'textiles': ['certificate_of_origin', 'test_report', 'packing_list'],
  'chemicals': ['certificate_of_origin', 'safety_data_sheet', 'chemical_analysis'],
  'machinery': ['certificate_of_origin', 'invoice', 'technical_specifications'],
  'electronics': ['certificate_of_origin', 'warranty_card', 'compliance_certificate'],
  'default': ['certificate_of_origin', 'commercial_invoice', 'packing_list']
};

// HS Code groups (Harmonized System)
const HS_CODE_CATEGORIES = {
  'agricultural': /^(01|02|04|05|06|07|08|09|10|11|12|13|14|15)/,
  'textiles': /^(50|51|52|53|54|55|56|57|58)/,
  'machinery': /^(84)/,
  'electronics': /^(85)/,
  'chemicals': /^(28|29|30|31|32|33|34|35|36|37|38)/
};

/**
 * Validate HS Code
 */
export function validateHSCode(hsCode, country = 'NG') {
  const cleanCode = hsCode.replace(/[^0-9]/g, '');
  
  if (cleanCode.length < 4 || cleanCode.length > 10) {
    return { valid: false, error: 'HS Code must be between 4 and 10 digits' };
  }

  // Check for valid HS code format (Harmonized System)
  if (!/^\d{4,10}$/.test(cleanCode)) {
    return { valid: false, error: 'HS Code must contain only digits' };
  }

  return { valid: true, hsCode: cleanCode };
}

/**
 * Get product category from HS Code
 */
export function getCategoryFromHSCode(hsCode) {
  const code = hsCode.replace(/[^0-9]/g, '');
  
  for (const [category, pattern] of Object.entries(HS_CODE_CATEGORIES)) {
    if (pattern.test(code)) {
      return category;
    }
  }
  
  return 'default';
}

/**
 * Get required documents for a product
 */
export function getRequiredDocuments(hsCode) {
  const category = getCategoryFromHSCode(hsCode);
  return REQUIRED_DOCUMENTS[category] || REQUIRED_DOCUMENTS.default;
}

/**
 * Validate Certificate of Origin
 */
export async function validateCertificateOfOrigin({
  country,
  exporterName,
  importerName,
  productDescription,
  hsCode,
  certificateNumber,
  issueDate
}) {
  const errors = [];

  if (!country || !country.match(/^[A-Z]{2}$/)) {
    errors.push('Valid ISO country code required');
  }

  if (!exporterName?.trim()) {
    errors.push('Exporter name required');
  }

  if (!importerName?.trim()) {
    errors.push('Importer name required');
  }

  if (!productDescription?.trim()) {
    errors.push('Product description required');
  }

  const hsValidation = validateHSCode(hsCode, country);
  if (!hsValidation.valid) {
    errors.push(`HS Code invalid: ${hsValidation.error}`);
  }

  if (!certificateNumber?.trim()) {
    errors.push('Certificate number required');
  }

  const issueDateObj = new Date(issueDate);
  if (isNaN(issueDateObj.getTime())) {
    errors.push('Valid issue date required');
  }

  // Check if certificate is not older than 12 months
  const monthsOld = (new Date() - issueDateObj) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld > 12) {
    errors.push('Certificate of Origin is older than 12 months');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * Validate commercial invoice
 */
export async function validateCommercialInvoice({
  invoiceNumber,
  invoiceDate,
  exporter,
  importer,
  descriptionOfGoods,
  quantity,
  unitPrice,
  totalValue,
  incoterms,
  paymentTerms
}) {
  const errors = [];
  const warnings = [];

  if (!invoiceNumber?.trim()) {
    errors.push('Invoice number required');
  }

  if (!invoiceDate || isNaN(new Date(invoiceDate).getTime())) {
    errors.push('Valid invoice date required');
  }

  if (!exporter?.trim()) {
    errors.push('Exporter information required');
  }

  if (!importer?.trim()) {
    errors.push('Importer information required');
  }

  if (!descriptionOfGoods?.trim()) {
    errors.push('Description of goods required');
  }

  if (!quantity || quantity <= 0) {
    errors.push('Valid quantity required');
  }

  if (!unitPrice || unitPrice <= 0) {
    errors.push('Valid unit price required');
  }

  if (!totalValue || totalValue <= 0) {
    errors.push('Valid total value required');
  }

  // Warning if invoice is very old (over 30 days)
  const daysOld = (new Date() - new Date(invoiceDate)) / (1000 * 60 * 60 * 24);
  if (daysOld > 30) {
    warnings.push('Invoice is older than 30 days');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate packing list
 */
export async function validatePackingList({
  packingListNumber,
  quantity,
  weight,
  numberOfParcels,
  marking
}) {
  const errors = [];

  if (!packingListNumber?.trim()) {
    errors.push('Packing list number required');
  }

  if (!quantity || quantity <= 0) {
    errors.push('Valid quantity required');
  }

  if (!weight || weight <= 0) {
    errors.push('Valid weight required');
  }

  if (!numberOfParcels || numberOfParcels <= 0) {
    errors.push('Valid number of parcels required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Store compliance document for a trade
 */
export async function storeComplianceDocument({
  tradeId,
  documentType,
  documentName,
  fileUrl,
  metadata = {}
}) {
  try {
    const { data, error } = await supabase
      .from('compliance_documents')
      .insert({
        trade_id: tradeId,
        document_type: documentType,
        document_name: documentName,
        file_url: fileUrl,
        validation_status: 'pending',
        metadata: metadata,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, document: data };
  } catch (err) {
    console.error('[complianceService] Store document failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Validate all required documents for a trade
 */
export async function validateTradeCompliance(tradeId, hsCode) {
  try {
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError) throw tradeError;

    // Get required documents for this product
    const requiredDocs = getRequiredDocuments(hsCode);

    // Get uploaded documents
    const { data: documents, error: docsError } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('trade_id', tradeId);

    if (docsError) throw docsError;

    // Check which required documents are missing
    const uploadedTypes = documents.map(d => d.document_type);
    const missingDocuments = requiredDocs.filter(doc => !uploadedTypes.includes(doc));

    // Get compliance status
    const compliancePercentage = Math.round(
      ((requiredDocs.length - missingDocuments.length) / requiredDocs.length) * 100
    );

    return {
      compliant: missingDocuments.length === 0,
      compliancePercentage,
      requiredDocuments: requiredDocs,
      uploadedDocuments: uploadedTypes,
      missingDocuments,
      recommendations: getMissingDocumentRecommendations(missingDocuments)
    };
  } catch (err) {
    console.error('[complianceService] Validate trade compliance failed:', err);
    return { error: err.message };
  }
}

/**
 * Create document pack for a trade (corridor-aware baseline)
 */
export async function createDocumentPackForTrade(tradeId, hsCode, corridor = {}) {
  try {
    const basePack = [
      'commercial_invoice',
      'packing_list',
      'certificate_of_origin'
    ];
    const requiredDocs = Array.from(new Set([
      ...basePack,
      ...getRequiredDocuments(hsCode)
    ]));

    const pack = {
      corridor,
      required_documents: requiredDocs,
      created_at: new Date().toISOString()
    };

    const { data: trade } = await supabase
      .from('trades')
      .select('metadata')
      .eq('id', tradeId)
      .single();

    await supabase
      .from('trades')
      .update({
        metadata: { ...(trade?.metadata || {}), document_pack: pack }
      })
      .eq('id', tradeId);

    return { success: true, pack };
  } catch (err) {
    console.error('[complianceService] Create document pack failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get recommendations for missing documents
 */
function getMissingDocumentRecommendations(missingDocs) {
  const recommendations = {
    'certificate_of_origin': 'Apply for Certificate of Origin from your Chamber of Commerce',
    'phytosanitary_certificate': 'Contact your agricultural authority for phytosanitary certificate',
    'health_certificate': 'Obtain health/food safety certificate from relevant authority',
    'safety_data_sheet': 'Request SDS (Safety Data Sheet) from your chemical supplier',
    'test_report': 'Submit product to certified testing lab for compliance testing',
    'commercial_invoice': 'Issue a commercial invoice with all required details',
    'packing_list': 'Prepare detailed packing list with item-by-item description',
    'compliance_certificate': 'Obtain product compliance certificate from manufacturer'
  };

  return missingDocs.map(doc => ({
    document: doc,
    recommendation: recommendations[doc] || `Prepare ${doc.replace(/_/g, ' ')}`
  }));
}

export default {
  validateHSCode,
  getCategoryFromHSCode,
  getRequiredDocuments,
  validateCertificateOfOrigin,
  validateCommercialInvoice,
  validatePackingList,
  storeComplianceDocument,
  validateTradeCompliance,
  createDocumentPackForTrade
};
