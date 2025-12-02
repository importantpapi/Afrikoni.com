/**
 * Afrikoni Shield™ - Audit Log System Demo Data
 * Comprehensive audit log entries for enterprise-grade logging system
 */

// Generate SHA-256 hash (mock)
const generateHash = (data) => {
  // Mock hash generation - in production, this would be actual SHA-256
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
};

// Audit Log Overview KPIs
export const auditKPIs = {
  totalEvents30Days: 12450,
  highRiskEvents: 23,
  userActions: 8920,
  systemActions: 3120,
  complianceEvents: 410,
  failedAttempts: 89
};

// Comprehensive Audit Log Entries
export const auditLogs = [
  {
    id: 'AUDIT-2024-001',
    timestamp: '2024-02-07T15:45:23Z',
    actor: 'admin@afrikoni.com',
    actorType: 'Admin',
    actionType: 'Login',
    target: 'User Session',
    metadata: {
      ip: '197.210.52.143',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      sessionId: 'sess_abc123xyz',
      twoFactorEnabled: true,
      loginMethod: 'password'
    },
    ip: '197.210.52.143',
    country: 'Ghana',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-001', timestamp: '2024-02-07T15:45:23Z' }),
    riskLevel: 'low',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-002',
    timestamp: '2024-02-07T15:42:10Z',
    actor: 'system',
    actorType: 'System',
    actionType: 'Failed Login Attempt',
    target: 'user@example.com',
    metadata: {
      ip: '41.203.12.89',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      reason: 'Invalid password',
      attempts: 3,
      blocked: true
    },
    ip: '41.203.12.89',
    country: 'Nigeria',
    status: 'failed',
    hash: generateHash({ id: 'AUDIT-2024-002', timestamp: '2024-02-07T15:42:10Z' }),
    riskLevel: 'high',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-003',
    timestamp: '2024-02-07T15:38:55Z',
    actor: 'supplier_12345',
    actorType: 'Supplier',
    actionType: 'Document Upload',
    target: 'Business License',
    metadata: {
      fileId: 'file_xyz789',
      fileName: 'business_license.pdf',
      fileSize: 2456789,
      fileType: 'application/pdf',
      verificationStatus: 'pending',
      documentType: 'business_license'
    },
    ip: '102.89.45.12',
    country: 'Kenya',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-003', timestamp: '2024-02-07T15:38:55Z' }),
    riskLevel: 'low',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-004',
    timestamp: '2024-02-07T15:35:20Z',
    actor: 'compliance_system',
    actorType: 'System',
    actionType: 'KYC Check',
    target: 'supplier_12345',
    metadata: {
      checkType: 'identity_verification',
      result: 'passed',
      confidence: 0.95,
      checksPerformed: ['identity', 'address', 'business_registration'],
      riskScore: 12
    },
    ip: 'N/A',
    country: 'System',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-004', timestamp: '2024-02-07T15:35:20Z' }),
    riskLevel: 'low',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-005',
    timestamp: '2024-02-07T15:30:15Z',
    actor: 'fraud_detection',
    actorType: 'System',
    actionType: 'AML Alert',
    target: 'transaction_txn_456789',
    metadata: {
      alertType: 'suspicious_transaction',
      amount: 50000,
      currency: 'USD',
      reason: 'Unusual transaction pattern',
      flaggedBy: 'ml_model_v2',
      severity: 'high',
      actionTaken: 'transaction_held'
    },
    ip: 'N/A',
    country: 'System',
    status: 'warning',
    hash: generateHash({ id: 'AUDIT-2024-005', timestamp: '2024-02-07T15:30:15Z' }),
    riskLevel: 'high',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-006',
    timestamp: '2024-02-07T15:25:42Z',
    actor: 'buyer_67890',
    actorType: 'Buyer',
    actionType: 'Product Update',
    target: 'product_prod_123',
    metadata: {
      productId: 'prod_123',
      changes: {
        price: { from: 100, to: 120 },
        stock: { from: 50, to: 45 }
      },
      updatedBy: 'buyer_67890',
      previousVersion: 'v1.2.3'
    },
    ip: '196.201.214.56',
    country: 'South Africa',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-006', timestamp: '2024-02-07T15:25:42Z' }),
    riskLevel: 'low',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-007',
    timestamp: '2024-02-07T15:20:30Z',
    actor: 'buyer_67890',
    actorType: 'Buyer',
    actionType: 'Order Creation',
    target: 'order_ord_789',
    metadata: {
      orderId: 'ord_789',
      totalAmount: 1250.00,
      currency: 'USD',
      items: 3,
      paymentMethod: 'escrow',
      shippingAddress: 'Lagos, Nigeria'
    },
    ip: '196.201.214.56',
    country: 'South Africa',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-007', timestamp: '2024-02-07T15:20:30Z' }),
    riskLevel: 'low',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-008',
    timestamp: '2024-02-07T15:15:18Z',
    actor: 'payment_gateway',
    actorType: 'API',
    actionType: 'Payment Attempt',
    target: 'payment_pay_456',
    metadata: {
      paymentId: 'pay_456',
      amount: 1250.00,
      currency: 'USD',
      method: 'card',
      cardLast4: '4242',
      gateway: 'stripe',
      result: 'success',
      transactionId: 'txn_stripe_789'
    },
    ip: 'N/A',
    country: 'System',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-008', timestamp: '2024-02-07T15:15:18Z' }),
    riskLevel: 'low',
    eventSource: 'api'
  },
  {
    id: 'AUDIT-2024-009',
    timestamp: '2024-02-07T15:10:05Z',
    actor: 'escrow_system',
    actorType: 'System',
    actionType: 'Escrow Release',
    target: 'escrow_esc_123',
    metadata: {
      escrowId: 'esc_123',
      orderId: 'ord_789',
      amount: 1250.00,
      currency: 'USD',
      releaseReason: 'delivery_confirmed',
      releasedTo: 'supplier_12345',
      confirmationCode: 'CONF_ABC123'
    },
    ip: 'N/A',
    country: 'System',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-009', timestamp: '2024-02-07T15:10:05Z' }),
    riskLevel: 'low',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-010',
    timestamp: '2024-02-07T15:05:50Z',
    actor: 'logistics_system',
    actorType: 'System',
    actionType: 'Shipment Delay',
    target: 'shipment_ship_456',
    metadata: {
      shipmentId: 'ship_456',
      orderId: 'ord_789',
      delayReason: 'customs_hold',
      delayHours: 48,
      estimatedNewDelivery: '2024-02-09T15:05:50Z',
      affectedCountries: ['Nigeria', 'Ghana']
    },
    ip: 'N/A',
    country: 'System',
    status: 'warning',
    hash: generateHash({ id: 'AUDIT-2024-010', timestamp: '2024-02-07T15:05:50Z' }),
    riskLevel: 'medium',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-011',
    timestamp: '2024-02-07T15:00:30Z',
    actor: 'compliance_officer',
    actorType: 'Admin',
    actionType: 'Compliance Action',
    target: 'supplier_12345',
    metadata: {
      action: 'kyc_manual_review',
      reason: 'document_discrepancy',
      reviewedBy: 'compliance_officer',
      decision: 'approved_with_conditions',
      notes: 'Additional documentation required'
    },
    ip: '197.210.52.143',
    country: 'Ghana',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-011', timestamp: '2024-02-07T15:00:30Z' }),
    riskLevel: 'medium',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-012',
    timestamp: '2024-02-07T14:55:15Z',
    actor: 'anti_corruption_system',
    actorType: 'System',
    actionType: 'Anti-Corruption Flag',
    target: 'transaction_txn_789012',
    metadata: {
      flagType: 'suspicious_payment_pattern',
      transactionId: 'txn_789012',
      amount: 25000,
      currency: 'USD',
      redFlags: ['unusual_amount', 'off_hours_transaction', 'new_account'],
      actionTaken: 'flagged_for_review',
      assignedTo: 'compliance_team'
    },
    ip: 'N/A',
    country: 'System',
    status: 'warning',
    hash: generateHash({ id: 'AUDIT-2024-012', timestamp: '2024-02-07T14:55:15Z' }),
    riskLevel: 'high',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-013',
    timestamp: '2024-02-07T14:50:00Z',
    actor: 'api_client_v2',
    actorType: 'API',
    actionType: 'API Call',
    target: 'GET /api/v2/products',
    metadata: {
      endpoint: '/api/v2/products',
      method: 'GET',
      statusCode: 200,
      responseTime: 145,
      apiKey: 'ak_live_***',
      rateLimitRemaining: 950,
      requestId: 'req_abc123'
    },
    ip: '41.203.12.89',
    country: 'Nigeria',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-013', timestamp: '2024-02-07T14:50:00Z' }),
    riskLevel: 'low',
    eventSource: 'api'
  },
  {
    id: 'AUDIT-2024-014',
    timestamp: '2024-02-07T14:45:30Z',
    actor: 'admin@afrikoni.com',
    actorType: 'Admin',
    actionType: 'Role Change',
    target: 'user_user_456',
    metadata: {
      userId: 'user_456',
      previousRole: 'buyer',
      newRole: 'supplier',
      changedBy: 'admin@afrikoni.com',
      reason: 'account_upgrade_request',
      requiresApproval: false
    },
    ip: '197.210.52.143',
    country: 'Ghana',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-014', timestamp: '2024-02-07T14:45:30Z' }),
    riskLevel: 'medium',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-015',
    timestamp: '2024-02-07T14:40:20Z',
    actor: 'admin@afrikoni.com',
    actorType: 'Admin',
    actionType: 'Settings Update',
    target: 'System Settings',
    metadata: {
      settingCategory: 'security',
      settingKey: 'two_factor_required',
      previousValue: false,
      newValue: true,
      changedBy: 'admin@afrikoni.com',
      requiresRestart: false
    },
    ip: '197.210.52.143',
    country: 'Ghana',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-015', timestamp: '2024-02-07T14:40:20Z' }),
    riskLevel: 'medium',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-016',
    timestamp: '2024-02-07T14:35:10Z',
    actor: 'system',
    actorType: 'System',
    actionType: 'System Error',
    target: 'payment_processor',
    metadata: {
      errorType: 'connection_timeout',
      service: 'payment_processor',
      errorMessage: 'Connection timeout after 30s',
      severity: 'high',
      affectedUsers: 12,
      resolved: false,
      incidentId: 'CRISIS-2024-001'
    },
    ip: 'N/A',
    country: 'System',
    status: 'failed',
    hash: generateHash({ id: 'AUDIT-2024-016', timestamp: '2024-02-07T14:35:10Z' }),
    riskLevel: 'high',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-017',
    timestamp: '2024-02-07T14:30:45Z',
    actor: 'buyer_67890',
    actorType: 'Buyer',
    actionType: 'Document Upload',
    target: 'Address Proof',
    metadata: {
      fileId: 'file_abc456',
      fileName: 'utility_bill.pdf',
      fileSize: 1234567,
      fileType: 'application/pdf',
      verificationStatus: 'pending',
      documentType: 'address_proof'
    },
    ip: '196.201.214.56',
    country: 'South Africa',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-017', timestamp: '2024-02-07T14:30:45Z' }),
    riskLevel: 'low',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-018',
    timestamp: '2024-02-07T14:25:30Z',
    actor: 'fraud_detection',
    actorType: 'System',
    actionType: 'Fraud Alert',
    target: 'user_user_789',
    metadata: {
      alertType: 'account_takeover_attempt',
      userId: 'user_789',
      suspiciousActivities: ['unusual_login_location', 'rapid_password_change', 'unusual_transaction'],
      riskScore: 85,
      actionTaken: 'account_temporarily_locked',
      requiresReview: true
    },
    ip: 'N/A',
    country: 'System',
    status: 'warning',
    hash: generateHash({ id: 'AUDIT-2024-018', timestamp: '2024-02-07T14:25:30Z' }),
    riskLevel: 'high',
    eventSource: 'system'
  },
  {
    id: 'AUDIT-2024-019',
    timestamp: '2024-02-07T14:20:15Z',
    actor: 'supplier_12345',
    actorType: 'Supplier',
    actionType: 'Product Creation',
    target: 'product_prod_456',
    metadata: {
      productId: 'prod_456',
      productName: 'Organic Coffee Beans',
      category: 'Food & Beverages',
      price: 45.00,
      currency: 'USD',
      status: 'pending_approval'
    },
    ip: '102.89.45.12',
    country: 'Kenya',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-019', timestamp: '2024-02-07T14:20:15Z' }),
    riskLevel: 'low',
    eventSource: 'user'
  },
  {
    id: 'AUDIT-2024-020',
    timestamp: '2024-02-07T14:15:00Z',
    actor: 'api_client_v2',
    actorType: 'API',
    actionType: 'API Call',
    target: 'POST /api/v2/orders',
    metadata: {
      endpoint: '/api/v2/orders',
      method: 'POST',
      statusCode: 201,
      responseTime: 234,
      apiKey: 'ak_live_***',
      rateLimitRemaining: 949,
      requestId: 'req_def456'
    },
    ip: '41.203.12.89',
    country: 'Nigeria',
    status: 'success',
    hash: generateHash({ id: 'AUDIT-2024-020', timestamp: '2024-02-07T14:15:00Z' }),
    riskLevel: 'low',
    eventSource: 'api'
  }
];

// Integrity Verification Data
export const integrityData = {
  algorithm: 'SHA-256',
  lastCheck: '2024-02-07T16:00:00Z',
  status: 'verified',
  totalLogs: auditLogs.length,
  tamperedLogs: 0,
  verificationMessage: 'No tampering detected. All logs are intact and immutable.'
};

// Action Type Categories
export const actionCategories = [
  'Authentication',
  'Document Management',
  'KYC/AML',
  'Fraud Detection',
  'Product Management',
  'Order Management',
  'Payment Processing',
  'Escrow Management',
  'Logistics',
  'Compliance',
  'Anti-Corruption',
  'System Operations',
  'API Calls',
  'User Management',
  'Settings'
];

// Actor Types
export const actorTypes = ['Admin', 'Buyer', 'Supplier', 'System', 'API'];

// Risk Levels
export const riskLevels = ['low', 'medium', 'high', 'critical'];

// Event Sources
export const eventSources = ['user', 'system', 'api'];

