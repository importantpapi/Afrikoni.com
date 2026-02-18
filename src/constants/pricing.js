/**
 * AFRIKONI PRICING CONSTANTS
 *
 * Designed for African market realities:
 * - Low margins (15-25% for most SMEs)
 * - Cash flow sensitivity (1-2 month buffer)
 * - High fraud risk (15-25% of cross-border deals)
 * - Price sensitivity (must be <5% to feel fair)
 *
 * Philosophy: "We only win when you win"
 */

// =============================================================================
// TRANSACTION FEES (Afrikoni Shield Protection)
// =============================================================================
// These fees are SUCCESS-BASED - only charged when deal completes
//
// IMPORTANT: The database trigger `compute_trade_revenue_ledger()` enforces
// a flat 8% commission rate on all escrow payments (server-side override).
// The tiered rates below are the PLANNED future model once volume-based
// pricing is implemented. For now, all trades are charged 8%.
//
// Current server-enforced rate: 8% (see 20260213_enterprise_revenue.sql)

export const SERVER_ENFORCED_RATE = 0.08; // 8% — canonical rate

export const TRANSACTION_FEES = {
  // Under $1,000: 4% (minimum $20) — PLANNED, currently 8%
  TIER_1: {
    maxAmount: 1000,
    rate: 0.04,
    minimum: 20,
    label: 'Small Trade',
  },
  // $1,000 - $10,000: 3.5% — PLANNED, currently 8%
  TIER_2: {
    maxAmount: 10000,
    rate: 0.035,
    minimum: null,
    label: 'Standard Trade',
  },
  // $10,000 - $50,000: 3% — PLANNED, currently 8%
  TIER_3: {
    maxAmount: 50000,
    rate: 0.03,
    minimum: null,
    label: 'Growth Trade',
  },
  // $50,000+: 2.5% (negotiable for enterprise) — PLANNED, currently 8%
  TIER_4: {
    maxAmount: Infinity,
    rate: 0.025,
    minimum: null,
    label: 'Enterprise Trade',
  },
};

/**
 * Calculate transaction fee based on deal size
 * @param {number} amount - Deal amount in USD
 * @returns {object} { rate, fee, tier }
 */
export function calculateTransactionFee(amount) {
  // Always use server-enforced flat 8% rate
  const rate = SERVER_ENFORCED_RATE;
  const fee = Math.round(amount * rate * 100) / 100;

  return {
    rate,
    ratePercent: '8.0%',
    fee,
    tier: 'Standard',
    netToSeller: Math.round((amount - fee) * 100) / 100,
  };
}

// =============================================================================
// BUYER SUBSCRIPTION PLANS
// =============================================================================
// Buyers pay for enhanced access, not for basic trade

export const BUYER_PLANS = {
  FREE: {
    id: 'buyer_free',
    name: 'Afrikoni Free',
    price: 0,
    currency: 'USD',
    interval: 'forever',
    rfqLimit: 3, // 3 RFQs per month
    messageLimit: 10, // 10 messages per month
    features: [
      'Browse verified suppliers',
      'Search products & categories',
      '3 RFQs per month',
      '10 messages per month',
      'Basic Afrikoni Shield protection',
      'Standard support',
    ],
    limitations: [
      'Limited RFQs',
      'Limited messaging',
      'Standard matching',
    ],
    cta: 'Start Free',
    popular: false,
  },
  PRO: {
    id: 'buyer_pro',
    name: 'Afrikoni Pro',
    price: 29,
    currency: 'USD',
    interval: 'month',
    rfqLimit: null, // Unlimited
    messageLimit: null, // Unlimited
    features: [
      'Everything in Free',
      'Unlimited RFQs',
      'Unlimited messaging',
      'Priority supplier matching',
      'Price intelligence & benchmarks',
      'Supplier comparison tools',
      'Email support',
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    popular: true,
    badge: 'Most Popular',
  },
  BUSINESS: {
    id: 'buyer_business',
    name: 'Afrikoni Business',
    price: 99,
    currency: 'USD',
    interval: 'month',
    rfqLimit: null,
    messageLimit: null,
    features: [
      'Everything in Pro',
      'Bulk RFQ management',
      'API access',
      'Custom supplier vetting',
      'Dedicated account manager',
      'Priority support (4hr response)',
      'Custom reports & analytics',
      'Multi-user accounts',
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false,
    badge: 'Enterprise',
  },
};

// =============================================================================
// SUPPLIER SUBSCRIPTION PLANS
// =============================================================================
// Suppliers pay for visibility, not for basic listing

export const SUPPLIER_PLANS = {
  STARTER: {
    id: 'supplier_starter',
    name: 'Afrikoni Starter',
    price: 0,
    currency: 'USD',
    interval: 'forever',
    transactionFee: 0.04, // 4% on completed deals
    productLimit: 10,
    features: [
      'Basic product listing',
      'Up to 10 products',
      'Standard search ranking',
      'Basic analytics',
      'RFQ notifications',
      'Standard support',
    ],
    limitations: [
      '10 product limit',
      '4% success fee',
      'Standard ranking',
    ],
    cta: 'Start Selling Free',
    popular: false,
  },
  GROWTH: {
    id: 'supplier_growth',
    name: 'Afrikoni Growth',
    price: 29,
    currency: 'USD',
    interval: 'month',
    transactionFee: 0.03, // 3% on completed deals
    productLimit: null, // Unlimited
    features: [
      'Everything in Starter',
      'Unlimited products',
      '2x search visibility',
      '3% success fee (save 25%)',
      'Full analytics dashboard',
      'Priority RFQ matching',
      'Email support',
    ],
    limitations: [],
    cta: 'Upgrade to Growth',
    popular: true,
    badge: 'Best Value',
  },
  ELITE: {
    id: 'supplier_elite',
    name: 'Afrikoni Elite',
    price: 99,
    currency: 'USD',
    interval: 'month',
    transactionFee: 0.02, // 2% on completed deals
    productLimit: null,
    features: [
      'Everything in Growth',
      'Top search visibility (3x)',
      'Verified Elite badge',
      '2% success fee (save 50%)',
      'Featured in category pages',
      'Priority customer support',
      'Dedicated account manager',
      'Custom storefront branding',
    ],
    limitations: [],
    cta: 'Go Elite',
    popular: false,
    badge: 'Premium',
  },
};

// =============================================================================
// VERIFICATION FEES
// =============================================================================
// Verification builds trust - free standard, paid for speed

export const VERIFICATION_FEES = {
  STANDARD: {
    id: 'verification_standard',
    name: 'Standard Verification',
    price: 0,
    currency: 'USD',
    timeline: '5-7 business days',
    features: [
      'Document verification',
      'Business license check',
      'Basic verification badge',
    ],
    cta: 'Start Verification',
  },
  FAST_TRACK: {
    id: 'verification_fast',
    name: 'Fast-Track Verification',
    price: 49,
    currency: 'USD',
    timeline: '24-48 hours',
    features: [
      'Everything in Standard',
      'Priority review queue',
      'Enhanced verification badge',
      'Faster buyer trust',
    ],
    cta: 'Get Fast-Track',
    popular: true,
  },
  PREMIUM: {
    id: 'verification_premium',
    name: 'Premium Verification',
    price: 149,
    currency: 'USD',
    timeline: '48-72 hours',
    features: [
      'Everything in Fast-Track',
      'On-site verification coordination',
      'Premium verified badge',
      '30-day featured listing',
      'Priority RFQ matching',
    ],
    cta: 'Get Premium',
  },
};

// =============================================================================
// LOGISTICS MARGINS
// =============================================================================
// We markup carrier rates - users get our bulk discount

export const LOGISTICS_MARGINS = {
  STANDARD: {
    id: 'logistics_standard',
    name: 'Standard Shipping',
    margin: 0.05, // 5% markup
    features: ['Real-time tracking', 'Basic insurance'],
  },
  PROTECTED: {
    id: 'logistics_protected',
    name: 'Protected Shipping',
    margin: 0.08, // 8% markup
    features: ['Real-time tracking', 'Full insurance', 'Customs support'],
  },
  EXPRESS: {
    id: 'logistics_express',
    name: 'Express Shipping',
    margin: 0.10, // 10% markup
    features: ['Priority handling', 'Full insurance', 'Customs support', 'Dedicated tracking'],
  },
};

// =============================================================================
// TRUST-BUILDING MESSAGES
// =============================================================================
// These messages make fees feel like protection, not extraction

export const TRUST_MESSAGES = {
  // For escrow/payment protection
  ESCROW: {
    short: 'Payment protected',
    medium: 'Your payment is protected until you confirm receipt',
    long: 'Your money stays secure in escrow. We only release payment to the supplier after you confirm you received your goods in good condition.',
  },

  // For success fees
  SUCCESS_FEE: {
    short: 'Pay only when you succeed',
    medium: 'We only earn when your deal succeeds',
    long: 'Zero upfront costs. We charge a small success fee only when your transaction completes successfully. If the deal doesn\'t close, you pay nothing.',
  },

  // For Afrikoni Shield
  SHIELD: {
    short: 'Protected by Afrikoni Shield',
    medium: 'Full protection included at no extra cost to buyers',
    long: 'Every transaction is protected by Afrikoni Shield: secure escrow, dispute resolution, fraud protection, and quality guarantee. Your satisfaction or your money back.',
  },

  // For verification
  VERIFICATION: {
    short: 'Verified supplier',
    medium: 'Business verified by Afrikoni',
    long: 'This supplier has been verified by Afrikoni. We checked their business documents, registration, and trading history to ensure they are legitimate.',
  },

  // For new users
  WELCOME: {
    short: 'Start free today',
    medium: 'Zero upfront costs - start trading now',
    long: 'Join thousands of African businesses trading safely. No credit card required. No hidden fees. Start trading in minutes.',
  },

  // For pricing transparency
  TRANSPARENT: {
    short: 'No hidden fees',
    medium: 'Transparent pricing - see exactly what you pay',
    long: 'We believe in complete transparency. You\'ll always see the exact fees before you commit. No surprises, no hidden charges, ever.',
  },
};

// =============================================================================
// SHIELD PROTECTION TIERS
// =============================================================================
// Afrikoni Shield is our Trade Assurance equivalent

export const SHIELD_PROTECTION = {
  BASIC: {
    name: 'Basic Shield',
    included: true, // Included in all transactions
    coverage: 1000, // Up to $1,000 coverage
    features: [
      'Secure escrow',
      'Basic dispute resolution',
      'Payment protection',
    ],
  },
  STANDARD: {
    name: 'Standard Shield',
    included: true, // Included in 3%+ fee tier
    coverage: 10000, // Up to $10,000 coverage
    features: [
      'Everything in Basic',
      'Full dispute resolution',
      '48-hour response guarantee',
      'Quality guarantee',
    ],
  },
  PREMIUM: {
    name: 'Premium Shield',
    included: true, // Included in higher tiers
    coverage: 50000, // Up to $50,000 coverage
    features: [
      'Everything in Standard',
      'Priority dispute resolution',
      '24-hour response guarantee',
      'Extended warranty option',
      'Dedicated case manager',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise Shield',
    included: false, // Custom pricing
    coverage: 'Unlimited',
    features: [
      'Everything in Premium',
      'Custom coverage limits',
      'Dedicated account team',
      'Custom SLAs',
      'Insurance certificates',
    ],
  },
};

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

export function formatPrice(amount, currency = 'USD') {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFeeRate(rate) {
  return (rate * 100).toFixed(1) + '%';
}

export function getPlanByTransactionSize(amount) {
  if (amount <= 1000) return 'Small Trade';
  if (amount <= 10000) return 'Standard Trade';
  if (amount <= 50000) return 'Growth Trade';
  return 'Enterprise Trade';
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  TRANSACTION_FEES,
  BUYER_PLANS,
  SUPPLIER_PLANS,
  VERIFICATION_FEES,
  LOGISTICS_MARGINS,
  TRUST_MESSAGES,
  SHIELD_PROTECTION,
  calculateTransactionFee,
  formatPrice,
  formatFeeRate,
  getPlanByTransactionSize,
};
