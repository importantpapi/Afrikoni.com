/**
 * Afrikoni Shield™ - Compliance Center Demo Data
 * Mock data for the Compliance Center dashboard
 */

// Compliance Overview KPIs
export const complianceKPIs = {
  overallComplianceScore: 87, // 0-100
  documentsSubmitted: 24,
  documentsMissing: 3,
  taxFilingsDue: 5,
  verificationLevel: 2, // Tier 0-3
  escrowEligibility: true
};

// Document Compliance List
export const documentCompliance = [
  {
    id: 1,
    name: 'Business Registration Certificate',
    type: 'License',
    status: 'verified',
    lastUploaded: '2024-01-15',
    expiryDate: '2025-01-15',
    fileUrl: '/documents/business-registration.pdf'
  },
  {
    id: 2,
    name: 'Tax Registration Certificate',
    type: 'Tax Registration',
    status: 'verified',
    lastUploaded: '2024-01-20',
    expiryDate: '2025-01-20',
    fileUrl: '/documents/tax-registration.pdf'
  },
  {
    id: 3,
    name: 'Company Director ID',
    type: 'ID',
    status: 'pending',
    lastUploaded: '2024-02-01',
    expiryDate: null,
    fileUrl: '/documents/director-id.pdf'
  },
  {
    id: 4,
    name: 'Proof of Address',
    type: 'Address Proof',
    status: 'verified',
    lastUploaded: '2024-01-10',
    expiryDate: null,
    fileUrl: '/documents/address-proof.pdf'
  },
  {
    id: 5,
    name: 'Export License',
    type: 'Certificate',
    status: 'expired',
    lastUploaded: '2023-06-15',
    expiryDate: '2024-01-15',
    fileUrl: '/documents/export-license.pdf'
  },
  {
    id: 6,
    name: 'Import License',
    type: 'Certificate',
    status: 'verified',
    lastUploaded: '2024-01-25',
    expiryDate: '2025-01-25',
    fileUrl: '/documents/import-license.pdf'
  },
  {
    id: 7,
    name: 'Bank Statement (Last 3 Months)',
    type: 'Financial',
    status: 'rejected',
    lastUploaded: '2024-01-28',
    expiryDate: null,
    fileUrl: '/documents/bank-statement.pdf',
    rejectionReason: 'Document quality too low, please re-upload'
  },
  {
    id: 8,
    name: 'Insurance Certificate',
    type: 'Certificate',
    status: 'missing',
    lastUploaded: null,
    expiryDate: null,
    fileUrl: null
  }
];

// Tax & Filing Center - Hub Data
export const taxFilings = [
  {
    id: 1,
    hub: 'Mauritius',
    country: 'MU',
    filingType: 'VAT Return',
    deadline: '2024-02-15',
    status: 'upcoming',
    daysUntil: 5,
    period: 'Q1 2024',
    documentsRequired: ['VAT-2024-Q1.pdf', 'Sales-Report-Q1.xlsx']
  },
  {
    id: 2,
    hub: 'Rwanda',
    country: 'RW',
    filingType: 'Corporate Tax',
    deadline: '2024-02-10',
    status: 'overdue',
    daysUntil: -2,
    period: 'Annual 2023',
    documentsRequired: ['Tax-Declaration-2023.pdf']
  },
  {
    id: 3,
    hub: 'Kenya',
    country: 'KE',
    filingType: 'Withholding Tax',
    deadline: '2024-02-20',
    status: 'upcoming',
    daysUntil: 10,
    period: 'February 2024',
    documentsRequired: ['WHT-2024-Feb.pdf']
  },
  {
    id: 4,
    hub: 'South Africa',
    country: 'ZA',
    filingType: 'VAT Return',
    deadline: '2024-02-25',
    status: 'upcoming',
    daysUntil: 15,
    period: 'Q1 2024',
    documentsRequired: ['VAT-SA-2024-Q1.pdf']
  },
  {
    id: 5,
    hub: 'Nigeria',
    country: 'NG',
    filingType: 'Company Annual Return',
    deadline: '2024-02-12',
    status: 'upcoming',
    daysUntil: 2,
    period: 'Annual 2024',
    documentsRequired: ['Annual-Return-2024.pdf', 'Financial-Statements-2024.pdf']
  }
];

// Compliance by Hub (for chart)
export const complianceByHub = [
  { hub: 'Mauritius', completed: 8, pending: 1, overdue: 0, percentage: 89 },
  { hub: 'Rwanda', completed: 6, pending: 2, overdue: 1, percentage: 67 },
  { hub: 'Kenya', completed: 9, pending: 1, overdue: 0, percentage: 90 },
  { hub: 'South Africa', completed: 7, pending: 1, overdue: 0, percentage: 88 },
  { hub: 'Nigeria', completed: 5, pending: 2, overdue: 0, percentage: 71 }
];

// Supplier Verification Status
export const verificationSteps = [
  {
    id: 1,
    step: 'Identity Verification',
    status: 'verified',
    completedAt: '2024-01-15T10:30:00Z',
    verifiedBy: 'System (AI)',
    notes: 'Government ID verified through automated system'
  },
  {
    id: 2,
    step: 'Business License Verification',
    status: 'verified',
    completedAt: '2024-01-16T14:20:00Z',
    verifiedBy: 'Compliance Team',
    notes: 'License validated with government registry'
  },
  {
    id: 3,
    step: 'Address Verification',
    status: 'pending',
    completedAt: null,
    verifiedBy: null,
    notes: 'Awaiting address proof document upload',
    issue: 'Document quality insufficient'
  },
  {
    id: 4,
    step: 'Tax Registration',
    status: 'verified',
    completedAt: '2024-01-18T09:15:00Z',
    verifiedBy: 'System (AI)',
    notes: 'Tax ID verified across all hubs'
  },
  {
    id: 5,
    step: 'Supplier Risk Scoring',
    status: 'in_progress',
    completedAt: null,
    verifiedBy: null,
    notes: 'AI risk assessment in progress',
    progress: 75
  }
];

// Country Regulatory Matrix
export const countryRegulatoryMatrix = [
  {
    country: 'Nigeria',
    code: 'NG',
    marketplaceAllowed: true,
    kycLevel: 'Tier 2',
    taxRules: 'VAT 7.5%, Corporate Tax 30%',
    restrictedProducts: ['Firearms', 'Controlled Substances'],
    notes: 'Requires business registration and tax clearance',
    riskLevel: 'medium'
  },
  {
    country: 'Kenya',
    code: 'KE',
    marketplaceAllowed: true,
    kycLevel: 'Tier 1',
    taxRules: 'VAT 16%, Corporate Tax 30%',
    restrictedProducts: ['Weapons', 'Hazardous Materials'],
    notes: 'Standard compliance requirements',
    riskLevel: 'low'
  },
  {
    country: 'South Africa',
    code: 'ZA',
    marketplaceAllowed: true,
    kycLevel: 'Tier 2',
    taxRules: 'VAT 15%, Corporate Tax 28%',
    restrictedProducts: ['Tobacco', 'Alcohol (restricted)'],
    notes: 'Requires SARS registration',
    riskLevel: 'low'
  },
  {
    country: 'Ghana',
    code: 'GH',
    marketplaceAllowed: true,
    kycLevel: 'Tier 1',
    taxRules: 'VAT 12.5%, Corporate Tax 25%',
    restrictedProducts: ['Firearms'],
    notes: 'Standard compliance',
    riskLevel: 'low'
  },
  {
    country: 'Tanzania',
    code: 'TZ',
    marketplaceAllowed: true,
    kycLevel: 'Tier 2',
    taxRules: 'VAT 18%, Corporate Tax 30%',
    restrictedProducts: ['Controlled Substances'],
    notes: 'Requires TRA registration',
    riskLevel: 'medium'
  },
  {
    country: 'Ethiopia',
    code: 'ET',
    marketplaceAllowed: false,
    kycLevel: 'Tier 3',
    taxRules: 'VAT 15%, Corporate Tax 30%',
    restrictedProducts: ['Multiple restrictions'],
    notes: 'Marketplace operations require special license - Under Review',
    riskLevel: 'high'
  },
  {
    country: 'Egypt',
    code: 'EG',
    marketplaceAllowed: true,
    kycLevel: 'Tier 2',
    taxRules: 'VAT 14%, Corporate Tax 22.5%',
    restrictedProducts: ['Alcohol', 'Tobacco'],
    notes: 'Requires commercial registration',
    riskLevel: 'medium'
  },
  {
    country: 'Morocco',
    code: 'MA',
    marketplaceAllowed: true,
    kycLevel: 'Tier 1',
    taxRules: 'VAT 20%, Corporate Tax 31%',
    restrictedProducts: ['Firearms'],
    notes: 'Standard compliance',
    riskLevel: 'low'
  },
  {
    country: 'Algeria',
    code: 'DZ',
    marketplaceAllowed: false,
    kycLevel: 'Tier 3',
    taxRules: 'VAT 19%, Corporate Tax 26%',
    restrictedProducts: ['Multiple restrictions'],
    notes: 'Marketplace operations restricted - Manual Review Required',
    riskLevel: 'high'
  },
  {
    country: 'Uganda',
    code: 'UG',
    marketplaceAllowed: true,
    kycLevel: 'Tier 1',
    taxRules: 'VAT 18%, Corporate Tax 30%',
    restrictedProducts: ['Firearms'],
    notes: 'Standard compliance',
    riskLevel: 'low'
  }
];

// Compliance Tasks & Deadlines
export const complianceTasks = [
  {
    id: 1,
    title: 'Renew Export License - Expired',
    dueDate: '2024-01-15',
    riskLevel: 'critical',
    assignedTo: 'Compliance Team',
    status: 'open',
    category: 'License Renewal',
    description: 'Export license expired on Jan 15, 2024. Immediate action required.'
  },
  {
    id: 2,
    title: 'Upload Insurance Certificate',
    dueDate: '2024-02-10',
    riskLevel: 'high',
    assignedTo: 'Documentation Team',
    status: 'in_progress',
    category: 'Document Upload',
    description: 'Insurance certificate is missing and required for escrow eligibility.'
  },
  {
    id: 3,
    title: 'Rwanda Corporate Tax Filing',
    dueDate: '2024-02-10',
    riskLevel: 'high',
    assignedTo: 'Tax Team',
    status: 'open',
    category: 'Tax Filing',
    description: 'Corporate tax filing for Rwanda hub is overdue.'
  },
  {
    id: 4,
    title: 'Re-upload Bank Statement',
    dueDate: '2024-02-15',
    riskLevel: 'medium',
    assignedTo: 'Documentation Team',
    status: 'open',
    category: 'Document Upload',
    description: 'Previous upload was rejected due to quality issues.'
  },
  {
    id: 5,
    title: 'Complete Address Verification',
    dueDate: '2024-02-20',
    riskLevel: 'medium',
    assignedTo: 'Verification Team',
    status: 'in_progress',
    category: 'Verification',
    description: 'Address verification pending document upload.'
  },
  {
    id: 6,
    title: 'Nigeria Annual Return Filing',
    dueDate: '2024-02-12',
    riskLevel: 'high',
    assignedTo: 'Tax Team',
    status: 'open',
    category: 'Tax Filing',
    description: 'Company annual return due in 2 days.'
  },
  {
    id: 7,
    title: 'Update Tax Registration - Kenya',
    dueDate: '2024-03-01',
    riskLevel: 'low',
    assignedTo: 'Tax Team',
    status: 'open',
    category: 'Tax Filing',
    description: 'Quarterly tax registration update required.'
  },
  {
    id: 8,
    title: 'Supplier Risk Assessment Review',
    dueDate: '2024-02-25',
    riskLevel: 'medium',
    assignedTo: 'Risk Team',
    status: 'in_progress',
    category: 'Risk Assessment',
    description: 'AI risk scoring in progress, manual review may be required.'
  }
];

// Certificates & Legal Documents
export const certificates = [
  {
    id: 1,
    name: 'Business License',
    type: 'License',
    status: 'active',
    expiryDate: '2025-01-15',
    uploadedDate: '2024-01-15',
    fileUrl: '/certificates/business-license.pdf',
    fileSize: '2.3 MB'
  },
  {
    id: 2,
    name: 'Tax Registration Certificate',
    type: 'Tax',
    status: 'active',
    expiryDate: '2025-01-20',
    uploadedDate: '2024-01-20',
    fileUrl: '/certificates/tax-registration.pdf',
    fileSize: '1.8 MB'
  },
  {
    id: 3,
    name: 'Export Certificate',
    type: 'Trade',
    status: 'expired',
    expiryDate: '2024-01-15',
    uploadedDate: '2023-06-15',
    fileUrl: '/certificates/export-certificate.pdf',
    fileSize: '3.1 MB'
  },
  {
    id: 4,
    name: 'Import Certificate',
    type: 'Trade',
    status: 'active',
    expiryDate: '2025-01-25',
    uploadedDate: '2024-01-25',
    fileUrl: '/certificates/import-certificate.pdf',
    fileSize: '2.9 MB'
  },
  {
    id: 5,
    name: 'General Liability Insurance',
    type: 'Insurance',
    status: 'missing',
    expiryDate: null,
    uploadedDate: null,
    fileUrl: null,
    fileSize: null
  },
  {
    id: 6,
    name: 'Cargo Insurance',
    type: 'Insurance',
    status: 'active',
    expiryDate: '2024-12-31',
    uploadedDate: '2024-01-01',
    fileUrl: '/certificates/cargo-insurance.pdf',
    fileSize: '1.5 MB'
  },
  {
    id: 7,
    name: 'Company Ownership Documents',
    type: 'Legal',
    status: 'active',
    expiryDate: null,
    uploadedDate: '2024-01-10',
    fileUrl: '/certificates/ownership-docs.pdf',
    fileSize: '4.2 MB'
  }
];

