/**
 * Shipment Tracking Panel
 * States: PRODUCTION → PICKUP_SCHEDULED → IN_TRANSIT → DELIVERED
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, Truck, Package, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { TRADE_STATE } from '@/services/tradeKernel';

const SHIPMENT_MILESTONES = [
  { state: 'pending', label: 'Pending', icon: Package },
  { state: 'pickup_scheduled', label: 'Pickup Scheduled', icon: Clock },
  { state: 'in_transit', label: 'In Transit', icon: Truck },
  { state: 'delivered', label: 'Delivered', icon: CheckCircle2 }
];

export default function ShipmentTrackingPanel({ trade, onNextStep, isTransitioning, capabilities, profile }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSeller = profile?.company_id === trade?.seller_id;
  const isLogistics = capabilities?.can_logistics;

  useEffect(() => {
    loadShipment();
  }, [trade?.id]);

  async function loadShipment() {
    try {
      const { data } = await supabase
        .from('shipments')
        .select('*')
        .eq('trade_id', trade.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setShipment(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-os-sm">Loading logistics...</div>;

  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md">
      <CardContent className="p-6">
        <h2 className="text-os-xl font-semibold mb-4 text-white">Logistics Orchestration</h2>

        <div className="flex justify-between mb-8">
          {SHIPMENT_MILESTONES.map((m, i) => (
            <div key={m.state} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${shipment?.status === m.state ? 'bg-os-accent' : 'bg-white/5'}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <span className="text-os-xs text-white/50">{m.label}</span>
            </div>
          ))}
        </div>

        {shipment && (
          <div className="bg-black/20 p-4 rounded-os-sm border border-white/5 mb-6">
            <p className="text-os-xs text-white/40 uppercase">Tracking Number</p>
            <p className="text-os-sm font-mono mt-1 text-os-accent">{shipment.tracking_number}</p>
          </div>
        )}

        {/* Seller / Logistics Actions */}
        {(isSeller || isLogistics) && (
          <div className="space-y-3 pt-6 border-t border-white/5">
            {trade.status === TRADE_STATE.ESCROW_FUNDED && capabilities?.can_sell && (
              <Button onClick={() => onNextStep(TRADE_STATE.PRODUCTION)} disabled={isTransitioning} className="w-full bg-emerald-500">
                Start Production
              </Button>
            )}
            {trade.status === TRADE_STATE.PRODUCTION && capabilities?.can_sell && (
              <Button onClick={() => onNextStep(TRADE_STATE.PICKUP_SCHEDULED)} disabled={isTransitioning} className="w-full bg-blue-500">
                Schedule Pickup
              </Button>
            )}
            {trade.status === TRADE_STATE.PICKUP_SCHEDULED && (capabilities?.can_sell || capabilities?.can_logistics) && (
              <Button onClick={() => onNextStep(TRADE_STATE.IN_TRANSIT)} disabled={isTransitioning} className="w-full bg-os-accent">
                Mark as Shipped
              </Button>
            )}
          </div>
        )}

        {/* Buyer Actions */}
        {!isSeller && trade.status === TRADE_STATE.IN_TRANSIT && capabilities?.can_buy && (
          <Button onClick={() => onNextStep(TRADE_STATE.DELIVERED)} disabled={isTransitioning} className="w-full">
            Confirm Delivery
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
