// AI Risk Score Service - Converted from Base44

export const AIRiskScoreService = {
  calculateTrustScore: async (companyData) => {
    // Calculate trust score based on various factors
    let score = 50; // Base score

    if (companyData.verified) score += 20;
    if (companyData.total_orders > 10) score += 15;
    if (companyData.total_orders > 50) score += 10;
    if (companyData.response_rate > 80) score += 10;
    if (companyData.year_established) {
      const years = new Date().getFullYear() - parseInt(companyData.year_established);
      if (years > 5) score += 5;
    }

    return Math.min(100, score);
  },

  assessTransactionRisk: async (orderData) => {
    // Assess risk for a transaction
    let riskLevel = 'low';
    let riskScore = 0;

    if (orderData.total_amount > 10000) riskScore += 20;
    if (!orderData.seller_company?.verified) riskScore += 30;
    if (orderData.seller_company?.trust_score < 60) riskScore += 25;

    if (riskScore > 50) riskLevel = 'high';
    else if (riskScore > 25) riskLevel = 'medium';

    return {
      riskLevel,
      riskScore,
      recommendations: riskLevel === 'high' ? ['Use escrow service', 'Verify supplier credentials'] : []
    };
  }
};

