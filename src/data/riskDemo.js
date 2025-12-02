/**
 * Afrikoni Shield™ - Risk Management Dashboard Demo Data
 * This file contains mock data for the Risk Management Dashboard
 * Later, this will be replaced with Supabase queries or external API calls
 */

// Real-Time Risk Overview KPIs
export const riskKPIs = {
  platformRiskScore: 23, // 0-100, lower is better
  openIncidents: 7,
  complianceTasksDue: 12,
  kycPending: 45,
  fraudAlerts24h: 3,
  shipmentsAtRisk: 8
};

// Tax & Compliance Tracking
export const taxCompliance = [
  {
    id: 1,
    hub: 'Mauritius',
    country: 'MU',
    deadline: '2024-02-15',
    type: 'VAT Return',
    status: 'upcoming', // done, upcoming, overdue
    daysUntil: 5,
    documents: ['VAT-2024-Q1.pdf', 'Sales-Report-Q1.xlsx'],
    reminderSent: true
  },
  {
    id: 2,
    hub: 'Rwanda',
    country: 'RW',
    deadline: '2024-02-10',
    type: 'Corporate Tax',
    status: 'overdue',
    daysUntil: -2,
    documents: ['Tax-Declaration-2024.pdf'],
    reminderSent: true
  },
  {
    id: 3,
    hub: 'Kenya',
    country: 'KE',
    deadline: '2024-02-20',
    type: 'Withholding Tax',
    status: 'upcoming',
    daysUntil: 10,
    documents: ['WHT-2024-Feb.pdf'],
    reminderSent: false
  },
  {
    id: 4,
    hub: 'South Africa',
    country: 'ZA',
    deadline: '2024-02-25',
    type: 'VAT Return',
    status: 'upcoming',
    daysUntil: 15,
    documents: ['VAT-SA-2024-Q1.pdf'],
    reminderSent: false
  },
  {
    id: 5,
    hub: 'Nigeria',
    country: 'NG',
    deadline: '2024-02-12',
    type: 'Company Annual Return',
    status: 'upcoming',
    daysUntil: 2,
    documents: ['Annual-Return-2024.pdf', 'Financial-Statements-2024.pdf'],
    reminderSent: true
  }
];

// Anti-Corruption Monitoring
export const antiCorruptionData = {
  whistleblowerReports: 2,
  aiFlaggedAnomalies: 5,
  attemptedBribeAlerts: 0,
  suspiciousDocumentEdits: 3,
  employeeRedFlags: 1,
  partnerRedFlags: 0,
  auditTrail: [
    {
      id: 1,
      timestamp: '2024-02-05T10:23:45Z',
      user: 'user_abc123',
      action: 'Document Upload',
      resource: 'Supplier Verification',
      status: 'flagged',
      reason: 'Unusual document modification pattern',
      severity: 'medium'
    },
    {
      id: 2,
      timestamp: '2024-02-05T09:15:22Z',
      user: 'admin_xyz789',
      action: 'Payment Release',
      resource: 'Order #ORD-2024-001234',
      status: 'approved',
      reason: 'Standard escrow release',
      severity: 'low'
    },
    {
      id: 3,
      timestamp: '2024-02-04T16:45:10Z',
      user: 'supplier_def456',
      action: 'Profile Update',
      resource: 'Company Information',
      status: 'flagged',
      reason: 'Multiple rapid changes to verification documents',
      severity: 'high'
    },
    {
      id: 4,
      timestamp: '2024-02-04T14:30:05Z',
      user: 'buyer_ghi789',
      action: 'Order Creation',
      resource: 'Order #ORD-2024-001189',
      status: 'approved',
      reason: 'Normal transaction',
      severity: 'low'
    },
    {
      id: 5,
      timestamp: '2024-02-03T11:20:33Z',
      user: 'system',
      action: 'Whistleblower Report',
      resource: 'Incident #INC-2024-00042',
      status: 'investigating',
      reason: 'Anonymous report received',
      severity: 'critical'
    }
  ]
};

// Logistics & Customs Risk
export const logisticsRisk = {
  shipmentsDelayed: [
    {
      id: 'SHIP-001',
      origin: 'Lagos, Nigeria',
      destination: 'Nairobi, Kenya',
      carrier: 'AfriLogistics Ltd',
      delayHours: 72,
      reason: 'Customs clearance delay',
      riskLevel: 'high',
      estimatedResolution: '2024-02-08'
    },
    {
      id: 'SHIP-002',
      origin: 'Cape Town, SA',
      destination: 'Kigali, Rwanda',
      carrier: 'East Africa Express',
      delayHours: 48,
      reason: 'Weather disruption',
      riskLevel: 'medium',
      estimatedResolution: '2024-02-07'
    },
    {
      id: 'SHIP-003',
      origin: 'Accra, Ghana',
      destination: 'Dar es Salaam, Tanzania',
      carrier: 'Pan-African Logistics',
      delayHours: 96,
      reason: 'Customs hold - documentation',
      riskLevel: 'critical',
      estimatedResolution: '2024-02-10'
    }
  ],
  customsHolds: 3,
  highRiskRoutes: [
    { route: 'Nigeria → Kenya', riskScore: 78, incidents: 5 },
    { route: 'Ghana → Tanzania', riskScore: 65, incidents: 3 },
    { route: 'SA → Rwanda', riskScore: 45, incidents: 1 }
  ],
  partnerPerformance: [
    { partner: 'AfriLogistics Ltd', onTimeRate: 82, riskLevel: 'medium' },
    { partner: 'East Africa Express', onTimeRate: 91, riskLevel: 'low' },
    { partner: 'Pan-African Logistics', onTimeRate: 68, riskLevel: 'high' }
  ],
  crossBorderExceptions: 2
};

// Fraud Detection & Payments Integrity
export const fraudData = {
  dailyFraudScore: [
    { date: '2024-02-01', score: 15 },
    { date: '2024-02-02', score: 18 },
    { date: '2024-02-03', score: 22 },
    { date: '2024-02-04', score: 19 },
    { date: '2024-02-05', score: 23 },
    { date: '2024-02-06', score: 21 },
    { date: '2024-02-07', score: 20 }
  ],
  chargebacks7Days: 8,
  suspiciousVelocity: 3,
  stolenCardAttempts: 2,
  escrowAnomalies: 1,
  recentFraudAlerts: [
    {
      id: 1,
      timestamp: '2024-02-07T14:30:00Z',
      type: 'Velocity Check',
      transaction: 'TXN-2024-987654',
      amount: 45000,
      currency: 'USD',
      riskScore: 85,
      status: 'blocked'
    },
    {
      id: 2,
      timestamp: '2024-02-07T09:15:00Z',
      type: 'Stolen Card',
      transaction: 'TXN-2024-987621',
      amount: 12000,
      currency: 'USD',
      riskScore: 95,
      status: 'blocked'
    },
    {
      id: 3,
      timestamp: '2024-02-06T16:45:00Z',
      type: 'Escrow Anomaly',
      transaction: 'TXN-2024-987589',
      amount: 78000,
      currency: 'USD',
      riskScore: 72,
      status: 'flagged'
    }
  ]
};

// Early-Warning Alerts
export const earlyWarningAlerts = [
  {
    id: 1,
    timestamp: '2024-02-07T15:30:00Z',
    type: 'Tax Deadline',
    severity: 'high',
    title: 'Nigeria Company Annual Return due in 2 days',
    description: 'Annual return filing deadline approaching for Nigeria hub',
    category: 'compliance',
    actionRequired: true,
    acknowledged: false
  },
  {
    id: 2,
    timestamp: '2024-02-07T14:20:00Z',
    type: 'Suspicious Login',
    severity: 'critical',
    title: 'Unusual login pattern detected from IP 197.210.52.18',
    description: 'Multiple failed login attempts followed by successful login from new location',
    category: 'security',
    actionRequired: true,
    acknowledged: false
  },
  {
    id: 3,
    timestamp: '2024-02-07T13:15:00Z',
    type: 'Supplier Compliance',
    severity: 'medium',
    title: 'Supplier verification documents expired',
    description: '3 suppliers have expired KYC documents requiring renewal',
    category: 'compliance',
    actionRequired: true,
    acknowledged: false
  },
  {
    id: 4,
    timestamp: '2024-02-07T11:45:00Z',
    type: 'Route Instability',
    severity: 'high',
    title: 'Political unrest reported in transit region',
    description: 'Route Nigeria → Kenya affected by reported political activity',
    category: 'logistics',
    actionRequired: true,
    acknowledged: true
  },
  {
    id: 5,
    timestamp: '2024-02-07T10:30:00Z',
    type: 'Partner SLA',
    severity: 'medium',
    title: 'Pan-African Logistics on-time rate below threshold',
    description: 'On-time delivery rate dropped to 68% (threshold: 75%)',
    category: 'logistics',
    actionRequired: true,
    acknowledged: false
  },
  {
    id: 6,
    timestamp: '2024-02-07T09:00:00Z',
    type: 'Identity Fraud',
    severity: 'critical',
    title: 'Potential identity fraud detected in KYC submission',
    description: 'New supplier registration flagged by AI for document inconsistencies',
    category: 'fraud',
    actionRequired: true,
    acknowledged: false
  },
  {
    id: 7,
    timestamp: '2024-02-06T17:20:00Z',
    type: 'Tax Deadline',
    severity: 'medium',
    title: 'Rwanda Corporate Tax filing overdue',
    description: 'Corporate tax filing for Rwanda hub is 2 days overdue',
    category: 'compliance',
    actionRequired: true,
    acknowledged: false
  },
  {
    id: 8,
    timestamp: '2024-02-06T16:10:00Z',
    type: 'Customs Hold',
    severity: 'high',
    title: 'Shipment SHIP-003 held at customs for 48+ hours',
    description: 'Documentation issue requires immediate attention',
    category: 'logistics',
    actionRequired: true,
    acknowledged: false
  }
];

// Risk Score Over Time (for chart)
export const riskScoreHistory = [
  { date: '2024-01-01', score: 28 },
  { date: '2024-01-08', score: 25 },
  { date: '2024-01-15', score: 30 },
  { date: '2024-01-22', score: 27 },
  { date: '2024-01-29', score: 24 },
  { date: '2024-02-05', score: 23 },
  { date: '2024-02-07', score: 23 }
];

// Compliance by Hub (for bar chart)
export const complianceByHub = [
  { hub: 'Mauritius', completed: 8, pending: 1, overdue: 0 },
  { hub: 'Rwanda', completed: 6, pending: 2, overdue: 1 },
  { hub: 'Kenya', completed: 9, pending: 1, overdue: 0 },
  { hub: 'South Africa', completed: 7, pending: 1, overdue: 0 },
  { hub: 'Nigeria', completed: 5, pending: 2, overdue: 0 }
];

