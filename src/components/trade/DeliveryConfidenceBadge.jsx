/**
 * DeliveryConfidenceBadge — Afrikoni Trade Intelligence
 * ======================================================
 * Computes and displays an estimated delivery window + confidence %
 * for a trade corridor, using real data from:
 *   - corridor_reliability  (historical transit + customs risk)
 *   - supplier_intelligence (reliability_score, response_time_avg)
 *
 * Output example:
 *   "Estimated 4–6 days  ·  86% confidence"
 *
 * Usage:
 *   <DeliveryConfidenceBadge
 *     originCountry="NG"
 *     destinationCountry="GH"
 *     supplierId={trade.seller_company_id}
 *     compact={false}
 *   />
 */
import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

// Map risk labels to numeric penalty
const CUSTOMS_RISK_PENALTY = { low: 0, medium: 1.5, high: 4 };
const CUSTOMS_RISK_COLOR = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

export default function DeliveryConfidenceBadge({
  originCountry,
  destinationCountry,
  supplierId,
  compact = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!originCountry || !destinationCountry) {
      setLoading(false);
      return;
    }
    let active = true;

    const load = async () => {
      setLoading(true);

      const [corridorRes, supplierRes] = await Promise.all([
        supabase
          .from('corridor_reliability')
          .select('avg_transit_days, reliability_score, customs_delay_risk')
          .ilike('origin_country', originCountry)
          .ilike('destination_country', destinationCountry)
          .order('reliability_score', { ascending: false })
          .limit(1)
          .maybeSingle(),

        supplierId
          ? supabase
              .from('supplier_intelligence')
              .select('reliability_score, response_time_avg')
              .eq('company_id', supplierId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!active) return;

      const corridor = corridorRes.data;
      const supplier = supplierRes.data;

      if (!corridor) {
        setData(null);
        setLoading(false);
        return;
      }

      const baseDays = corridor.avg_transit_days ?? 7;
      const customsPenalty = CUSTOMS_RISK_PENALTY[corridor.customs_delay_risk] ?? 1.5;
      const corridorScore = corridor.reliability_score ?? 60;
      const supplierScore = supplier?.reliability_score ?? 70;

      // Estimated delivery window: base ± buffer (customs + variance)
      const buffer = Math.round(Math.max(1, baseDays * 0.3 + customsPenalty));
      const minDays = Math.max(1, baseDays - 1);
      const maxDays = baseDays + buffer;

      // Confidence: weighted average of corridor + supplier reliability
      const rawConfidence = Math.round(corridorScore * 0.55 + supplierScore * 0.45);
      const confidence = Math.min(97, Math.max(30, rawConfidence));

      const riskLabel = corridor.customs_delay_risk ?? 'medium';

      setData({ minDays, maxDays, confidence, riskLabel, baseDays });
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, [originCountry, destinationCountry, supplierId]);

  if (loading) {
    return compact ? (
      <span className="text-xs text-white/30 font-mono animate-pulse">Calculating ETA...</span>
    ) : null;
  }

  if (!data) return null;

  const { minDays, maxDays, confidence, riskLabel } = data;
  const confidenceColor =
    confidence >= 80 ? 'text-emerald-400' : confidence >= 60 ? 'text-amber-400' : 'text-red-400';
  const confidenceBg =
    confidence >= 80 ? 'bg-emerald-500/10 border-emerald-500/25' : confidence >= 60 ? 'bg-amber-500/10 border-amber-500/25' : 'bg-red-500/10 border-red-500/25';

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Clock className={`w-3 h-3 ${confidenceColor}`} />
        <span className="text-white/70">
          {minDays}–{maxDays}d
        </span>
        <span className={`font-bold ${confidenceColor}`}>{confidence}%</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${confidenceBg}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className={`w-4 h-4 ${confidenceColor}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${confidenceColor}`}>
          Delivery Intelligence
        </span>
      </div>

      {/* Main metric */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-mono font-light text-white">
          {minDays}–{maxDays}
        </span>
        <span className="text-sm text-white/50">days</span>
        <span className={`ml-auto text-xl font-mono font-bold ${confidenceColor}`}>
          {confidence}%
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/50">
        <span>Estimated transit window</span>
        <span>Confidence</span>
      </div>

      {/* Corridor risk */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px]">
        <AlertTriangle className={`w-3 h-3 ${CUSTOMS_RISK_COLOR[riskLabel] ?? 'text-white/40'}`} />
        <span className="text-white/50">
          Customs risk:{' '}
          <span className={`font-semibold ${CUSTOMS_RISK_COLOR[riskLabel] ?? 'text-white/40'}`}>
            {riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)}
          </span>
        </span>
        <span className="ml-auto text-white/30">
          {originCountry} → {destinationCountry}
        </span>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-white/25 mt-2 leading-relaxed">
        AI estimate based on {originCountry}→{destinationCountry} corridor history.
        Not a contractual commitment.
      </p>
    </div>
  );
}
