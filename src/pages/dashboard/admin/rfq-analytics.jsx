import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { RFQ_STATUS } from '@/constants/status';

export default function RFQAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    posted: 0,
    matched: 0,
    converted: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const { user, role } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user || role !== 'admin') {
        toast.error('Admin access required');
        navigate('/dashboard');
        return;
      }

      // RFQs Posted (all RFQs)
      const { count: postedCount } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true });

      // RFQs Matched (status = 'matched')
      const { count: matchedCount } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('status', RFQ_STATUS.MATCHED);

      // RFQs Converted (status = 'awarded' - means order was created)
      const { count: convertedCount } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('status', RFQ_STATUS.AWARDED);

      // Total Value (sum of target_price from awarded RFQs)
      const { data: awardedRFQs } = await supabase
        .from('rfqs')
        .select('target_price')
        .eq('status', RFQ_STATUS.AWARDED);

      const totalValue = awardedRFQs?.reduce((sum, rfq) => {
        return sum + (parseFloat(rfq.target_price) || 0);
      }, 0) || 0;

      setAnalytics({
        posted: postedCount || 0,
        matched: matchedCount || 0,
        converted: convertedCount || 0,
        totalValue: totalValue
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const conversionRate = analytics.posted > 0 
    ? ((analytics.converted / analytics.posted) * 100).toFixed(1)
    : '0.0';

  const matchRate = analytics.posted > 0
    ? ((analytics.matched / analytics.posted) * 100).toFixed(1)
    : '0.0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut">RFQ Analytics</h1>
          <p className="text-afrikoni-deep mt-1">
            Simple metrics for RFQ performance
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* RFQs Posted */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">RFQs Posted</p>
                  <p className="text-3xl font-bold text-afrikoni-chestnut">
                    {isLoading ? '...' : analytics.posted}
                  </p>
                </div>
                <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-afrikoni-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFQs Matched */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">RFQs Matched</p>
                  <p className="text-3xl font-bold text-afrikoni-chestnut">
                    {isLoading ? '...' : analytics.matched}
                  </p>
                  <p className="text-xs text-afrikoni-deep/70 mt-1">
                    {matchRate}% match rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFQs Converted */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">RFQs Converted</p>
                  <p className="text-3xl font-bold text-afrikoni-chestnut">
                    {isLoading ? '...' : analytics.converted}
                  </p>
                  <p className="text-xs text-afrikoni-deep/70 mt-1">
                    {conversionRate}% conversion rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Value */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-afrikoni-chestnut">
                    {isLoading ? '...' : `$${analytics.totalValue.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-afrikoni-deep/70 mt-1">
                    From converted RFQs
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="border-afrikoni-gold/30">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-afrikoni-cream/30 rounded-lg">
                <span className="text-afrikoni-deep">Match Rate</span>
                <span className="text-lg font-semibold text-afrikoni-chestnut">
                  {matchRate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-afrikoni-cream/30 rounded-lg">
                <span className="text-afrikoni-deep">Conversion Rate</span>
                <span className="text-lg font-semibold text-afrikoni-chestnut">
                  {conversionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-afrikoni-cream/30 rounded-lg">
                <span className="text-afrikoni-deep">Average Value per Converted RFQ</span>
                <span className="text-lg font-semibold text-afrikoni-chestnut">
                  {analytics.converted > 0 
                    ? `$${Math.round(analytics.totalValue / analytics.converted).toLocaleString()}`
                    : '$0'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

