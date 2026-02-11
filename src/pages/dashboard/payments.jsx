import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  Lock,
  TrendingUp,
  CheckCircle2,
  PieChart,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import EscrowWidget from "@/components/dashboard/EscrowWidget";
import { Surface } from "@/components/system/Surface";
import { StatusBadge } from "@/components/system/StatusBadge";
import { supabase } from "@/api/supabaseClient";
import { useDashboardKernel } from "@/hooks/useDashboardKernel";
import { calculateTradeFees, estimateFX } from "@/services/revenueEngine";
import GlobalPaymentRisk from "@/components/risk/GlobalPaymentRisk";

const Payments = () => {
  const { canLoadData, isSystemReady, profileCompanyId } = useDashboardKernel();
  const [payment, setPayment] = useState({
    totalAmount: 0,
    releasedAmount: 0,
    heldAmount: 0,
    fxRate: 1.0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Revenue Engine State
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

        // Revenue Engine: Calculate Fees on Total Volume
        const fees = calculateTradeFees(totalAmount);
        setFeePreview(fees);

        // Revenue Engine: Estimate Netting (Example: NGN)
        const fx = estimateFX(1000, 'NGN'); // Simulating 1k USD conversion
        setFxPreview(fx);

        const tx = (payments || []).map((row) => ({
          id: row.id,
          order: row.trade_id,
          product: row.trades?.product_name || "Trade",
          type: row.payment_type === "escrow_release" ? "Milestone Release" : row.payment_type === "refund" ? "Escrow Refund" : "Adjustment",
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
    return () => {
      active = false;
    };
  }, [canLoadData, isSystemReady, profileCompanyId]);

  const fxLabel = useMemo(() => (payment.fxRate ? `1 USD = ${payment.fxRate} USD` : "—"), [payment.fxRate]);

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6 md:p-8">
        <h1 className="os-title">Payments & Escrow</h1>
        <p className="text-sm text-os-muted">
          Manage escrow accounts, milestone payments, and settlements
        </p>
      </Surface>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total in Escrow",
            value: `$${payment.totalAmount.toLocaleString()}`,
            icon: Wallet,
            tone: "neutral",
            color: "text-[var(--os-text-primary)]",
            bg: "bg-white/5",
          },
          {
            label: "Released",
            value: `$${payment.releasedAmount.toLocaleString()}`,
            icon: ArrowUpRight,
            tone: "good",
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            label: "Held",
            value: `$${payment.heldAmount.toLocaleString()}`,
            icon: Lock,
            tone: "warning",
            color: "text-amber-400",
            bg: "bg-amber-400/10",
          },
          {
            label: "FX Rate (Vol)",
            value: fxLabel,
            icon: TrendingUp,
            tone: "info",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
        ].map((stat) => (
          <Surface
            key={stat.label}
            variant="panel"
            className="p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  stat.bg
                )}
              >
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <span className="text-xs font-medium text-os-muted uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--os-text-primary)] tabular-nums font-mono">
              {stat.value}
            </p>
          </Surface>
        ))}
      </div>

      {/* REVENUE ENGINE: Fee Breakdown & Risk Visualization */}
      {feePreview && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Risk Widget - Takes 1 column */}
          <div className="lg:col-span-1">
            <GlobalPaymentRisk transactions={transactions} />
          </div>

          {/* Revenue Breakdown - Takes 2 columns */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <Surface variant="panel" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-os-muted" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-os-muted">Protocol Take-Rate (8%)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-os-muted">Escrow Platform (5%)</span>
                  <span className="font-mono">${feePreview.breakdown.escrow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-os-muted">Service Margin (1.8%)</span>
                  <span className="font-mono">${feePreview.breakdown.service.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-os-muted">FX Spread (1.2%)</span>
                  <span className="font-mono">${feePreview.breakdown.fxValuation.toLocaleString()}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-sm font-bold text-amber-400">
                  <span>Projected Revenue</span>
                  <span className="font-mono">${feePreview.total.toLocaleString()}</span>
                </div>
              </div>
            </Surface>

            <Surface variant="panel" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-5 h-5 text-os-muted" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-os-muted">Sovereign FX Rail</h3>
              </div>
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-os-muted uppercase">You Pay (Local)</span>
                  <span className="text-xs text-os-muted uppercase">We Settle (USD)</span>
                </div>
                <div className="flex justify-between items-center text-xl font-mono">
                  <span className="text-emerald-400">₦1,650,500</span>
                  <ArrowUpRight className="w-4 h-4 text-os-muted" />
                  <span className="text-white">$1,000.00</span>
                </div>
              </div>
              <p className="text-xs text-os-muted">
                *Treasury Bridge active. Spread captured automatically via instant-netting.
              </p>
            </Surface>
          </div>
        </div>
      )}

      <EscrowWidget payment={payment} />

      <Surface variant="panel" className="overflow-hidden p-0">
        <div className="p-5 border-b border-white/5 bg-white/5">
          <h3 className="text-base font-semibold text-[var(--os-text-primary)]">Transaction History</h3>
          <p className="text-xs text-os-muted mt-0.5">
            Recent escrow and settlement activity
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                {["Transaction", "Order", "Type", "Amount", "Status", "Date"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-os-muted"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--os-text-primary)]">
                        {tx.product}
                      </p>
                      <p className="text-xs text-os-muted font-mono">
                        {tx.id}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-os-muted">
                      {tx.order}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--os-text-primary)]">{tx.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums font-mono",
                        tx.status === "released" || tx.status === "completed"
                          ? "text-emerald-400"
                          : tx.status === "refunded"
                            ? "text-blue-400"
                            : "text-[var(--os-text-primary)]"
                      )}
                    >
                      {tx.status === "released" || tx.status === "completed" ? "+" : ""}
                      ${tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <span className="text-xs text-os-muted tabular-nums">
                      {tx.date ? new Date(tx.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-os-muted" colSpan={6}>
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
};

export default Payments;
