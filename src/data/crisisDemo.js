/**
 * Afrikoni Shield™ - Crisis Management Center Demo Data
 * Mock data for the Crisis Management Center dashboard
 */

// Crisis Overview KPIs
export const crisisKPIs = {
  activeIncidents: 4,
  criticalSeverityEvents: 2,
  systemsOperational: 96, // percentage
  openCrisisTasks: 8,
  averageResponseTime: '2.3h',
  resolvedLast24h: 3
};

// Active Incidents
export const activeIncidents = [
  {
    id: 'CRISIS-2024-001',
    category: 'Payment Gateway',
    severity: 'critical',
    region: 'West Africa',
    country: 'Nigeria',
    status: 'active',
    lastUpdate: '2024-02-07T15:30:00Z',
    description: 'Payment gateway experiencing intermittent failures affecting 15% of transactions',
    impact: 'High - Multiple payment failures reported',
    assignedTeam: 'Tech Operations',
    eta: '2024-02-07T18:00:00Z',
    progress: 45
  },
  {
    id: 'CRISIS-2024-002',
    category: 'Logistics Disruption',
    severity: 'high',
    region: 'East Africa',
    country: 'Kenya',
    status: 'investigating',
    lastUpdate: '2024-02-07T14:20:00Z',
    description: 'Major shipment route blocked due to political protests. 12 shipments delayed.',
    impact: 'Medium - Route alternative being arranged',
    assignedTeam: 'Logistics Team',
    eta: '2024-02-08T10:00:00Z',
    progress: 30
  },
  {
    id: 'CRISIS-2024-003',
    category: 'Cybersecurity',
    severity: 'critical',
    region: 'Global',
    country: 'N/A',
    status: 'active',
    lastUpdate: '2024-02-07T13:15:00Z',
    description: 'Suspected data breach attempt detected. Security team investigating.',
    impact: 'Critical - Immediate containment in progress',
    assignedTeam: 'Security Team',
    eta: '2024-02-07T17:00:00Z',
    progress: 60
  },
  {
    id: 'CRISIS-2024-004',
    category: 'Bribery/Corruption',
    severity: 'high',
    region: 'West Africa',
    country: 'Ghana',
    status: 'investigating',
    lastUpdate: '2024-02-07T12:00:00Z',
    description: 'Bribery allegation reported via whistleblower system. Case under investigation.',
    impact: 'High - Compliance team reviewing',
    assignedTeam: 'Compliance Team',
    eta: '2024-02-08T16:00:00Z',
    progress: 25
  },
  {
    id: 'CRISIS-2024-005',
    category: 'Political Risk',
    severity: 'medium',
    region: 'Central Africa',
    country: 'Cameroon',
    status: 'monitoring',
    lastUpdate: '2024-02-07T11:45:00Z',
    description: 'Political unrest reported. Monitoring situation for potential impact on operations.',
    impact: 'Low - No immediate disruption',
    assignedTeam: 'Risk Management',
    eta: null,
    progress: 10
  },
  {
    id: 'CRISIS-2024-006',
    category: 'Fraud Spike',
    severity: 'high',
    region: 'South Africa',
    country: 'South Africa',
    status: 'active',
    lastUpdate: '2024-02-07T10:30:00Z',
    description: 'Fraud detection system flagged 8 suspicious transactions in last 2 hours',
    impact: 'Medium - Enhanced monitoring activated',
    assignedTeam: 'Fraud Prevention',
    eta: '2024-02-07T20:00:00Z',
    progress: 50
  }
];

// Crisis Categories & Severity Matrix
export const crisisCategories = [
  {
    category: 'Outage',
    icon: 'power',
    description: 'System or service unavailability',
    critical: 'Complete platform downtime',
    high: 'Regional service disruption',
    medium: 'Partial feature unavailability',
    low: 'Minor service degradation'
  },
  {
    category: 'Cybersecurity',
    icon: 'shield',
    description: 'Security breaches, attacks, data leaks',
    critical: 'Active breach or data exfiltration',
    high: 'Suspected breach or major vulnerability',
    medium: 'Security incident contained',
    low: 'Minor security alert'
  },
  {
    category: 'Payments',
    icon: 'dollar',
    description: 'Payment gateway failures, transaction issues',
    critical: 'Payment system completely down',
    high: 'High failure rate (>20%)',
    medium: 'Intermittent payment issues',
    low: 'Minor payment delays'
  },
  {
    category: 'Logistics',
    icon: 'truck',
    description: 'Shipment delays, route closures, customs issues',
    critical: 'Major route closure affecting 50+ shipments',
    high: 'Significant delays (>48h)',
    medium: 'Moderate delays or route issues',
    low: 'Minor logistics delays'
  },
  {
    category: 'Fraud',
    icon: 'alert',
    description: 'Fraud spikes, suspicious activity',
    critical: 'Massive fraud wave detected',
    high: 'Significant fraud increase',
    medium: 'Elevated fraud activity',
    low: 'Minor fraud alerts'
  },
  {
    category: 'Bribery/Corruption',
    icon: 'lock',
    description: 'Bribery allegations, corruption reports',
    critical: 'Public bribery scandal',
    high: 'Serious bribery allegation',
    medium: 'Bribery report under review',
    low: 'Minor compliance concern'
  },
  {
    category: 'Political Risk',
    icon: 'globe',
    description: 'Political instability, government actions',
    critical: 'Country-wide instability',
    high: 'Regional political risk',
    medium: 'Localized political issues',
    low: 'Monitoring political situation'
  },
  {
    category: 'PR Crisis',
    icon: 'megaphone',
    description: 'Reputation threats, media scandals',
    critical: 'Major media scandal',
    high: 'Negative PR campaign',
    medium: 'Reputation concern',
    low: 'Minor PR issue'
  },
  {
    category: 'Legal Dispute',
    icon: 'scale',
    description: 'Legal challenges, regulatory actions',
    critical: 'Major lawsuit or regulatory action',
    high: 'Significant legal challenge',
    medium: 'Legal dispute in progress',
    low: 'Minor legal inquiry'
  }
];

// Real-Time Situation Map Data
export const situationMapData = [
  { country: 'Nigeria', code: 'NG', riskLevel: 'high', politicalRisk: 65, logisticsDisruptions: 3, customsDelays: 2, networkOutages: 1 },
  { country: 'Kenya', code: 'KE', riskLevel: 'medium', politicalRisk: 45, logisticsDisruptions: 1, customsDelays: 0, networkOutages: 0 },
  { country: 'Ghana', code: 'GH', riskLevel: 'medium', politicalRisk: 40, logisticsDisruptions: 0, customsDelays: 1, networkOutages: 0 },
  { country: 'South Africa', code: 'ZA', riskLevel: 'low', politicalRisk: 35, logisticsDisruptions: 0, customsDelays: 0, networkOutages: 0 },
  { country: 'Tanzania', code: 'TZ', riskLevel: 'medium', politicalRisk: 50, logisticsDisruptions: 2, customsDelays: 1, networkOutages: 0 },
  { country: 'Ethiopia', code: 'ET', riskLevel: 'high', politicalRisk: 75, logisticsDisruptions: 4, customsDelays: 2, networkOutages: 1 },
  { country: 'Cameroon', code: 'CM', riskLevel: 'medium', politicalRisk: 55, logisticsDisruptions: 1, customsDelays: 1, networkOutages: 0 },
  { country: 'Rwanda', code: 'RW', riskLevel: 'low', politicalRisk: 25, logisticsDisruptions: 0, customsDelays: 0, networkOutages: 0 },
  { country: 'Mauritius', code: 'MU', riskLevel: 'low', politicalRisk: 20, logisticsDisruptions: 0, customsDelays: 0, networkOutages: 0 },
  { country: 'Senegal', code: 'SN', riskLevel: 'low', politicalRisk: 30, logisticsDisruptions: 0, customsDelays: 0, networkOutages: 0 }
];

// Crisis Response Playbooks
export const crisisPlaybooks = [
  {
    id: 1,
    name: 'Data Breach',
    category: 'Cybersecurity',
    steps: [
      'Immediately isolate affected systems',
      'Notify security team and CTO',
      'Assess scope of breach',
      'Notify affected users within 72 hours',
      'Engage legal and PR teams',
      'Document all actions for compliance'
    ],
    requiredTeams: ['Security Team', 'Legal', 'PR', 'CTO'],
    communications: ['Internal alert', 'User notification', 'Regulatory filing'],
    expectedResolution: '24-48 hours',
    severity: 'critical'
  },
  {
    id: 2,
    name: 'Fraud Spike',
    category: 'Fraud',
    steps: [
      'Activate enhanced fraud monitoring',
      'Review flagged transactions',
      'Temporarily restrict high-risk accounts',
      'Notify fraud prevention team',
      'Update fraud detection rules',
      'Monitor for 24 hours'
    ],
    requiredTeams: ['Fraud Prevention', 'Risk Management'],
    communications: ['Internal alert', 'User communication if needed'],
    expectedResolution: '4-8 hours',
    severity: 'high'
  },
  {
    id: 3,
    name: 'Payment Gateway Failure',
    category: 'Payments',
    steps: [
      'Switch to backup payment processor',
      'Notify payment operations team',
      'Monitor transaction success rates',
      'Communicate with affected users',
      'Work with payment provider to resolve',
      'Test and verify resolution'
    ],
    requiredTeams: ['Tech Operations', 'Payment Operations', 'Customer Support'],
    communications: ['Internal alert', 'User notification', 'Status page update'],
    expectedResolution: '2-4 hours',
    severity: 'critical'
  },
  {
    id: 4,
    name: 'Shipment Delay > 48h',
    category: 'Logistics',
    steps: [
      'Identify affected shipments',
      'Contact logistics partner',
      'Arrange alternative routing if possible',
      'Notify affected buyers',
      'Update shipment tracking',
      'Escalate to logistics manager if needed'
    ],
    requiredTeams: ['Logistics Team', 'Customer Support'],
    communications: ['Buyer notification', 'Internal update'],
    expectedResolution: '24-72 hours',
    severity: 'high'
  },
  {
    id: 5,
    name: 'Customs Hold > 72h',
    category: 'Logistics',
    steps: [
      'Contact customs broker',
      'Review documentation requirements',
      'Engage local customs officials',
      'Provide additional documentation if needed',
      'Monitor daily for updates',
      'Consider alternative entry point'
    ],
    requiredTeams: ['Logistics Team', 'Compliance'],
    communications: ['Seller notification', 'Internal update'],
    expectedResolution: '3-7 days',
    severity: 'medium'
  },
  {
    id: 6,
    name: 'PR Scandal',
    category: 'PR Crisis',
    steps: [
      'Assess public impact',
      'Prepare factual response',
      'Engage PR team immediately',
      'Coordinate with legal team',
      'Issue public statement if needed',
      'Monitor social media and news'
    ],
    requiredTeams: ['PR Team', 'Legal', 'CEO/COO'],
    communications: ['Public statement', 'Internal communication', 'Social media response'],
    expectedResolution: '24-48 hours',
    severity: 'critical'
  },
  {
    id: 7,
    name: 'Bribery Allegation',
    category: 'Bribery/Corruption',
    steps: [
      'Suspend related accounts immediately',
      'Launch internal investigation',
      'Notify compliance officer',
      'Document all evidence',
      'Engage legal counsel',
      'Prepare transparency report'
    ],
    requiredTeams: ['Compliance Team', 'Legal', 'Internal Audit'],
    communications: ['Internal alert', 'Regulatory notification if required'],
    expectedResolution: '48-72 hours',
    severity: 'high'
  },
  {
    id: 8,
    name: 'Political Instability',
    category: 'Political Risk',
    steps: [
      'Assess risk to operations',
      'Monitor situation closely',
      'Notify risk management team',
      'Consider pausing operations if critical',
      'Update travel advisories',
      'Communicate with local partners'
    ],
    requiredTeams: ['Risk Management', 'Operations', 'Local Partners'],
    communications: ['Internal alert', 'Partner communication'],
    expectedResolution: 'Ongoing monitoring',
    severity: 'medium'
  },
  {
    id: 9,
    name: 'Natural Disaster',
    category: 'Logistics',
    steps: [
      'Assess impact on shipments',
      'Contact affected logistics partners',
      'Reroute shipments if possible',
      'Notify affected customers',
      'Activate disaster recovery plan',
      'Monitor situation for updates'
    ],
    requiredTeams: ['Logistics Team', 'Customer Support', 'Risk Management'],
    communications: ['Customer notification', 'Internal update'],
    expectedResolution: '48-96 hours',
    severity: 'high'
  }
];

// Escalation Rules
export const escalationRules = [
  {
    level: 1,
    name: 'Operational',
    responseTime: '24h',
    examples: ['Logistics delays', 'Seller disputes', 'Minor payment issues'],
    contacts: ['Operations Manager', 'Customer Support Lead']
  },
  {
    level: 2,
    name: 'Financial/Regulatory',
    responseTime: '4h',
    threshold: '>$50k',
    examples: ['Payment issues', 'Compliance flags', 'Regulatory inquiries'],
    contacts: ['CFO', 'Compliance Officer', 'Legal Counsel']
  },
  {
    level: 3,
    name: 'Critical',
    responseTime: '1h',
    examples: ['Data breach', 'Platform outage', 'Public scandal'],
    contacts: ['CEO', 'CTO', 'COO', 'CISO']
  }
];

// Emergency Contacts
export const emergencyContacts = {
  internal: [
    { name: 'CEO', role: 'Chief Executive Officer', phone: '+233 24 111 1111', email: 'ceo@afrikoni.com' },
    { name: 'CTO', role: 'Chief Technology Officer', phone: '+233 24 222 2222', email: 'cto@afrikoni.com' },
    { name: 'COO', role: 'Chief Operating Officer', phone: '+233 24 333 3333', email: 'coo@afrikoni.com' },
    { name: 'CISO', role: 'Chief Information Security Officer', phone: '+233 24 444 4444', email: 'ciso@afrikoni.com' },
    { name: 'Compliance Officer', role: 'Head of Compliance', phone: '+233 24 555 5555', email: 'compliance@afrikoni.com' }
  ],
  external: [
    { name: 'Legal Counsel', firm: 'Afrikoni Legal Partners', phone: '+233 24 666 6666', email: 'legal@afrikoni.com' },
    { name: 'PR Agency', firm: 'Africa Communications Group', phone: '+233 24 777 7777', email: 'pr@afrikoni.com' },
    { name: 'Cybersecurity Firm', firm: 'Secure Africa Inc', phone: '+233 24 888 8888', email: 'security@afrikoni.com' }
  ],
  regulatory: [
    { name: 'Data Protection Authority', country: 'Ghana', phone: '+233 302 123 456', email: 'dpa@ghana.gov.gh' },
    { name: 'Financial Services Authority', country: 'Mauritius', phone: '+230 403 7000', email: 'fsa@mauritius.gov.mu' }
  ]
};

// Communications Templates
export const communicationTemplates = {
  internal: [
    {
      type: 'Incident Alert',
      template: 'ALERT: [INCIDENT_TYPE] detected. Severity: [SEVERITY]. Assigned team: [TEAM]. ETA: [ETA].'
    },
    {
      type: 'Task Assignment',
      template: 'TASK: [TASK_DESCRIPTION] assigned to [TEAM]. Priority: [PRIORITY]. Due: [DEADLINE].'
    },
    {
      type: 'Status Update',
      template: 'UPDATE: [INCIDENT_ID] - Status: [STATUS]. Progress: [PROGRESS]%. Next update: [TIME].'
    }
  ],
  public: [
    {
      type: 'Service Disruption',
      template: 'We are currently experiencing [ISSUE_DESCRIPTION]. We are working to resolve this and will provide updates. Expected resolution: [ETA].'
    },
    {
      type: 'Security Incident',
      template: 'We have detected a potential security issue and are investigating. User data security is our priority. We will provide updates as available.'
    },
    {
      type: 'Logistics Delay',
      template: 'Some shipments may experience delays due to [REASON]. We are working with partners to minimize impact. Affected customers will be notified.'
    }
  ]
};

// Recovery Timelines & SLA Tracker
export const recoveryTimelines = [
  {
    incidentId: 'CRISIS-2024-001',
    incidentName: 'Payment Gateway Failure',
    slaTarget: '4 hours',
    currentProgress: 45,
    blockingIssues: ['Third-party provider investigation in progress'],
    teamAssigned: 'Tech Operations',
    eta: '2024-02-07T18:00:00Z',
    status: 'in_progress'
  },
  {
    incidentId: 'CRISIS-2024-002',
    incidentName: 'Logistics Route Blockage',
    slaTarget: '24 hours',
    currentProgress: 30,
    blockingIssues: ['Alternative route being secured', 'Partner coordination needed'],
    teamAssigned: 'Logistics Team',
    eta: '2024-02-08T10:00:00Z',
    status: 'in_progress'
  },
  {
    incidentId: 'CRISIS-2024-003',
    incidentName: 'Data Breach Attempt',
    slaTarget: '2 hours',
    currentProgress: 60,
    blockingIssues: [],
    teamAssigned: 'Security Team',
    eta: '2024-02-07T17:00:00Z',
    status: 'in_progress'
  },
  {
    incidentId: 'CRISIS-2024-004',
    incidentName: 'Bribery Allegation',
    slaTarget: '48 hours',
    currentProgress: 25,
    blockingIssues: ['Investigation in progress', 'Evidence collection'],
    teamAssigned: 'Compliance Team',
    eta: '2024-02-08T16:00:00Z',
    status: 'in_progress'
  }
];

