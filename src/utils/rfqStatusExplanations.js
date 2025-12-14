/**
 * RFQ Status Explanations for Buyers
 * Provides clear lifecycle visibility: current status, what it means, what's next
 */

import { RFQ_STATUS, RFQ_STATUS_LABELS } from '@/constants/status';

export const RFQ_STATUS_EXPLANATIONS = {
  [RFQ_STATUS.DRAFT]: {
    title: 'Draft',
    description: 'Your RFQ is saved but not yet submitted.',
    whatNext: 'Submit your RFQ to start the matching process.',
    icon: '📝'
  },
  [RFQ_STATUS.OPEN]: {
    title: 'Open',
    description: 'Your RFQ has been submitted and is publicly visible.',
    whatNext: 'Afrikoni will review your RFQ and match it with verified suppliers.',
    icon: '🔓'
  },
  [RFQ_STATUS.IN_REVIEW]: {
    title: 'In Review',
    description: 'Afrikoni is reviewing your RFQ to ensure all details are clear and complete.',
    whatNext: 'Our team will match your RFQ with verified suppliers who can fulfill your requirements. This typically takes 24-48 hours.',
    icon: '👀'
  },
  [RFQ_STATUS.MATCHED]: {
    title: 'Matched',
    description: 'Your RFQ has been matched with verified suppliers. They can now view your request and submit offers.',
    whatNext: 'Suppliers will submit quotes. You\'ll receive notifications when offers come in. Review and compare offers to make your decision.',
    icon: '✅'
  },
  [RFQ_STATUS.AWARDED]: {
    title: 'Awarded',
    description: 'You\'ve selected a supplier and awarded the RFQ. An order is being created.',
    whatNext: 'The order will be created and you can proceed with payment and logistics coordination.',
    icon: '🏆'
  },
  [RFQ_STATUS.CLOSED]: {
    title: 'Closed',
    description: 'This RFQ has been completed. The order has been fulfilled or cancelled.',
    whatNext: 'View your order history for details.',
    icon: '✔️'
  },
  [RFQ_STATUS.CANCELLED]: {
    title: 'Cancelled',
    description: 'This RFQ has been cancelled.',
    whatNext: 'You can create a new RFQ if needed.',
    icon: '❌'
  }
};

/**
 * Get status explanation for buyers
 * @param {string} status - RFQ status
 * @returns {object} Status explanation with title, description, whatNext, icon
 */
export function getRFQStatusExplanation(status) {
  return RFQ_STATUS_EXPLANATIONS[status] || {
    title: RFQ_STATUS_LABELS[status] || status,
    description: 'Your RFQ is being processed.',
    whatNext: 'We\'ll notify you of any updates.',
    icon: '📋'
  };
}

