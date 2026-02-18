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
  Download,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
            <div className="p-3 bg-os-accent/10 rounded-os-md border border-os-accent/30 shadow-os-md shadow-os-accent/5">
              <Wallet className="w-8 h-8 text-os-accent" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">My Payments</h1>
          </div>
          <p className="text-os-lg text-os-muted max-w-2xl leading-relaxed">
            Track your money, protected in escrow until you confirm delivery.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/invoices')}
            className="text-os-muted hover:text-os-accent font-bold text-os-xs uppercase tracking-widest gap-2"
          >
            Invoices <FileText className="w-3 h-3" />
          </Button>
          <Surface variant="panel" className="px-5 py-2.5 flex items-center gap-4 border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-emerald-500 text-os-xs font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Treasury Status: Interlinked
            </div>
            <div className="w-px h-6 bg-white/10" />
            <Badge variant="outline" className="border-white/10 text-os-xs uppercase font-bold text-os-muted">Tier 2 Liquidity</Badge>
          </Surface>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Secure Escrow", value: `$${payment.totalAmount.toLocaleString()}`, icon: Wallet, color: "text-os-muted", bg: "bg-white/5" },
          { label: "Settled Volume", value: `$${payment.releasedAmount.toLocaleString()}`, icon: ArrowUpRight, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Held in Vault", value: `$${payment.heldAmount.toLocaleString()}`, icon: Lock, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Global FX Vol", value: fxLabel, icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10" },
        ].map((stat, i) => (
          <Surface key={i} variant="panel" className="p-6 group hover:border-os-accent/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-os-sm flex items-center justify-center transition-colors", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <span className="text-os-xs font-bold text-os-muted uppercase tracking-widest">{stat.label}</span>
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
                  <Zap className="w-5 h-5 text-os-accent" />
                  <h3 className="text-os-sm font-black uppercase tracking-widest">Fee Orchestration</h3>
                </div>

                <div className="space-y-4 relative z-10">
                  {[
                    { label: 'Platform Infrastructure', pct: '(5%)', val: feePreview.breakdown.escrow },
                    { label: 'Operational Margin', pct: '(1.8%)', val: feePreview.breakdown.service },
                    { label: 'Liquidity Spread', pct: '(1.2%)', val: feePreview.breakdown.fxValuation }
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center group/row">
                      <span className="text-os-xs text-os-muted font-medium">{row.label} <span className="opacity-40">{row.pct}</span></span>
                      <span className="text-os-sm font-bold font-mono group-hover/row:text-os-accent transition-colors">${row.val.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-os-xs font-black uppercase tracking-widest text-os-accent">Net Protocol Yield</span>
                    <div className="text-os-xl font-black font-mono text-os-accent">${feePreview.total.toLocaleString()}</div>
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
                    <h3 className="text-os-sm font-black uppercase tracking-widest">Secure Payment Rail</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full"><Info className="w-3 h-3 text-os-muted" /></Button>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="bg-white/[0.03] border border-white/5 p-5 rounded-os-md relative">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-os-xs font-black uppercase tracking-widest text-os-muted">Local Cost (NGN)</span>
                      <span className="text-os-xs font-black uppercase tracking-widest text-emerald-500">Live Rate</span>
                    </div>
                    <div className="text-os-2xl font-black font-mono text-white mb-6">₦ 1,650,500.00</div>

                    <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center z-20">
                      <ArrowRight className="w-4 h-4 text-os-accent rotate-90" />
                    </div>
                  </div>

                  <div className="bg-os-accent/[0.03] border border-os-accent/10 p-5 rounded-os-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-os-xs font-black uppercase tracking-widest text-os-accent/60">Institutional Settlement</span>
                    </div>
                    <div className="text-os-2xl font-black font-mono text-os-accent">$ 1,000.00 <span className="text-os-xs font-bold opacity-40 ml-1">USD</span></div>
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
                <h3 className="text-os-xl font-black tracking-tight">Financial Ledger</h3>
                <p className="text-os-sm text-os-muted mt-1 italic">Real-time settlement & release log</p>
              </div>
              <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-white/10 text-os-xs font-bold rounded-os-sm">
                Export Journal <Download className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    {["Entity / ID", "Fulfillment", "Class", "Value", "Status", "Timestamp"].map((h) => (
                      <th key={h} className="px-8 py-5 text-os-xs font-black uppercase tracking-[0.2em] text-os-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-os-sm font-bold group-hover:text-os-accent transition-colors">{tx.product}</p>
                          <p className="text-os-xs text-os-muted font-mono tracking-tighter uppercase opacity-50">{tx.id.slice(0, 12)}...</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-os-xs font-black uppercase tracking-widest border border-white/5 px-2 py-1 rounded bg-black">
                          {tx.order ? tx.order.slice(0, 8) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-os-xs font-bold text-os-muted">{tx.type}</td>
                      <td className="px-8 py-5 font-black text-os-sm tabular-nums text-white">
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
                      <td className="px-8 py-5 text-os-xs font-bold text-os-muted uppercase">
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
                <p className="text-os-sm text-os-muted italic">Awaiting first fiscal event...</p>
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
              <h3 className="text-os-xs font-black uppercase tracking-widest">Compliance Health</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="space-y-4">
              <p className="text-os-xs text-os-muted leading-relaxed">
                Your compliance status is managed through your verification profile. Complete KYC to unlock full trade limits.
              </p>
              <Button
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-os-md py-5 text-os-xs font-black uppercase tracking-widest"
                onClick={() => window.location.href = '/dashboard/verification'}
              >
                View Compliance Status
              </Button>
            </div>
          </Surface>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" className="h-16 rounded-os-md border-white/5 bg-white/[0.02] flex justify-between items-center px-6 group hover:border-os-accent/30">
              <div className="flex gap-4 items-center">
                <div className="p-2 bg-os-accent/10 rounded-os-sm text-os-accent">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-os-sm font-black uppercase tracking-wider">Increase Limits</span>
              </div>
              <ChevronRight className="w-4 h-4 text-os-muted group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button variant="outline" className="h-16 rounded-os-md border-white/5 bg-white/[0.02] flex justify-between items-center px-6 group hover:border-white/20">
              <div className="flex gap-4 items-center">
                <div className="p-2 bg-white/10 rounded-os-sm text-white">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-os-sm font-black uppercase tracking-wider">Localized Banks</span>
              </div>
              <ChevronRight className="w-4 h-4 text-os-muted group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
      {/* Manual Settlement Instructions (Concierge Beta) */}
      <Surface variant="panel" className="p-8 border-t border-os-accent/20 bg-os-accent/5">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-os-accent text-black rounded-full">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white">Manual Settlement Instructions</h3>
            </div>
            <p className="text-os-sm text-os-muted leading-relaxed">
              For high-value trades or early access partners, you can fund your escrow account manually via Wire Transfer or Stablecoin.
              Funds are held in a segregated client trust account until you verify delivery.
            </p>
            <div className="flex gap-4 pt-2">
              <Button onClick={() => window.location.href = 'mailto:settlements@afrikoni.com?subject=Wire%20Instruction%20Request'} className="bg-white text-black hover:bg-gray-200 font-bold">
                Request Wire Invoice
              </Button>
              <Button variant="outline" className="border-os-accent text-os-accent hover:bg-os-accent/10">
                View Crypto Options
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-black/40 p-6 rounded-lg border border-white/10 space-y-4 font-mono text-os-sm">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-os-muted">Beneficiary</span>
              <span className="text-white font-bold">Afrikoni Trade Trust Ltd</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-os-muted">Bank</span>
              <span className="text-white">Citibank London (UK)</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-os-muted">IBAN</span>
              <span className="text-white">GB82 CITI 1850 0852 **** **</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-os-muted">Reference</span>
              <Badge className="bg-os-accent text-black">YOUR COMPANY ID</Badge>
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
};

export default Payments;
