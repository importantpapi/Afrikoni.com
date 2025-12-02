/**
 * Afrikoni Shield™ - KYC/AML Tracker Demo Data
 * Mock data for the KYC/AML Tracker dashboard
 */

// Summary Overview KPIs
export const kycSummary = {
  overallVerificationStatus: 'verified', // not_started, pending, verified, failed
  identityCheckResult: 'verified',
  businessCheckResult: 'verified',
  amlScreeningResult: 'pass',
  pepStatus: 'clear',
  finalRiskScore: 23 // 0-100, lower is better
};

// Identity Verification Data
export const identityVerification = {
  personalInfo: {
    fullName: 'John Kofi Mensah',
    dateOfBirth: '1985-03-15',
    address: '123 Independence Avenue, Accra, Ghana',
    nationality: 'Ghanaian',
    phone: '+233 24 123 4567',
    email: 'john.mensah@example.com'
  },
  idDocument: {
    type: 'National ID',
    documentNumber: 'GHA-123456789',
    issueDate: '2020-01-10',
    expiryDate: '2030-01-10',
    status: 'verified',
    uploadedDate: '2024-01-15T10:30:00Z',
    fileUrl: '/documents/national-id.pdf'
  },
  ocrResults: {
    extracted: true,
    confidence: 0.95,
    extractedData: {
      name: 'John Kofi Mensah',
      dateOfBirth: '1985-03-15',
      documentNumber: 'GHA-123456789',
      nationality: 'Ghanaian',
      address: '123 Independence Avenue, Accra, Ghana'
    },
    discrepancies: [],
    verified: true
  },
  status: 'verified',
  verifiedAt: '2024-01-15T11:45:00Z',
  verifiedBy: 'AI System (OCR + Manual Review)'
};

// Business Verification (KYB) Data
export const businessVerification = {
  businessInfo: {
    businessName: 'Afrikoni Trading Ltd',
    registrationNumber: 'C123456789',
    jurisdiction: 'Ghana',
    country: 'GH',
    licenseNumber: 'BL-2024-001234',
    taxNumber: 'TIN-987654321',
    address: '456 Business District, Accra, Ghana',
    registrationDate: '2020-05-20',
    businessType: 'Limited Liability Company',
    industry: 'Trading & Import/Export'
  },
  certificate: {
    type: 'Business Registration Certificate',
    status: 'verified',
    uploadedDate: '2024-01-16T09:15:00Z',
    expiryDate: '2025-05-20',
    fileUrl: '/documents/business-certificate.pdf',
    verifiedAt: '2024-01-16T14:30:00Z',
    verifiedBy: 'Compliance Team'
  },
  status: 'verified',
  riskFlags: []
};

// AML & Sanctions Screening Results
export const amlScreening = {
  overallResult: 'pass', // pass, fail, review
  screeningDate: '2024-01-17T08:00:00Z',
  matches: [
    {
      id: 1,
      matchType: 'Name Similarity',
      source: 'OFAC',
      result: 'No Match',
      confidence: 0.15,
      details: 'Name similarity below threshold (15%)',
      status: 'cleared'
    },
    {
      id: 2,
      matchType: 'Sanctions List',
      source: 'UNSC',
      result: 'No Match',
      confidence: 0.0,
      details: 'No matches found in UN Security Council sanctions list',
      status: 'cleared'
    },
    {
      id: 3,
      matchType: 'Sanctions List',
      source: 'EU',
      result: 'No Match',
      confidence: 0.0,
      details: 'No matches found in EU sanctions list',
      status: 'cleared'
    },
    {
      id: 4,
      matchType: 'Sanctions List',
      source: 'UK',
      result: 'No Match',
      confidence: 0.0,
      details: 'No matches found in UK sanctions list',
      status: 'cleared'
    }
  ],
  ofacScreening: {
    result: 'clear',
    checkedAt: '2024-01-17T08:00:00Z',
    matches: 0
  },
  interpolRedFlags: {
    checked: true,
    matches: 0,
    checkedAt: '2024-01-17T08:05:00Z'
  },
  fatfHighRiskCountry: {
    checked: true,
    isHighRisk: false,
    country: 'Ghana',
    riskLevel: 'low'
  },
  suspiciousActivity: [
    {
      id: 1,
      type: 'Transaction Pattern',
      description: 'Normal transaction patterns observed',
      riskLevel: 'low',
      date: '2024-01-20T10:00:00Z'
    }
  ]
};

// PEP (Politically Exposed Person) Screening
export const pepScreening = {
  result: 'clear', // clear, detected, review
  relation: null, // direct, family, associate
  pepCategory: null, // Level 1-4
  countryOfExposure: null,
  screeningDate: '2024-01-17T08:10:00Z',
  checkedSources: [
    'World-Check',
    'Dow Jones',
    'PEP Database',
    'Public Records'
  ],
  matches: [],
  notes: 'No PEP matches found across all screening sources'
};

// Risk Score Breakdown
export const riskScoreBreakdown = {
  identityRisk: 5, // 0-100
  businessLegitimacyRisk: 8,
  amlRisk: 3,
  pepRisk: 0,
  documentCompleteness: 12,
  behaviorAnomalyScore: 2,
  finalRiskScore: 23,
  riskLevel: 'low', // low, medium, high, critical
  lastUpdated: '2024-01-20T15:30:00Z'
};

// Required Documents & Uploads
export const requiredDocuments = [
  {
    id: 1,
    name: 'National ID / Passport',
    category: 'Identification',
    status: 'uploaded',
    uploadedDate: '2024-01-15T10:30:00Z',
    expiryDate: '2030-01-10',
    fileUrl: '/documents/national-id.pdf',
    fileSize: '2.1 MB',
    notes: 'Verified and active'
  },
  {
    id: 2,
    name: 'Business Registration Certificate',
    category: 'Business License',
    status: 'uploaded',
    uploadedDate: '2024-01-16T09:15:00Z',
    expiryDate: '2025-05-20',
    fileUrl: '/documents/business-certificate.pdf',
    fileSize: '3.4 MB',
    notes: 'Verified with government registry'
  },
  {
    id: 3,
    name: 'Tax Registration Certificate',
    category: 'Tax Certificate',
    status: 'uploaded',
    uploadedDate: '2024-01-18T11:20:00Z',
    expiryDate: null,
    fileUrl: '/documents/tax-certificate.pdf',
    fileSize: '1.8 MB',
    notes: 'Active tax registration'
  },
  {
    id: 4,
    name: 'Proof of Business Address',
    category: 'Address Proof',
    status: 'uploaded',
    uploadedDate: '2024-01-19T14:00:00Z',
    expiryDate: null,
    fileUrl: '/documents/address-proof.pdf',
    fileSize: '1.2 MB',
    notes: 'Utility bill accepted'
  },
  {
    id: 5,
    name: 'Bank Statement (Last 3 Months)',
    category: 'Bank Statement',
    status: 'uploaded',
    uploadedDate: '2024-01-19T15:30:00Z',
    expiryDate: null,
    fileUrl: '/documents/bank-statement.pdf',
    fileSize: '4.5 MB',
    notes: 'Standard banking activity observed'
  },
  {
    id: 6,
    name: 'Company Ownership Document',
    category: 'Ownership Document',
    status: 'uploaded',
    uploadedDate: '2024-01-20T09:00:00Z',
    expiryDate: null,
    fileUrl: '/documents/ownership-doc.pdf',
    fileSize: '2.7 MB',
    notes: '100% ownership verified'
  },
  {
    id: 7,
    name: 'Director ID (John Kofi Mensah)',
    category: 'Director/Shareholder ID',
    status: 'uploaded',
    uploadedDate: '2024-01-15T10:30:00Z',
    expiryDate: '2030-01-10',
    fileUrl: '/documents/director-id.pdf',
    fileSize: '2.1 MB',
    notes: 'Same as identity document'
  }
];

// Verification Timeline
export const verificationTimeline = [
  {
    id: 1,
    step: 'Identity Upload',
    status: 'completed',
    timestamp: '2024-01-15T10:30:00Z',
    completedBy: 'User',
    details: 'National ID document uploaded successfully',
    icon: 'upload'
  },
  {
    id: 2,
    step: 'Identity Verification',
    status: 'completed',
    timestamp: '2024-01-15T11:45:00Z',
    completedBy: 'AI System (OCR + Manual Review)',
    details: 'Identity verified through OCR extraction and manual review. All data matches.',
    icon: 'check'
  },
  {
    id: 3,
    step: 'Business Document Submission',
    status: 'completed',
    timestamp: '2024-01-16T09:15:00Z',
    completedBy: 'User',
    details: 'Business registration certificate uploaded',
    icon: 'upload'
  },
  {
    id: 4,
    step: 'Business Verification',
    status: 'completed',
    timestamp: '2024-01-16T14:30:00Z',
    completedBy: 'Compliance Team',
    details: 'Business verified with government registry. Registration number confirmed.',
    icon: 'check'
  },
  {
    id: 5,
    step: 'AML Check',
    status: 'completed',
    timestamp: '2024-01-17T08:00:00Z',
    completedBy: 'AML System',
    details: 'AML screening completed. No matches found in sanctions lists (OFAC, UNSC, EU, UK).',
    icon: 'shield'
  },
  {
    id: 6,
    step: 'PEP Check',
    status: 'completed',
    timestamp: '2024-01-17T08:10:00Z',
    completedBy: 'PEP Screening System',
    details: 'PEP screening completed. No politically exposed persons detected.',
    icon: 'user-check'
  },
  {
    id: 7,
    step: 'Risk Scoring',
    status: 'completed',
    timestamp: '2024-01-20T15:30:00Z',
    completedBy: 'Risk Assessment Engine',
    details: 'Final risk score calculated: 23/100 (Low Risk). All checks passed.',
    icon: 'bar-chart'
  },
  {
    id: 8,
    step: 'Final Approval',
    status: 'completed',
    timestamp: '2024-01-20T16:00:00Z',
    completedBy: 'Compliance Manager',
    details: 'KYC/AML verification approved. Account fully verified and active.',
    icon: 'check-circle'
  }
];

