import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  Lock,
  TrendingUp,
  CheckCircle2,
  PieChart,
  ArrowRightLeft,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Info,
  FileText,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import EscrowWidget from "@/components/dashboard/EscrowWidget";
import { Surface } from "@/components/system/Surface";
import { StatusBadge } from "@/components/system/StatusBadge";
import { supabase } from "@/api/supabaseClient";
import { useDashboardKernel } from "@/hooks/useDashboardKernel";
import { usePayments } from "@/hooks/queries/usePayments";
import { calculateTradeFees, estimateFX } from "@/services/revenueEngine";
import GlobalPaymentRisk from "@/components/risk/GlobalPaymentRisk";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";

const Payments = () => {
  const { canLoadData, isSystemReady, profileCompanyId } = useDashboardKernel();

  const { data: invoicesData = [], isLoading: isQueryLoading } = usePayments();

  const [payment, setPayment] = useState({
    totalAmount: 0,
    releasedAmount: 0,
    heldAmount: 0,
    fxRate: 1.0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [feePreview, setFeePreview] = useState(null);
  const [fxPreview, setFxPreview] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isSystemReady || !canLoadData) return;
      try {
        const { data: escrows } = await supabase
          .from("escrows")
          .select("id, amount, balance, status, trade_id, buyer_id, seller_id")
          .or(`buyer_id.eq.${profileCompanyId},seller_id.eq.${profileCompanyId}`);

        const { data: payments } = await supabase
          .from("payments")
          .select("id, trade_id, amount, payment_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        if (!active) return;

        const totalAmount = (escrows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
        const releasedAmount = (payments || [])
          .filter((row) => row.payment_type === "escrow_release" && row.status === "completed")
          .reduce((sum, row) => sum + Number(row.amount || 0), 0);
        const heldAmount = Math.max(0, totalAmount - releasedAmount);

        setPayment({
          totalAmount,
          releasedAmount,
          heldAmount,
          fxRate: 1.0,
        });

        const fees = calculateTradeFees(totalAmount);
        setFeePreview(fees);

        const fx = estimateFX(1000, 'NGN');
        setFxPreview(fx);

        const tx = (payments || []).map((row) => ({
          id: row.id,
          order: row.trade_id,
          product: row.trades?.product_name || "Trade Settlement",
          type: row.payment_type === "escrow_release" ? "Milestone Release" : row.payment_type === "refund" ? "Escrow Refund" : "Institutional Adjustment",
          amount: Number(row.amount || 0),
          status: row.status === "completed" ? "released" : row.status,
          date: row.created_at,
        }));
        setTransactions(tx);
      } catch {
        if (active) {
          setTransactions([]);
          setPayment({ totalAmount: 0, releasedAmount: 0, heldAmount: 0, fxRate: 1.0 });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [canLoadData, isSystemReady, profileCompanyId]);

  const fxLabel = useMemo(() => (payment.fxRate ? `1 USD = ${payment.fxRate} USD` : "—"), [payment.fxRate]);

  return (
    <div className="os-page os-stagger space-y-8 max-w-7xl mx-auto pb-20 px-4 py-8">
      {/* Premium Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-afrikoni-gold/10 rounded-2xl border border-afrikoni-gold/30 shadow-lg shadow-afrikoni-gold/5">
              <Wallet className="w-8 h-8 text-afrikoni-gold" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Treasury Control</h1>
          </div>
          <p className="text-lg text-os-muted max-w-2xl leading-relaxed">
            Centralized gateway for cross-border liquidity, programmable escrow settlements, and localized FX netting.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/invoices')}
            className="text-os-muted hover:text-afrikoni-gold font-bold text-[10px] uppercase tracking-widest gap-2"
          >
            Invoices <FileText className="w-3 h-3" />
          </Button>
          <Surface variant="panel" className="px-5 py-2.5 flex items-center gap-4 border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Treasury Status: Interlinked
            </div>
            <div className="w-px h-6 bg-white/10" />
            <Badge variant="outline" className="border-white/10 text-[10px] uppercase font-bold text-os-muted">Tier 2 Liquidity</Badge>
          </Surface>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Sovereign Escrow", value: `$${payment.totalAmount.toLocaleString()}`, icon: Wallet, color: "text-os-muted", bg: "bg-white/5" },
          { label: "Settled Volume", value: `$${payment.releasedAmount.toLocaleString()}`, icon: ArrowUpRight, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Held in Vault", value: `$${payment.heldAmount.toLocaleString()}`, icon: Lock, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Global FX Vol", value: fxLabel, icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10" },
        ].map((stat, i) => (
          <Surface key={i} variant="panel" className="p-6 group hover:border-afrikoni-gold/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-xl flex items-center justify-center transition-colors", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold text-os-muted uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-3xl font-black tabular-nums tracking-tight">
              {stat.value}
            </p>
          </Surface>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue & FX Rails */}
          {feePreview && (
            <div className="grid md:grid-cols-2 gap-6">
              <Surface variant="glass" className="p-8 group overflow-hidden relative">
                <div className="absolute -right-6 -bottom-6 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <PieChart className="w-32 h-32" />
                </div>

                <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                  <Zap className="w-5 h-5 text-afrikoni-gold" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Fee Orchestration</h3>
                </div>

                <div className="space-y-4 relative z-10">
                  {[
                    { label: 'Platform Infrastructure', pct: '(5%)', val: feePreview.breakdown.escrow },
                    { label: 'Operational Margin', pct: '(1.8%)', val: feePreview.breakdown.service },
                    { label: 'Liquidity Spread', pct: '(1.2%)', val: feePreview.breakdown.fxValuation }
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center group/row">
                      <span className="text-xs text-os-muted font-medium">{row.label} <span className="opacity-40">{row.pct}</span></span>
                      <span className="text-sm font-bold font-mono group-hover/row:text-afrikoni-gold transition-colors">${row.val.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-afrikoni-gold">Net Protocol Yield</span>
                    <div className="text-xl font-black font-mono text-afrikoni-gold">${feePreview.total.toLocaleString()}</div>
                  </div>
                </div>
              </Surface>

              <Surface variant="glass" className="p-8 group overflow-hidden relative">
                <div className="absolute -right-6 -bottom-6 p-12 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <ArrowRightLeft className="w-32 h-32" />
                </div>

                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="w-5 h-5 text-os-muted" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Sovereign Rail</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full"><Info className="w-3 h-3 text-os-muted" /></Button>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-os-muted">Local Cost (NGN)</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Rate</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-white mb-6">₦ 1,650,500.00</div>

                    <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center z-20">
                      <ArrowRight className="w-4 h-4 text-afrikoni-gold rotate-90" />
                    </div>
                  </div>

                  <div className="bg-afrikoni-gold/[0.03] border border-afrikoni-gold/10 p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-afrikoni-gold/60">Institutional Settlement</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-afrikoni-gold">$ 1,000.00 <span className="text-xs font-bold opacity-40 ml-1">USD</span></div>
                  </div>
                </div>
              </Surface>
            </div>
          )}

          <EscrowWidget payment={payment} />

          {/* Transactions Ledger */}
          <Surface variant="glass" className="p-0 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight">Financial Ledger</h3>
                <p className="text-sm text-os-muted mt-1 italic">Real-time settlement & release log</p>
              </div>
              <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-white/10 text-xs font-bold rounded-xl">
                Export Journal <Download className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    {["Entity / ID", "Fulfillment", "Class", "Value", "Status", "Timestamp"].map((h) => (
                      <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-os-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold group-hover:text-afrikoni-gold transition-colors">{tx.product}</p>
                          <p className="text-[10px] text-os-muted font-mono tracking-tighter uppercase opacity-50">{tx.id.slice(0, 12)}...</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black uppercase tracking-widest border border-white/5 px-2 py-1 rounded bg-black">
                          {tx.order ? tx.order.slice(0, 8) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[11px] font-bold text-os-muted">{tx.type}</td>
                      <td className="px-8 py-5 font-black text-sm tabular-nums text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="opacity-40 font-normal">$</span>
                          {tx.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge
                          label={tx.status}
                          tone={
                            tx.status === 'held' ? 'warning' :
                              tx.status === 'released' ? 'good' :
                                tx.status === 'completed' ? 'neutral' :
                                  tx.status === 'refunded' ? 'info' : 'neutral'
                          }
                        />
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-os-muted uppercase">
                        {tx.date ? format(new Date(tx.date), 'MMM d, HH:mm') : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <Activity className="w-12 h-12 text-white/5 mx-auto" />
                <p className="text-sm text-os-muted italic">Awaiting first fiscal event...</p>
              </div>
            )}
          </Surface>
        </div>

        <div className="space-y-8">
          {/* Risk Visualizer */}
          <GlobalPaymentRisk transactions={transactions} />

          {/* Compliance Stats */}
          <Surface variant="glass" className="p-8">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest">Compliance Health</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="space-y-6">
              {[
                { label: 'AML Scrutiny Score', val: 'Low Risk', color: 'text-emerald-500' },
                { label: 'KYC Expiration', val: '724 Days', color: 'text-os-muted' },
                { label: 'Network Trust Coef', val: '0.94', color: 'text-afrikoni-gold' }
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-os-muted font-medium">{row.label}</span>
                  <span className={cn("text-xs font-black", row.color)}>{row.val}</span>
                </div>
              ))}
            </div>

            <Button className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-6 text-[10px] font-black uppercase tracking-widest">
              Run Compliance Audit
            </Button>
          </Surface>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" className="h-16 rounded-2xl border-white/5 bg-white/[0.02] flex justify-between items-center px-6 group hover:border-afrikoni-gold/30">
              <div className="flex gap-4 items-center">
                <div className="p-2 bg-afrikoni-gold/10 rounded-xl text-afrikoni-gold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-wider">Increase Limits</span>
              </div>
              <ChevronRight className="w-4 h-4 text-os-muted group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button variant="outline" className="h-16 rounded-2xl border-white/5 bg-white/[0.02] flex justify-between items-center px-6 group hover:border-white/20">
              <div className="flex gap-4 items-center">
                <div className="p-2 bg-white/10 rounded-xl text-white">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-wider">Localized Banks</span>
              </div>
              <ChevronRight className="w-4 h-4 text-os-muted group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
