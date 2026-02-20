import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import EmptyState from '@/components/shared/ui/EmptyState';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTrades } from '@/hooks/queries/useTrades';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { PageLoader } from '@/components/shared/ui/skeletons';
import {
  FileText, DollarSign, Factory, Truck, Package,
  CheckCircle, ShieldCheck, Clock, TrendingUp,
  AlertTriangle, Globe, Ship, FileCheck, Layers
} from 'lucide-react';
import { format } from 'date-fns';

const PIPELINE_STAGES = [
  { id: 'rfq_open', label: 'RFQ', icon: FileText, color: 'bg-purple-500' },
  { id: 'quoted', label: 'Quote', icon: DollarSign, color: 'bg-blue-500' },
  { id: 'contracted', label: 'Contract', icon: FileCheck, color: 'bg-sky-500' },
  { id: 'escrow_funded', label: 'Escrow', icon: ShieldCheck, color: 'bg-os-accent' },
  { id: 'production', label: 'Production', icon: Factory, color: 'bg-orange-500' },
  { id: 'pickup_scheduled', label: 'Pickup', icon: Package, color: 'bg-indigo-500' },
  { id: 'in_transit', label: 'Transit', icon: Ship, color: 'bg-cyan-500' },
  { id: 'delivered', label: 'Delivered', icon: Truck, color: 'bg-emerald-500' },
  { id: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'bg-emerald-600' },
  { id: 'settled', label: 'Settled', icon: Layers, color: 'bg-emerald-700' },
  { id: 'disputed', label: 'Disputed', icon: AlertTriangle, color: 'bg-red-500' },
  { id: 'closed', label: 'Closed', icon: Globe, color: 'bg-gray-500' },
];

function mapTradeToStage(trade) {
  const status = (trade.status || '').toLowerCase();
  if (PIPELINE_STAGES.some(stage => stage.id === status)) return status;
  if (status === 'escrow_required') return 'escrow_funded';
  if (status === 'pickup_scheduled') return 'pickup_scheduled';
  if (status === 'rfq_open') return 'rfq_open';
  return 'rfq_open';
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
            ? `${stage.color} text-white shadow-os-md shadow-black/30`
            : 'bg-white/5 text-os-muted border border-white/10'
          }
          ${isActive ? 'ring-2 ring-offset-2 ring-os-accent ring-offset-[#0b0a08]' : ''}
        `}
      >
        <Icon className="w-5 h-5" />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 text-os-xs font-bold bg-white text-black rounded-full flex items-center justify-center shadow"
          >
            {count}
          </motion.span>
        )}
      </div>
      <span className={`text-os-xs font-medium mt-1.5 text-center leading-tight ${count > 0 ? 'text-[var(--os-text-primary)]' : 'text-os-muted'
        }`}>
        {stage.label}
      </span>
    </motion.div>
  );
}

function StageConnector({ active }) {
  return (
    <div className="flex-1 flex items-center px-0.5 mt-[-16px]">
      <div className={`h-0.5 w-full rounded-full transition-colors ${active ? 'bg-os-accent' : 'bg-white/10'
        }`} />
    </div>
  );
}

function TradeCard({ trade, stageLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between p-3 rounded-lg border border-os-stroke hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-os-surface-1 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-os-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-os-sm font-semibold truncate">
              {trade.title || trade.productName || trade.product_name || `Trade #${trade.id?.slice(-8)}`}
            </p>
            <p className="text-os-xs text-os-muted">
              {trade.created_at ? format(new Date(trade.created_at), 'MMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-os-sm font-bold tabular-nums">
            ${parseFloat(trade.target_price || trade.price_max || trade.price_min || trade.total_amount || 0).toLocaleString()}
          </span>
          <StatusBadge label={stageLabel} tone="info" />
        </div>
      </motion.div>
    </button>
  );
}

export default function TradePipeline() {
  const { isSystemReady } = useDashboardKernel();
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState(null);

  // \u2705 REACT QUERY: Unified data flow
  const { data: tradesData = {}, isLoading } = useTrades();
  const trades = tradesData.trades || [];
  const pipelineValue = tradesData.pipelineValue || 0;

  const stageCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach(s => { counts[s.id] = 0; });
    trades.forEach(t => {
      const stage = mapTradeToStage(t);
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return counts;
  }, [trades]);

  const tradesByStage = useMemo(() => {
    const grouped = {};
    PIPELINE_STAGES.forEach(s => { grouped[s.id] = []; });
    trades.forEach(t => {
      const stage = mapTradeToStage(t);
      grouped[stage].push(t);
    });
    return grouped;
  }, [trades]);

  const filteredTrades = selectedStage
    ? tradesByStage[selectedStage] || []
    : trades.slice(0, 10);

  if (!isSystemReady || isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="os-page os-stagger space-y-6 pb-10">
      <Surface variant="glass" className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="os-label">Infrastructure Monitoring</div>
            <h1 className="os-title mt-2">Order Tracking Ledger</h1>
            <p className="text-os-sm text-os-muted mt-2">
              Real-time monitoring of all active contracts and supply chain events.
            </p>
          </div>
          <div className="text-right p-4 rounded-os-sm bg-black/20 border border-white/5 backdrop-blur">
            <p className="text-os-xs text-os-muted uppercase tracking-widest font-mono">Live Transaction Value</p>
            <p className="text-3xl font-bold text-os-gold tabular-nums mt-1">
              ${pipelineValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </Surface>

      <Surface variant="panel" className="p-6 overflow-x-auto">
        <div className="flex items-start gap-1 min-w-[900px]">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                className="cursor-pointer outline-none focus:ring-0"
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
      </Surface>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Trades', value: trades.filter(t => !['closed', 'settled'].includes(t.status)).length, icon: TrendingUp, color: 'text-os-gold' },
          { label: 'In Transit', value: stageCounts.in_transit || 0, icon: Ship, color: 'text-cyan-400' },
          { label: 'Escrow Live', value: stageCounts.escrow_funded || 0, icon: ShieldCheck, color: 'text-amber-300' },
          { label: 'Resolved', value: trades.filter(t => ['closed', 'settled'].includes(t.status)).length, icon: CheckCircle, color: 'text-emerald-400' },
        ].map((stat) => (
          <Surface key={stat.label} variant="panel" className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg bg-os-surface-1 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-os-xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-os-xs uppercase text-os-muted font-medium tracking-wider">{stat.label}</p>
            </div>
          </Surface>
        ))}
      </div>

      <Surface variant="panel" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-os-gold animate-pulse" />
            <h2 className="text-os-base font-semibold">
              {selectedStage
                ? `${PIPELINE_STAGES.find(s => s.id === selectedStage)?.label || ''} Trades`
                : 'Recent Ledger Activity'
              }
            </h2>
          </div>
          {selectedStage && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedStage(null)}>
              Show All
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {trades.length === 0 ? (
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
                  stageLabel={PIPELINE_STAGES.find(s => s.id === mapTradeToStage(trade))?.label || 'Unknown'}
                  onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}
