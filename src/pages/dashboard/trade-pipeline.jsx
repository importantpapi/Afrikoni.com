import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import EmptyState from '@/components/shared/ui/EmptyState';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import {
  MessageSquare, FileText, DollarSign, Factory, Truck, Package,
  CheckCircle, ShieldCheck, Clock, ArrowRight, Eye, TrendingUp,
  AlertTriangle, Globe, Ship
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Trade Pipeline - Visual workflow from Inquiry to Delivery
 *
 * Shows the full trade lifecycle:
 * Inquiry → RFQ Sent → Quote → Escrow → Production → QC → Shipped → Transit → Customs → Delivered → Complete
 */

const PIPELINE_STAGES = [
  { id: 'inquiry', label: 'Inquiry', icon: MessageSquare, color: 'bg-gray-400' },
  { id: 'rfq_sent', label: 'RFQ Sent', icon: FileText, color: 'bg-afrikoni-purple' },
  { id: 'quote', label: 'Quote', icon: DollarSign, color: 'bg-blue-500' },
  { id: 'escrow', label: 'Escrow', icon: ShieldCheck, color: 'bg-afrikoni-gold' },
  { id: 'production', label: 'Production', icon: Factory, color: 'bg-orange-500' },
  { id: 'qc', label: 'QC', icon: CheckCircle, color: 'bg-teal-500' },
  { id: 'shipped', label: 'Shipped', icon: Package, color: 'bg-indigo-500' },
  { id: 'transit', label: 'Transit', icon: Ship, color: 'bg-cyan-500' },
  { id: 'customs', label: 'Customs', icon: Globe, color: 'bg-amber-600' },
  { id: 'delivered', label: 'Delivered', icon: Truck, color: 'bg-afrikoni-green' },
  { id: 'complete', label: 'Complete', icon: CheckCircle, color: 'bg-emerald-600' },
];

function mapOrderToStage(order) {
  const status = (order.status || '').toLowerCase();
  if (status === 'completed' || status === 'complete') return 'complete';
  if (status === 'delivered') return 'delivered';
  if (status === 'customs') return 'customs';
  if (status === 'in_transit' || status === 'transit') return 'transit';
  if (status === 'shipped') return 'shipped';
  if (status === 'quality_check' || status === 'qc') return 'qc';
  if (status === 'production' || status === 'manufacturing') return 'production';
  if (status === 'escrow_funded' || status === 'escrow') return 'escrow';
  if (status === 'quoted' || status === 'quote') return 'quote';
  if (status === 'rfq_sent') return 'rfq_sent';
  if (status === 'pending' || status === 'confirmed') return 'escrow';
  return 'inquiry';
}

function StageNode({ stage, count, isActive, index }) {
  const Icon = stage.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col items-center relative"
    >
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center relative
          transition-all duration-300
          ${count > 0
            ? `${stage.color} text-white shadow-lg`
            : 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-400 dark:text-gray-600'
          }
          ${isActive ? 'ring-2 ring-offset-2 ring-afrikoni-gold dark:ring-offset-[#121212]' : ''}
        `}
      >
        <Icon className="w-5 h-5" />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-afrikoni-gold text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow"
          >
            {count}
          </motion.span>
        )}
      </div>
      <span className={`text-[11px] font-medium mt-1.5 text-center leading-tight ${
        count > 0 ? 'text-afrikoni-charcoal dark:text-[#F5F0E8]' : 'text-gray-400 dark:text-gray-600'
      }`}>
        {stage.label}
      </span>
    </motion.div>
  );
}

function StageConnector({ active }) {
  return (
    <div className="flex-1 flex items-center px-0.5 mt-[-16px]">
      <div className={`h-0.5 w-full rounded-full transition-colors ${
        active ? 'bg-afrikoni-gold' : 'bg-gray-200 dark:bg-[#2A2A2A]'
      }`} />
    </div>
  );
}

function TradeCard({ trade, stageLabel }) {
  return (
    <Link to={`/dashboard/orders`} className="block">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] hover:border-afrikoni-gold/40 hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-afrikoni-gold/15 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-afrikoni-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-afrikoni-charcoal dark:text-[#F5F0E8] truncate">
              {trade.product_name || `Order #${trade.id?.slice(-8)}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {trade.buyer_country && trade.seller_country
                ? `${trade.seller_country} → ${trade.buyer_country}`
                : trade.created_at ? format(new Date(trade.created_at), 'MMM dd, yyyy') : 'N/A'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-afrikoni-charcoal dark:text-[#F5F0E8]">
            ${parseFloat(trade.total_amount || 0).toLocaleString()}
          </span>
          <Badge variant="outline" className="text-[10px] capitalize">
            {stageLabel}
          </Badge>
        </div>
      </motion.div>
    </Link>
  );
}

export default function TradePipeline() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;

    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('id, status, total_amount, quantity, created_at, product_name, buyer_company_id, seller_company_id')
          .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setTrades(data || []);
        const total = (data || []).reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
        setPipelineValue(total);
      } catch (err) {
        console.error('[TradePipeline] Error loading:', err);
        setTrades([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoadData, profileCompanyId]);

  const stageCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach(s => { counts[s.id] = 0; });
    trades.forEach(t => {
      const stage = mapOrderToStage(t);
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return counts;
  }, [trades]);

  const tradesByStage = useMemo(() => {
    const grouped = {};
    PIPELINE_STAGES.forEach(s => { grouped[s.id] = []; });
    trades.forEach(t => {
      const stage = mapOrderToStage(t);
      grouped[stage].push(t);
    });
    return grouped;
  }, [trades]);

  const filteredTrades = selectedStage
    ? tradesByStage[selectedStage] || []
    : trades.slice(0, 10);

  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading trade pipeline..." ready={isSystemReady} />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-charcoal dark:text-[#F5F0E8]">
            Trade Pipeline
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your trades from inquiry to delivery in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Pipeline Value</p>
            <p className="text-xl font-bold text-afrikoni-gold">
              ${pipelineValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Visual */}
      <Card className="border-afrikoni-gold/20 bg-white dark:bg-[#1A1A1A] rounded-afrikoni-lg shadow-premium overflow-x-auto">
        <CardContent className="p-6">
          <div className="flex items-start gap-1 min-w-[700px]">
            {PIPELINE_STAGES.map((stage, i) => (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                  className="cursor-pointer"
                >
                  <StageNode
                    stage={stage}
                    count={stageCounts[stage.id]}
                    isActive={selectedStage === stage.id}
                    index={i}
                  />
                </button>
                {i < PIPELINE_STAGES.length - 1 && (
                  <StageConnector active={stageCounts[stage.id] > 0} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Trades', value: trades.filter(t => !['completed', 'complete', 'delivered'].includes((t.status || '').toLowerCase())).length, icon: TrendingUp, color: 'text-afrikoni-gold' },
          { label: 'In Transit', value: stageCounts.transit + stageCounts.shipped, icon: Ship, color: 'text-cyan-500' },
          { label: 'Awaiting Escrow', value: stageCounts.escrow, icon: ShieldCheck, color: 'text-afrikoni-purple' },
          { label: 'Completed', value: stageCounts.complete + stageCounts.delivered, icon: CheckCircle, color: 'text-afrikoni-green' },
        ].map((stat) => (
          <Card key={stat.label} className="border-afrikoni-gold/20 bg-white dark:bg-[#1A1A1A] rounded-afrikoni-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-xl font-bold text-afrikoni-charcoal dark:text-[#F5F0E8]">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Trades List */}
      <Card className="border-afrikoni-gold/20 bg-white dark:bg-[#1A1A1A] rounded-afrikoni-lg shadow-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-afrikoni-charcoal dark:text-[#F5F0E8] flex items-center gap-2">
            <Package className="w-5 h-5 text-afrikoni-gold" />
            {selectedStage
              ? `${PIPELINE_STAGES.find(s => s.id === selectedStage)?.label || ''} Trades`
              : 'Recent Trades'
            }
          </CardTitle>
          {selectedStage && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedStage(null)}>
              Show All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-[#222] animate-pulse" />
              ))}
            </div>
          ) : filteredTrades.length === 0 ? (
            <EmptyState
              icon={Package}
              title={selectedStage ? 'No trades at this stage' : 'No trades yet'}
              description="Your active trades will appear here as they progress through the pipeline."
            />
          ) : (
            <div className="space-y-2">
              {filteredTrades.map(trade => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  stageLabel={PIPELINE_STAGES.find(s => s.id === mapOrderToStage(trade))?.label || 'Unknown'}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
