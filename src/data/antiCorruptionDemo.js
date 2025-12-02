/**
 * Afrikoni Shield™ - Anti-Corruption Dashboard Demo Data
 * Mock data for the Anti-Corruption Dashboard
 */

// Anti-Corruption Overview KPIs
export const antiCorruptionKPIs = {
  totalReports30Days: 12,
  openCases: 5,
  closedCases: 47,
  aiFlaggedAnomalies: 8,
  highRiskPartners: 3,
  zeroBribeComplianceScore: 94 // 0-100
};

// Whistleblower Reports
export const whistleblowerReports = [
  {
    id: 'WB-2024-001',
    reportType: 'Bribe Solicitation',
    severity: 'critical',
    reporter: 'Anonymous',
    status: 'open',
    timestamp: '2024-02-05T14:30:00Z',
    description: 'Supplier requested cash payment outside platform',
    assignedTo: 'Compliance Officer A',
    category: 'fraud'
  },
  {
    id: 'WB-2024-002',
    reportType: 'Fraud',
    severity: 'high',
    reporter: 'Internal',
    status: 'in_review',
    timestamp: '2024-02-04T10:15:00Z',
    description: 'Suspicious document manipulation detected',
    assignedTo: 'Compliance Officer B',
    category: 'fraud'
  },
  {
    id: 'WB-2024-003',
    reportType: 'Misconduct',
    severity: 'medium',
    reporter: 'Anonymous',
    status: 'resolved',
    timestamp: '2024-02-01T16:45:00Z',
    description: 'Employee favoritism in supplier selection',
    assignedTo: 'Compliance Officer A',
    category: 'misconduct'
  },
  {
    id: 'WB-2024-004',
    reportType: 'Abuse of Power',
    severity: 'high',
    reporter: 'Internal',
    status: 'open',
    timestamp: '2024-02-06T09:20:00Z',
    description: 'Unauthorized access to sensitive financial data',
    assignedTo: 'Compliance Officer C',
    category: 'abuse'
  },
  {
    id: 'WB-2024-005',
    reportType: 'Bribe Solicitation',
    severity: 'critical',
    reporter: 'Anonymous',
    status: 'in_review',
    timestamp: '2024-02-07T11:00:00Z',
    description: 'Customs official requested facilitation fee',
    assignedTo: 'Compliance Officer A',
    category: 'fraud'
  },
  {
    id: 'WB-2024-006',
    reportType: 'Fraud',
    severity: 'medium',
    reporter: 'Internal',
    status: 'resolved',
    timestamp: '2024-01-28T13:30:00Z',
    description: 'Duplicate invoice submission detected',
    assignedTo: 'Compliance Officer B',
    category: 'fraud'
  }
];

// AI-Anomaly Detection Results
export const aiAnomalies = [
  {
    id: 1,
    entityType: 'Supplier',
    entityId: 'SUP-12345',
    entityName: 'Ghana Trading Co.',
    anomalyScore: 78,
    flagType: 'Payment Irregularity',
    riskLevel: 'high',
    details: 'Unusual payment pattern: multiple small transactions followed by large withdrawal',
    detectedAt: '2024-02-07T08:15:00Z',
    trend: [12, 15, 18, 22, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 78]
  },
  {
    id: 2,
    entityType: 'Employee',
    entityId: 'EMP-67890',
    entityName: 'John Doe',
    anomalyScore: 65,
    flagType: 'Unusual Routing',
    riskLevel: 'high',
    details: 'Multiple order approvals routed through single employee account',
    detectedAt: '2024-02-06T14:30:00Z',
    trend: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
  },
  {
    id: 3,
    entityType: 'Partner',
    entityId: 'PRT-11111',
    entityName: 'East Africa Logistics',
    anomalyScore: 52,
    flagType: 'Suspicious Pattern',
    riskLevel: 'medium',
    details: 'Delivery routes consistently avoid standard checkpoints',
    detectedAt: '2024-02-05T10:00:00Z',
    trend: [15, 20, 25, 30, 35, 40, 45, 50, 52]
  },
  {
    id: 4,
    entityType: 'Supplier',
    entityId: 'SUP-22222',
    entityName: 'Nigeria Export Ltd',
    anomalyScore: 45,
    flagType: 'Payment Irregularity',
    riskLevel: 'medium',
    details: 'Payment timing inconsistent with delivery schedules',
    detectedAt: '2024-02-04T16:20:00Z',
    trend: [10, 15, 20, 25, 30, 35, 40, 45]
  },
  {
    id: 5,
    entityType: 'Employee',
    entityId: 'EMP-33333',
    entityName: 'Jane Smith',
    anomalyScore: 35,
    flagType: 'Unusual Routing',
    riskLevel: 'medium',
    details: 'After-hours access to restricted financial modules',
    detectedAt: '2024-02-03T20:45:00Z',
    trend: [5, 10, 15, 20, 25, 30, 35]
  },
  {
    id: 6,
    entityType: 'Partner',
    entityId: 'PRT-44444',
    entityName: 'West Africa Shipping',
    anomalyScore: 28,
    flagType: 'Suspicious Pattern',
    riskLevel: 'low',
    details: 'Minor deviation in standard operating procedures',
    detectedAt: '2024-02-02T12:00:00Z',
    trend: [8, 12, 16, 20, 24, 28]
  }
];

// Immutable Audit Trail
export const auditTrail = [
  {
    id: 1,
    timestamp: '2024-02-07T15:30:00Z',
    user: 'user_abc123',
    system: false,
    action: 'Document Upload',
    metadata: {
      ip: '197.210.52.18',
      country: 'Ghana',
      document: 'Business Certificate',
      transactionId: null
    },
    integrityHash: '0x7a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    details: 'Business registration certificate uploaded and verified'
  },
  {
    id: 2,
    timestamp: '2024-02-07T14:20:00Z',
    user: 'system',
    system: true,
    action: 'Anomaly Detection',
    metadata: {
      ip: 'System',
      country: 'N/A',
      document: null,
      transactionId: 'TXN-2024-987654'
    },
    integrityHash: '0x8b4g0c3d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    details: 'AI system flagged payment irregularity in transaction TXN-2024-987654'
  },
  {
    id: 3,
    timestamp: '2024-02-07T13:15:00Z',
    user: 'admin_xyz789',
    system: false,
    action: 'Payment Release',
    metadata: {
      ip: '197.210.52.19',
      country: 'Ghana',
      document: null,
      transactionId: 'TXN-2024-987621'
    },
    integrityHash: '0x9c5h1d4e3f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    details: 'Escrow payment released after order confirmation'
  },
  {
    id: 4,
    timestamp: '2024-02-07T12:00:00Z',
    user: 'compliance_officer_a',
    system: false,
    action: 'Whistleblower Report Created',
    metadata: {
      ip: '197.210.52.20',
      country: 'Ghana',
      document: 'WB-2024-001',
      transactionId: null
    },
    integrityHash: '0xad6i2e5f4g7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    details: 'New whistleblower report received: WB-2024-001'
  },
  {
    id: 5,
    timestamp: '2024-02-07T11:45:00Z',
    user: 'user_def456',
    system: false,
    action: 'Profile Update',
    metadata: {
      ip: '197.210.52.21',
      country: 'Nigeria',
      document: 'Company Information',
      transactionId: null
    },
    integrityHash: '0xbe7j3f6g5h8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    details: 'Company information updated - multiple rapid changes detected'
  },
  {
    id: 6,
    timestamp: '2024-02-07T10:30:00Z',
    user: 'system',
    system: true,
    action: 'Risk Score Update',
    metadata: {
      ip: 'System',
      country: 'N/A',
      document: null,
      transactionId: null
    },
    integrityHash: '0xcf8k4g7h6i9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
    details: 'Risk assessment engine updated supplier risk scores'
  },
  {
    id: 7,
    timestamp: '2024-02-07T09:15:00Z',
    user: 'admin_xyz789',
    system: false,
    action: 'Case Assignment',
    metadata: {
      ip: '197.210.52.19',
      country: 'Ghana',
      document: 'CASE-2024-042',
      transactionId: null
    },
    integrityHash: '0xdg9l5h8i7j0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    details: 'Case CASE-2024-042 assigned to Compliance Officer A'
  },
  {
    id: 8,
    timestamp: '2024-02-07T08:00:00Z',
    user: 'system',
    system: true,
    action: 'AML Screening',
    metadata: {
      ip: 'System',
      country: 'N/A',
      document: null,
      transactionId: 'TXN-2024-987589'
    },
    integrityHash: '0xeh0m6i9j8k1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
    details: 'Automated AML screening completed for transaction TXN-2024-987589'
  }
];

// Employee & Partner Risk Profiles
export const riskProfiles = [
  {
    id: 1,
    name: 'John Kofi Mensah',
    entityId: 'EMP-67890',
    role: 'Internal',
    position: 'Operations Manager',
    riskScore: 65,
    flags: ['Unusual Routing', 'After-hours Access'],
    lastAnomalyDate: '2024-02-06T14:30:00Z',
    country: 'Ghana'
  },
  {
    id: 2,
    name: 'Ghana Trading Co.',
    entityId: 'SUP-12345',
    role: 'Supplier',
    position: 'Trading Company',
    riskScore: 78,
    flags: ['Payment Irregularity', 'High Transaction Volume'],
    lastAnomalyDate: '2024-02-07T08:15:00Z',
    country: 'Ghana'
  },
  {
    id: 3,
    name: 'East Africa Logistics',
    entityId: 'PRT-11111',
    role: 'Partner',
    position: 'Logistics Provider',
    riskScore: 52,
    flags: ['Suspicious Pattern'],
    lastAnomalyDate: '2024-02-05T10:00:00Z',
    country: 'Kenya'
  },
  {
    id: 4,
    name: 'Jane Smith',
    entityId: 'EMP-33333',
    role: 'Internal',
    position: 'Financial Analyst',
    riskScore: 35,
    flags: ['Unusual Routing'],
    lastAnomalyDate: '2024-02-03T20:45:00Z',
    country: 'South Africa'
  },
  {
    id: 5,
    name: 'Nigeria Export Ltd',
    entityId: 'SUP-22222',
    role: 'Supplier',
    position: 'Export Company',
    riskScore: 45,
    flags: ['Payment Irregularity'],
    lastAnomalyDate: '2024-02-04T16:20:00Z',
    country: 'Nigeria'
  },
  {
    id: 6,
    name: 'West Africa Shipping',
    entityId: 'PRT-44444',
    role: 'Partner',
    position: 'Shipping Company',
    riskScore: 28,
    flags: [],
    lastAnomalyDate: '2024-02-02T12:00:00Z',
    country: 'Senegal'
  },
  {
    id: 7,
    name: 'Sarah Johnson',
    entityId: 'EMP-55555',
    role: 'Internal',
    position: 'Compliance Officer',
    riskScore: 15,
    flags: [],
    lastAnomalyDate: null,
    country: 'Mauritius'
  },
  {
    id: 8,
    name: 'Central Africa Trading',
    entityId: 'SUP-66666',
    role: 'Supplier',
    position: 'Trading Company',
    riskScore: 22,
    flags: [],
    lastAnomalyDate: null,
    country: 'Cameroon'
  }
];

// Regional Corruption Risk Zones
export const regionalRiskZones = [
  { country: 'Ghana', code: 'GH', riskLevel: 'low', riskScore: 25 },
  { country: 'Kenya', code: 'KE', riskLevel: 'low', riskScore: 30 },
  { country: 'South Africa', code: 'ZA', riskLevel: 'low', riskScore: 28 },
  { country: 'Mauritius', code: 'MU', riskLevel: 'low', riskScore: 20 },
  { country: 'Rwanda', code: 'RW', riskLevel: 'low', riskScore: 22 },
  { country: 'Nigeria', code: 'NG', riskLevel: 'medium', riskScore: 55 },
  { country: 'Tanzania', code: 'TZ', riskLevel: 'medium', riskScore: 48 },
  { country: 'Ghana', code: 'GH', riskLevel: 'low', riskScore: 25 },
  { country: 'Cameroon', code: 'CM', riskLevel: 'medium', riskScore: 52 },
  { country: 'Senegal', code: 'SN', riskLevel: 'low', riskScore: 32 },
  { country: 'Ethiopia', code: 'ET', riskLevel: 'high', riskScore: 72 },
  { country: 'Sudan', code: 'SD', riskLevel: 'high', riskScore: 78 },
  { country: 'Somalia', code: 'SO', riskLevel: 'extreme', riskScore: 92 },
  { country: 'Libya', code: 'LY', riskLevel: 'extreme', riskScore: 88 },
  { country: 'Zimbabwe', code: 'ZW', riskLevel: 'high', riskScore: 68 }
];

// Zero-Bribe Policy Enforcement
export const zeroBribePolicy = {
  suppliersAccepted: 94, // percentage
  employeesTrained: 98, // percentage
  violationsDetected: 3,
  violationsResolved: 3,
  policyVersion: '2.1',
  lastUpdateDate: '2024-01-15',
  policyText: 'Afrikoni maintains a strict zero-tolerance policy against bribery and corruption. All suppliers, partners, and employees must comply with this policy. Violations will result in immediate termination of contracts and legal action where applicable.'
};

// Case Management (Active Investigations)
export const activeCases = [
  {
    id: 'CASE-2024-042',
    type: 'Bribery',
    assignedOfficer: 'Compliance Officer A',
    status: 'investigating',
    severity: 'critical',
    lastUpdate: '2024-02-07T14:30:00Z',
    openedDate: '2024-02-05T14:30:00Z',
    description: 'Supplier requested cash payment outside platform',
    relatedReport: 'WB-2024-001',
    relatedEntities: ['SUP-12345', 'EMP-67890']
  },
  {
    id: 'CASE-2024-041',
    type: 'Fraud',
    assignedOfficer: 'Compliance Officer B',
    status: 'open',
    severity: 'high',
    lastUpdate: '2024-02-06T10:15:00Z',
    openedDate: '2024-02-04T10:15:00Z',
    description: 'Suspicious document manipulation detected',
    relatedReport: 'WB-2024-002',
    relatedEntities: ['SUP-22222']
  },
  {
    id: 'CASE-2024-040',
    type: 'Partner Violation',
    assignedOfficer: 'Compliance Officer C',
    status: 'escalated',
    severity: 'high',
    lastUpdate: '2024-02-07T09:20:00Z',
    openedDate: '2024-02-06T09:20:00Z',
    description: 'Unauthorized access to sensitive financial data',
    relatedReport: 'WB-2024-004',
    relatedEntities: ['PRT-11111', 'EMP-33333']
  },
  {
    id: 'CASE-2024-039',
    type: 'Bribery',
    assignedOfficer: 'Compliance Officer A',
    status: 'investigating',
    severity: 'critical',
    lastUpdate: '2024-02-07T11:00:00Z',
    openedDate: '2024-02-07T11:00:00Z',
    description: 'Customs official requested facilitation fee',
    relatedReport: 'WB-2024-005',
    relatedEntities: ['PRT-44444']
  },
  {
    id: 'CASE-2024-038',
    type: 'Misconduct',
    assignedOfficer: 'Compliance Officer B',
    status: 'closed',
    severity: 'medium',
    lastUpdate: '2024-02-02T16:45:00Z',
    openedDate: '2024-02-01T16:45:00Z',
    description: 'Employee favoritism in supplier selection - Resolved',
    relatedReport: 'WB-2024-003',
    relatedEntities: ['EMP-55555']
  }
];

