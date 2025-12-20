/**
 * Admin Alerts Panel
 * Shows high-risk suppliers and high-value deals needing attention
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, Shield, Clock, X } from 'lucide-react';
import { useHighRiskCompanies, useHighValueDealsNeedingAttention } from '@/hooks/useTradeIntelligence';
import { useNavigate } from 'react-router-dom';

export default function AdminAlertsPanel() {
  const navigate = useNavigate();
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  
  const { data: highRiskCompanies, loading: riskLoading } = useHighRiskCompanies();
  const { data: highValueDeals, loading: dealsLoading } = useHighValueDealsNeedingAttention();

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const activeHighRisk = highRiskCompanies?.filter(
    company => !dismissedAlerts.has(`risk-${company.company_id}`)
  ) || [];

  const activeHighValue = highValueDeals?.filter(
    deal => !dismissedAlerts.has(`deal-${deal.company_id}`)
  ) || [];

  const totalAlerts = activeHighRisk.length + activeHighValue.length;

  if (riskLoading || dealsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-afrikoni-deep/70">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-semibold text-green-700">All Clear</p>
            <p className="text-sm mt-2">No high-risk suppliers or deals requiring attention.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Alerts & Notifications
          {totalAlerts > 0 && (
            <Badge className="bg-red-100 text-red-700 ml-2">
              {totalAlerts} {totalAlerts === 1 ? 'alert' : 'alerts'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High-Risk Suppliers */}
        {activeHighRisk.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-afrikoni-chestnut mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              High-Risk Suppliers ({activeHighRisk.length})
            </h4>
            <div className="space-y-2">
              {activeHighRisk.slice(0, 5).map((company) => (
                <div 
                  key={company.company_id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-red-900">
                        {company.company_name}
                      </span>
                      <Badge className="bg-red-200 text-red-900">
                        {company.overall_risk_level} Risk
                      </Badge>
                    </div>
                    <div className="text-xs text-red-700 space-y-1">
                      <div>Response: {company.response_delay_risk} • Disputes: {company.dispute_risk}</div>
                      {company.total_disputes > 0 && (
                        <div>{company.total_disputes} {company.total_disputes === 1 ? 'dispute' : 'disputes'}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/admin/supplier-management?company=${company.company_id}`)}
                    >
                      Review
                    </Button>
                    <button
                      onClick={() => handleDismiss(`risk-${company.company_id}`)}
                      className="p-1 hover:bg-red-100 rounded transition"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High-Value Deals Needing Attention */}
        {activeHighValue.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-afrikoni-chestnut mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              High-Value Deals Needing Attention ({activeHighValue.length})
            </h4>
            <div className="space-y-2">
              {activeHighValue.slice(0, 5).map((deal) => (
                <div 
                  key={deal.company_id}
                  className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-orange-900">
                        {deal.company_name}
                      </span>
                      <Badge className="bg-orange-200 text-orange-900">
                        {deal.high_value_deals} high-value {deal.high_value_deals === 1 ? 'deal' : 'deals'}
                      </Badge>
                    </div>
                    <div className="text-xs text-orange-700">
                      Risk Level: {deal.overall_risk_level}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/admin/trade-intelligence?tab=risk&company=${deal.company_id}`)}
                    >
                      Review
                    </Button>
                    <button
                      onClick={() => handleDismiss(`deal-${deal.company_id}`)}
                      className="p-1 hover:bg-orange-100 rounded transition"
                    >
                      <X className="w-4 h-4 text-orange-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

