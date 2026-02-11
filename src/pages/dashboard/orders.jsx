import React, { useState, useEffect } from "react";
import { fetchOrders } from '@/api/orders';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { analyzeContext } from '@/services/tradeKernel';
import SystemAdvice from '@/components/intelligence/SystemAdvice';
import SimulationState from '@/components/common/SimulationState';
import {
  ShoppingCart,
  ArrowRight,
  Truck,
  Wallet,
  Package,
  DollarSign,
  Filter,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Progress } from "@/components/shared/ui/progress";
import { Surface } from "@/components/system/Surface";
import { StatusBadge } from "@/components/system/StatusBadge";
import { cn } from "@/lib/utils";

const statusLabels = {
  inquiry: { label: "Inquiry", tone: "neutral" },
  rfq_sent: { label: "RFQ Sent", tone: "info" },
  quote_received: { label: "Quote Received", tone: "info" },
  negotiating: { label: "Negotiating", tone: "info" },
  escrow_funded: { label: "Escrow Funded", tone: "success" },
  production: { label: "Production", tone: "warning" },
  quality_check: { label: "Quality Check", tone: "warning" },
  shipped: { label: "Shipped", tone: "success" },
  in_transit: { label: "In Transit", tone: "success" },
  customs_clearance: { label: "Customs", tone: "warning" },
  delivered: { label: "Delivered", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  disputed: { label: "Disputed", tone: "critical" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const Orders = () => {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advice, setAdvice] = useState([]);
  const { profileCompanyId, canLoadData } = useDashboardKernel();

  useEffect(() => {
    if (!canLoadData) return;
    setLoading(true);
    setError(null);
    fetchOrders(profileCompanyId)
      .then((data) => {
        setOrders(data);

        // INTELLIGENCE LAYER: Analyze context
        const contextAdvice = analyzeContext({
          page: 'orders',
          data: data,
          user: profileCompanyId
        });
        setAdvice(contextAdvice);

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load orders');
        setLoading(false);
      });
  }, [profileCompanyId, canLoadData]);

  const handleActivateSimulation = async () => {
    setLoading(true);
    // Simulate creating a dummy order for demonstration
    // In a real app, this would call an API to seed data
    setTimeout(() => {
      const mockOrder = {
        id: `TRD-${Math.floor(Math.random() * 10000)}`,
        product_name: "Simulated Shipment: Cocoa Beans",
        total_value: 45000,
        status: "in_transit",
        quantity: 15,
        unit: "MT",
        unit_price: 3000,
        corridor: { originCountry: "Ghana", destinationCountry: "UK", risk: "low" },
        milestones: [
          { id: 1, name: "Contract Signed", status: "completed" },
          { id: 2, name: "Escrow Funded", status: "completed" },
          { id: 3, name: "Export Clearance", status: "in_progress" },
          { id: 4, name: "Delivery", status: "pending" }
        ]
      };
      setOrders([mockOrder, ...orders]);

      // Re-run intelligence
      const contextAdvice = analyzeContext({
        page: 'orders',
        data: [mockOrder, ...orders],
        user: profileCompanyId
      });
      setAdvice(contextAdvice);

      setLoading(false);
    }, 2000);
  };

  const totalValue = orders.reduce((sum, order) => sum + (order.total_value || 0), 0);
  const inTransit = orders.filter((order) =>
    ["shipped", "in_transit", "customs_clearance"].includes(order.status)
  ).length;
  const escrowHeld = totalValue * 0.4;

  const filtered = orders.filter((order) =>
    (order.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (order.id || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="os-page space-y-6">
        <Surface variant="glass" className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>

          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        </Surface>
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[40vh] text-red-500">{error}</div>;
  }

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="os-label">Trade Pipeline</div>
            <h1 className="os-title mt-2">Active Orders</h1>
            <p className="text-sm text-os-muted">
              {orders.length} orders in your pipeline
            </p>
          </div>
          <Button className="shadow-gold gap-2">
            <ShoppingCart className="h-4 w-4" /> New Order
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            {
              label: "Pipeline Value",
              value: `$${(totalValue / 1000).toFixed(0)}K`,
              icon: DollarSign,
              color: "text-[var(--os-text-primary)]",
            },
            {
              label: "Active Orders",
              value: orders.length,
              icon: Package,
              color: "text-blue-400",
            },
            {
              label: "In Transit",
              value: inTransit,
              icon: Truck,
              color: "text-emerald-400",
            },
            {
              label: "Escrow Held",
              value: `$${(escrowHeld / 1000).toFixed(0)}K`,
              icon: Wallet,
              color: "text-amber-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-os-surface-1 border border-os-stroke"
            >
              <stat.icon className={cn("h-5 w-5", stat.color)} />
              <div>
                <p className="text-lg font-bold text-[var(--os-text-primary)] tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[10px] text-os-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SYSTEM INTELLIGENCE LAYER */}
        {advice.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {advice.map((item, idx) => (
              <SystemAdvice key={item.id || idx} advice={item} type={item.type} />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-os-muted" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </Surface>

      {/* LIVING EMPTY STATE */}
      {orders.length === 0 && !loading ? (
        <div className="animate-in fade-in duration-700">
          <SimulationState onActivate={handleActivateSimulation} />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const status = statusLabels[order.status] || {
              label: order.status,
              tone: "neutral",
            };
            const completedMilestones = (order.milestones || []).filter(
              (milestone) => milestone.status === "completed"
            ).length;
            const progress =
              order.milestones && order.milestones.length > 0
                ? (completedMilestones / order.milestones.length) * 100
                : 0;

            return (
              <Surface
                key={order.id}
                variant="panel"
                className="p-6 hover:bg-os-surface-2 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-[var(--os-text-primary)]">
                        {order.product_name || 'Order'}
                      </h3>
                      <StatusBadge label={status.label} tone={status.tone} />
                      {order.corridor && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            order.corridor.risk === "low" &&
                            "bg-emerald-500/10 text-emerald-500",
                            order.corridor.risk === "medium" &&
                            "bg-amber-500/10 text-amber-500",
                            order.corridor.risk === "high" &&
                            "bg-red-500/10 text-red-500"
                          )}
                        >
                          {order.corridor.risk} risk
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-os-muted">
                      <span className="font-mono text-xs opacity-70">{order.id}</span>
                      {order.corridor && <>
                        <span>·</span>
                        <span>{order.corridor.originCountry}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{order.corridor.destinationCountry}</span>
                      </>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[var(--os-text-primary)] tabular-nums">
                      ${order.total_value?.toLocaleString?.() || '0'}
                    </p>
                    <p className="text-xs text-os-muted">
                      {(order.quantity || 0).toLocaleString()} {order.unit || ''} @ ${order.unit_price || 0}/{order.unit || ''}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-os-muted">
                      Fulfillment Progress
                    </span>
                    <span className="text-xs font-medium text-[var(--os-text-primary)] tabular-nums">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(order.milestones || []).map((milestone) => (
                    <span
                      key={milestone.id}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                        milestone.status === "completed" &&
                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        milestone.status === "in_progress" &&
                        "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse-glow",
                        milestone.status === "pending" &&
                        "bg-os-surface-0 text-os-muted border-os-stroke"
                      )}
                    >
                      {milestone.status === "completed" && (
                        <CheckCircle2 className="h-3 w-3 inline mr-0.5" />
                      )}
                      {milestone.name}
                    </span>
                  ))}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
