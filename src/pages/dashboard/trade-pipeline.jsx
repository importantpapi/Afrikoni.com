import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import EmptyState from '@/components/shared/ui/EmptyState';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import {
  FileText, DollarSign, Factory, Truck, Package,
  CheckCircle, ShieldCheck, Clock, TrendingUp,
  AlertTriangle, Globe, Ship, FileCheck, Layers
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Trade Pipeline - Visual workflow from Inquiry to Delivery
 *
 * Shows the full trade lifecycle:
 * Inquiry → RFQ Sent → Quote → Escrow → Production → QC → Shipped → Transit → Customs → Delivered → Complete
 */

const PIPELINE_STAGES = [
  { id: 'rfq_open', label: 'RFQ', icon: FileText, color: 'bg-purple-500' },
  { id: 'quoted', label: 'Quote', icon: DollarSign, color: 'bg-blue-500' },
  { id: 'contracted', label: 'Contract', icon: FileCheck, color: 'bg-sky-500' },
  { id: 'escrow_funded', label: 'Escrow', icon: ShieldCheck, color: 'bg-afrikoni-gold' },
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
            ? `${stage.color} text-white shadow-lg shadow-black/30`
            : 'bg-white/5 text-os-muted border border-white/10'
          }
          ${isActive ? 'ring-2 ring-offset-2 ring-[#D4A937] ring-offset-[#0b0a08]' : ''}
        `}
      >
        <Icon className="w-5 h-5" />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center shadow"
          >
            {count}
          </motion.span>
        )}
      </div>
      <span className={`text-[11px] font-medium mt-1.5 text-center leading-tight ${count > 0 ? 'text-[var(--os-text-primary)]' : 'text-os-muted'
        }`}>
        {stage.label}
      </span>
    </motion.div>
  );
}

function StageConnector({ active }) {
  return (
    <div className="flex-1 flex items-center px-0.5 mt-[-16px]">
      <div className={`h-0.5 w-full rounded-full transition-colors ${active ? 'bg-[#D4A937]' : 'bg-white/10'
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
        className="flex items-center justify-between p-3 rounded-lg border hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-os-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {trade.title || `Trade #${trade.id?.slice(-8)}`}
            </p>
            <p className="text-xs text-os-muted">
              {trade.created_at ? format(new Date(trade.created_at), 'MMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold">
            ${parseFloat(trade.target_price || trade.price_max || trade.price_min || 0).toLocaleString()}
          </span>
          <StatusBadge label={stageLabel} tone="info" />
        </div>
      </motion.div>
    </button>
  );
}

export default function TradePipeline() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();
  const navigate = useNavigate();
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
          .from('trades')
          .select('id,status,quantity,price_min,price_max,buyer_id,seller_id,created_at')
          .or(`buyer_id.eq.${profileCompanyId},seller_id.eq.${profileCompanyId}`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setTrades(data || []);
        const total = (data || []).reduce((sum, t) => {
          const value = parseFloat(t.price_max || t.price_min || 0);
          return sum + (value || 0);
        }, 0);
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
    (trades || []).forEach(t => {
      const stage = mapTradeToStage(t);
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return counts;
  }, [trades]);

  const tradesByStage = useMemo(() => {
    const grouped = {};
    PIPELINE_STAGES.forEach(s => { grouped[s.id] = []; });
    (trades || []).forEach(t => {
      const stage = mapTradeToStage(t);
      grouped[stage].push(t);
    });
    return grouped;
  }, [trades]);

  const filteredTrades = selectedStage
    ? tradesByStage[selectedStage] || []
    : (trades || []).slice(0, 10);

  if (!isSystemReady) {
    return (
      <div className="os-page space-y-6">
        <Surface variant="panel" className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto" />
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </Surface>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Surface key={i} variant="panel" className="p-4 h-24 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </Surface>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="os-page os-stagger space-y-6 pb-10">
      <Surface variant="panel" className="p-6 os-rail-glow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="os-label">Trade Flow</div>
            <h1 className="os-title mt-2">Trade Pipeline</h1>
            <p className="text-sm text-os-muted mt-2">
              Unified RFQ → Quote → Contract → Escrow → Logistics → Settlement.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-os-muted">Active Pipeline Value</p>
            <p className="text-2xl font-semibold text-os-gold">
              ${pipelineValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </Surface>

      <Surface variant="panel" className="p-6">
        <div className="flex items-start gap-1 min-w-[900px]">
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
        {/* Live Pipeline Animation - moved from DashboardHome.jsx for global, future-proof OS */}
        <div className="mt-8">
          <div className="os-label mb-2">Live Trade Pipeline</div>
          <div className="flex items-center gap-0 overflow-x-auto">
            {PIPELINE_STAGES.filter(s => !['disputed', 'closed'].includes(s.id)).map((stage, idx, arr) => (
              <React.Fragment key={stage.label}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{
                    scale: [0.9, 1.1, 0.9],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: idx * 0.18,
                  }}
                  className={`flex flex-col items-center justify-center px-3`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white shadow ${stage.color}`}>{stage.label[0]}</div>
                  <span className="text-xs mt-1 text-os-muted font-semibold">{stage.label}</span>
                </motion.div>
                {idx < arr.length - 1 && (
                  <motion.div
                    initial={{ width: 0, opacity: 0.2 }}
                    animate={{ width: 32, opacity: [0.2, 0.7, 0.2] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      delay: idx * 0.18 + 0.1,
                    }}
                    className="h-1 mx-1 rounded-full bg-gradient-to-r from-os-gold"
                    style={{ minWidth: 32 }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Trades', value: (trades || []).filter(t => !['closed', 'settled'].includes((t.status || '').toLowerCase())).length, icon: TrendingUp, color: 'text-os-gold' },
          { label: 'In Transit', value: stageCounts.in_transit || 0, icon: Ship, color: 'text-cyan-400' },
          { label: 'Escrow Live', value: stageCounts.escrow_funded || 0, icon: ShieldCheck, color: 'text-amber-300' },
          { label: 'Resolved', value: stageCounts.settled || 0, icon: CheckCircle, color: 'text-emerald-400' },
        ].map((stat) => (
          <Surface key={stat.label} variant="panel" className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-xl font-semibold">{stat.value}</p>
                <p className="text-xs text-os-muted">{stat.label}</p>
              </div>
            </div>
          </Surface>
        ))}
      </div>

      <Surface variant="panel" className="p-5">
        <div className="flex items-center justify-between">
          <div className="os-label">
            {selectedStage
              ? `${PIPELINE_STAGES.find(s => s.id === selectedStage)?.label || ''} Trades`
              : 'Recent Trades'
            }
          </div>
          {selectedStage && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedStage(null)}>
              Show All
            </Button>
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (filteredTrades || []).length === 0 ? (
            <EmptyState
              icon={Package}
              title={selectedStage ? 'No trades at this stage' : 'No trades yet'}
              description="Your active trades will appear here as they progress through the pipeline."
            />
          ) : (
            <div className="space-y-2">
              {(filteredTrades || []).map(trade => (
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
