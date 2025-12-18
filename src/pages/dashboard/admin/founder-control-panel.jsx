import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, 
  Users, Package, FileText, ArrowRight, Filter, Download, RefreshCw
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { getCommissionSummary } from '@/utils/commissionCalculator';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Founder Control Panel
 * Command center for managing ALL deals
 * One dashboard to rule them all
 */

export default function FounderControlPanel() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active' | 'all' | 'stalled'
  const [timeframe, setTimeframe] = useState('week'); // 'week' | 'month' | 'all'
  
  // Core metrics
  const [metrics, setMetrics] = useState({
    rfqsCreated: 0,
    rfqsMatched: 0,
    quotesSent: 0,
    dealsAccepted: 0,
    dealsCompleted: 0,
    dealsStalled: 0,
    revenue: 0,
    pendingRevenue: 0
  });

  // Deal pipeline
  const [pipeline, setPipeline] = useState([]);
  const [stalledDeals, setStalledDeals] = useState([]);
  const [commissionData, setCommissionData] = useState(null);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadPipeline(),
        loadStalledDeals(),
        loadCommissions()
      ]);
    } catch (error) {
      console.error('Error loading control panel data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    const timefilter = getTimeFilter(timeframe);

    // RFQs created
    const { count: rfqsCreated } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timefilter);

    // RFQs matched
    const { count: rfqsMatched } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'matched')
      .gte('created_at', timefilter);

    // Quotes sent
    const { count: quotesSent } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timefilter);

    // Deals accepted (orders created)
    const { count: dealsAccepted } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timefilter);

    // Deals completed
    const { count: dealsCompleted } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', timefilter);

    // Stalled deals (pending > 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: dealsStalled } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', sevenDaysAgo.toISOString());

    setMetrics(prev => ({
      ...prev,
      rfqsCreated: rfqsCreated || 0,
      rfqsMatched: rfqsMatched || 0,
      quotesSent: quotesSent || 0,
      dealsAccepted: dealsAccepted || 0,
      dealsCompleted: dealsCompleted || 0,
      dealsStalled: dealsStalled || 0
    }));
  };

  const loadPipeline = async () => {
    const { data, error } = await supabase
      .from('rfqs')
      .select(`
        *,
        buyer_company:buyer_company_id(id, company_name),
        quotes(
          id,
          supplier_company_id,
          status,
          created_at,
          supplier_company:supplier_company_id(company_name)
        )
      `)
      .in('status', ['open', 'in_review', 'matched', 'awarded'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading pipeline:', error);
      return;
    }

    setPipeline(data || []);
  };

  const loadStalledDeals = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer_company:buyer_company_id(company_name),
        seller_company:seller_company_id(company_name),
        rfq:rfq_id(title)
      `)
      .eq('status', 'pending')
      .lt('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error loading stalled deals:', error);
      return;
    }

    setStalledDeals(data || []);
  };

  const loadCommissions = async () => {
    try {
      const result = await getCommissionSummary(supabase, timeframe);
      if (result.success) {
        setCommissionData(result.summary);
        setMetrics(prev => ({
          ...prev,
          revenue: result.summary.earned.value,
          pendingRevenue: result.summary.pending.value
        }));
      }
    } catch (error) {
      // Commission table doesn't exist yet - skip for now
      console.log('Commission tracking not yet set up');
      setMetrics(prev => ({
        ...prev,
        revenue: 0,
        pendingRevenue: 0
      }));
    }
  };

  const getTimeFilter = (tf) => {
    const now = new Date();
    if (tf === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo.toISOString();
    } else if (tf === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo.toISOString();
    }
    return '2020-01-01';
  };

  const getConversionRate = (numerator, denominator) => {
    if (denominator === 0) return 0;
    return ((numerator / denominator) * 100).toFixed(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-chestnut">
              Founder Control Panel
            </h1>
            <p className="text-afrikoni-deep/70">Your deal factory command center</p>
          </div>
          <div className="flex gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-afrikoni-gold/30 rounded-md text-sm"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <Button size="sm" variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          <MetricCard
            title="RFQs Created"
            value={metrics.rfqsCreated}
            icon={FileText}
            color="blue"
            subtitle={`${metrics.rfqsMatched} matched`}
          />
          <MetricCard
            title="Quotes Sent"
            value={metrics.quotesSent}
            icon={Package}
            color="purple"
            subtitle={`${getConversionRate(metrics.quotesSent, metrics.rfqsMatched)}% of matched`}
          />
          <MetricCard
            title="Deals Accepted"
            value={metrics.dealsAccepted}
            icon={CheckCircle}
            color="green"
            subtitle={`${metrics.dealsCompleted} completed`}
          />
          <MetricCard
            title="Revenue (USD)"
            value={`$${metrics.revenue.toFixed(0)}`}
            icon={DollarSign}
            color="gold"
            subtitle={`$${metrics.pendingRevenue.toFixed(0)} pending`}
          />
        </div>

        {/* Conversion Funnel */}
        <Card className="border-afrikoni-gold/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-afrikoni-gold" />
              Deal Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FunnelStage
                label="RFQs Created"
                value={metrics.rfqsCreated}
                percentage={100}
                color="blue"
              />
              <FunnelStage
                label="RFQs Matched"
                value={metrics.rfqsMatched}
                percentage={getConversionRate(metrics.rfqsMatched, metrics.rfqsCreated)}
                color="purple"
              />
              <FunnelStage
                label="Quotes Sent"
                value={metrics.quotesSent}
                percentage={getConversionRate(metrics.quotesSent, metrics.rfqsMatched)}
                color="amber"
              />
              <FunnelStage
                label="Deals Accepted"
                value={metrics.dealsAccepted}
                percentage={getConversionRate(metrics.dealsAccepted, metrics.quotesSent)}
                color="green"
              />
              <FunnelStage
                label="Deals Completed"
                value={metrics.dealsCompleted}
                percentage={getConversionRate(metrics.dealsCompleted, metrics.dealsAccepted)}
                color="gold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Pipeline */}
        <Card className="border-afrikoni-gold/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Pipeline</CardTitle>
              <Badge>{pipeline.length} RFQs</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pipeline.length === 0 ? (
                <p className="text-center text-afrikoni-deep/60 py-8">
                  No active RFQs. Time to generate some leads!
                </p>
              ) : (
                pipeline.map(rfq => (
                  <PipelineItem key={rfq.id} rfq={rfq} onClick={() => navigate(`/dashboard/rfqs/${rfq.id}`)} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stalled Deals (ACTION REQUIRED) */}
        {stalledDeals.length > 0 && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Stalled Deals (Action Required)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stalledDeals.map(order => (
                  <StalledDealItem
                    key={order.id}
                    order={order}
                    onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <Card className={`border-${color}-200 bg-${color}-50/50`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-medium text-afrikoni-deep/70">{title}</span>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <p className="text-2xl font-bold text-afrikoni-chestnut mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-afrikoni-deep/60">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelStage({ label, value, percentage, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-afrikoni-chestnut">{label}</span>
          <span className="text-sm text-afrikoni-deep/70">{value} ({percentage}%)</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-500 transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PipelineItem({ rfq, onClick }) {
  const quotesCount = rfq.quotes?.length || 0;
  
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg bg-white border border-afrikoni-gold/20 hover:border-afrikoni-gold hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-afrikoni-chestnut">{rfq.title}</span>
          <Badge variant="outline" className="text-xs">
            {rfq.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-afrikoni-deep/60">
          <span>Buyer: {rfq.buyer_company?.company_name || 'Unknown'}</span>
          <span>{quotesCount} quotes</span>
          <span>{formatDistanceToNow(new Date(rfq.created_at), { addSuffix: true })}</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-afrikoni-deep/40" />
    </div>
  );
}

function StalledDealItem({ order, onClick }) {
  const daysSinceCreated = Math.floor((new Date() - new Date(order.created_at)) / (1000 * 60 * 60 * 24));
  
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-300 hover:border-red-500 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-red-800">
            {order.rfq?.title || `Order #${order.order_number}`}
          </span>
          <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
            {daysSinceCreated} days pending
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-red-700">
          <span>Buyer: {order.buyer_company?.company_name}</span>
          <span>Supplier: {order.seller_company?.company_name}</span>
        </div>
      </div>
      <AlertTriangle className="w-4 h-4 text-red-600" />
    </div>
  );
}

