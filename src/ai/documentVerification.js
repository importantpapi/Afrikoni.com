import { callChatAsJson, callChat } from './aiClient';

/**
 * AI-powered document verification for supplier verification checklist
 * Analyzes uploaded documents to ensure they match requirements and previous submissions
 */

/**
 * Verify a document against expected requirements and previous submissions
 * @param {Object} params - Verification parameters
 * @param {string} params.documentUrl - URL of the uploaded document
 * @param {string} params.documentType - Type of document (business_registration, kyc, bank_statement, etc.)
 * @param {Object} params.previousDocument - Previous document data if exists
 * @param {Object} params.companyInfo - Company information for context
 * @returns {Promise<Object>} Verification result
 */
export async function verifyDocument({
  documentUrl,
  documentType,
  previousDocument = null,
  companyInfo = {}
}) {
  if (!documentUrl) {
    return {
      success: false,
      verified: false,
      error: 'Document URL is required',
      confidence: 0
    };
  }

  const system = `
You are an AI document verification assistant for Afrikoni B2B marketplace.
Your role is to verify uploaded documents for supplier verification.

Analyze the document and verify:
1. Document authenticity and validity
2. Whether it matches the expected document type
3. If it matches previously submitted documents (if provided)
4. Key information extraction (company name, registration number, dates, etc.)
5. Document quality and readability

Respond with a JSON object:
{
  "verified": boolean - whether document is valid and matches requirements,
  "confidence": number (0-1) - confidence level in verification,
  "matches_previous": boolean - whether this matches previous submission (if provided),
  "document_type_match": boolean - whether document matches expected type,
  "extracted_info": {
    "company_name": string or null,
    "registration_number": string or null,
    "issue_date": string or null,
    "expiry_date": string or null,
    "country": string or null,
    "other_key_fields": object
  },
  "issues": string[] - array of issues found (empty if none),
  "recommendations": string[] - recommendations for improvement,
  "summary": string - brief summary of verification result
}

Guidelines:
- Be strict but fair in verification
- Flag obvious mismatches or inconsistencies
- Extract key information accurately
- Provide helpful recommendations
- Confidence should reflect certainty level
`.trim();

  const user = `
Document Information:
- Document URL: ${documentUrl}
- Document Type: ${documentType}
- Company Name: ${companyInfo.company_name || 'Not provided'}
- Company Country: ${companyInfo.country || 'Not provided'}

${previousDocument ? `
Previous Document (for comparison):
- Previous URL: ${previousDocument.url || 'N/A'}
- Previous Type: ${previousDocument.type || 'N/A'}
- Previous Upload Date: ${previousDocument.uploaded_at || 'N/A'}
- Previous Status: ${previousDocument.status || 'N/A'}

Please verify if the new document matches the previous submission.
` : `
No previous document found. Verify this is a valid ${documentType} document.
`}

Analyze the document and provide verification results.
`.trim();

  try {
    const { success, data } = await callChatAsJson(
      { system, user, maxTokens: 1000, temperature: 0.3 },
      {
        fallback: {
          verified: false,
          confidence: 0.5,
          matches_previous: false,
          document_type_match: true,
          extracted_info: {},
          issues: ['Unable to analyze document - manual review required'],
          recommendations: ['Please ensure document is clear and readable'],
          summary: 'Document uploaded but requires manual verification'
        },
        schemaDescription: 'Return verification results with extracted information'
      }
    );

    if (success && data) {
      return {
        success: true,
        verified: data.verified || false,
        confidence: data.confidence || 0.5,
        matchesPrevious: data.matches_previous || false,
        documentTypeMatch: data.document_type_match !== false,
        extractedInfo: data.extracted_info || {},
        issues: data.issues || [],
        recommendations: data.recommendations || [],
        summary: data.summary || 'Document verification completed',
        raw: data
      };
    }

    return {
      success: false,
      verified: false,
      confidence: 0.5,
      matchesPrevious: false,
      documentTypeMatch: true,
      extractedInfo: {},
      issues: ['AI verification unavailable - manual review required'],
      recommendations: [],
      summary: 'Document uploaded but requires manual verification',
      error: 'AI verification failed'
    };
  } catch (error) {
    console.error('Document verification error:', error);
    return {
      success: false,
      verified: false,
      confidence: 0.5,
      matchesPrevious: false,
      documentTypeMatch: true,
      extractedInfo: {},
      issues: ['Verification service error'],
      recommendations: ['Document will be reviewed manually'],
      summary: 'Document uploaded - pending manual review',
      error: error.message
    };
  }
}

/**
 * Compare two documents to check if they match
 * @param {Object} params - Comparison parameters
 * @param {string} params.document1Url - First document URL
 * @param {string} params.document2Url - Second document URL
 * @param {string} params.documentType - Type of documents being compared
 * @returns {Promise<Object>} Comparison result
 */
export async function compareDocuments({
  document1Url,
  document2Url,
  documentType
}) {
  if (!document1Url || !document2Url) {
    return {
      success: false,
      matches: false,
      confidence: 0,
      differences: [],
      summary: 'Both document URLs are required for comparison'
    };
  }

  const system = `
You are an AI document comparison assistant for Afrikoni.
Compare two documents of type "${documentType}" to determine if they match.

Analyze:
1. Whether documents are the same or different versions
2. Key information consistency (company name, registration numbers, dates)
3. Visual similarity (if images)
4. Content similarity (if text-based)

Respond with JSON:
{
  "matches": boolean - whether documents match,
  "confidence": number (0-1) - confidence in match result,
  "differences": string[] - list of differences found,
  "similarities": string[] - list of similarities found,
  "is_same_document": boolean - whether it's the same document,
  "is_updated_version": boolean - whether it's an updated version,
  "summary": string - brief comparison summary
}
`.trim();

  const user = `
Compare these two ${documentType} documents:
- Document 1: ${document1Url}
- Document 2: ${document2Url}

Determine if they match and provide detailed comparison.
`.trim();

  try {
    const { success, data } = await callChatAsJson(
      { system, user, maxTokens: 800, temperature: 0.3 },
      {
        fallback: {
          matches: false,
          confidence: 0.5,
          differences: ['Unable to compare - manual review required'],
          similarities: [],
          is_same_document: false,
          is_updated_version: false,
          summary: 'Documents require manual comparison'
        }
      }
    );

    if (success && data) {
      return {
        success: true,
        matches: data.matches || false,
        confidence: data.confidence || 0.5,
        differences: data.differences || [],
        similarities: data.similarities || [],
        isSameDocument: data.is_same_document || false,
        isUpdatedVersion: data.is_updated_version || false,
        summary: data.summary || 'Comparison completed',
        raw: data
      };
    }

    return {
      success: false,
      matches: false,
      confidence: 0.5,
      differences: ['Comparison service unavailable'],
      similarities: [],
      isSameDocument: false,
      isUpdatedVersion: false,
      summary: 'Documents require manual comparison'
    };
  } catch (error) {
    console.error('Document comparison error:', error);
    return {
      success: false,
      matches: false,
      confidence: 0.5,
      differences: ['Comparison failed'],
      similarities: [],
      isSameDocument: false,
      isUpdatedVersion: false,
      summary: 'Manual comparison required',
      error: error.message
    };
  }
}

/**
 * Extract key information from a document
 * @param {Object} params - Extraction parameters
 * @param {string} params.documentUrl - Document URL
 * @param {string} params.documentType - Type of document
 * @returns {Promise<Object>} Extracted information
 */
export async function extractDocumentInfo({
  documentUrl,
  documentType
}) {
  const system = `
You are an AI document information extraction assistant for Afrikoni.
Extract key information from ${documentType} documents.

Extract relevant fields based on document type:
- Business Registration: company name, registration number, registration date, country, business type
- KYC/ID: full name, ID number, issue date, expiry date, country, document type
- Bank Statement: bank name, account number, account holder, statement period, currency
- Tax Certificate: tax ID number, company name, issue date, country, tax authority

Respond with JSON:
{
  "extracted_fields": {
    "field_name": "value or null"
  },
  "confidence": number (0-1),
  "readable": boolean - whether document is readable,
  "complete": boolean - whether all expected fields were found,
  "summary": string
}
`.trim();

  const user = `
Extract information from this ${documentType} document:
${documentUrl}

Provide all extractable information.
`.trim();

  try {
    const { success, data } = await callChatAsJson(
      { system, user, maxTokens: 600, temperature: 0.2 },
      {
        fallback: {
          extracted_fields: {},
          confidence: 0.5,
          readable: true,
          complete: false,
          summary: 'Information extraction completed with limited data'
        }
      }
    );

    if (success && data) {
      return {
        success: true,
        extractedFields: data.extracted_fields || {},
        confidence: data.confidence || 0.5,
        readable: data.readable !== false,
        complete: data.complete || false,
        summary: data.summary || 'Extraction completed',
        raw: data
      };
    }

    return {
      success: false,
      extractedFields: {},
      confidence: 0.5,
      readable: true,
      complete: false,
      summary: 'Extraction unavailable',
      error: 'AI extraction failed'
    };
  } catch (error) {
    console.error('Document extraction error:', error);
    return {
      success: false,
      extractedFields: {},
      confidence: 0.5,
      readable: true,
      complete: false,
      summary: 'Manual extraction required',
      error: error.message
    };
  }
}

