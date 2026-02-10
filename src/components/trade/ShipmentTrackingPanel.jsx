/**
 * Shipment Tracking Panel
 * States: PRODUCTION → PICKUP_SCHEDULED → IN_TRANSIT → DELIVERED
 * 
 * Tracks shipment progress from production through delivery.
 * Events are logged as milestones are hit.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, Truck, MapPin, Package, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';

const SHIPMENT_MILESTONES = [
  { state: 'pending', label: 'Pending', icon: Package },
  { state: 'pickup_scheduled', label: 'Pickup Scheduled', icon: Clock },
  { state: 'pickup_confirmed', label: 'Pickup Confirmed', icon: Package },
  { state: 'in_transit', label: 'In Transit', icon: Truck },
  { state: 'delivery_scheduled', label: 'Delivery Scheduled', icon: Clock },
  { state: 'delivered', label: 'Delivered', icon: CheckCircle2 }
];

export default function ShipmentTrackingPanel({ trade, onNextStep, isTransitioning }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipment();
    
    // Poll for shipment updates every 10 seconds
    const interval = setInterval(loadShipment, 10000);
    return () => clearInterval(interval);
  }, [trade?.id]);

  async function loadShipment() {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('trade_id', trade.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setShipment(data || null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeliveryConfirmed() {
    await onNextStep(TRADE_STATE.DELIVERED, {
      shipmentId: shipment?.id,
      deliveredAt: new Date()
    });
  }

  if (loading) {
    return (
      <Card className="border rounded-2xl">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <p className="text-sm mt-2">Loading shipment details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!shipment) {
    return (
      <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <CardContent className="p-6 text-center">
          <Package className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">Preparing Shipment</p>
          <p className="text-sm mt-1">
            Supplier is producing goods. Shipment details will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentMilestoneIdx = SHIPMENT_MILESTONES.findIndex(m => m.state === shipment.status);

  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            Track Shipment
          </h2>
          <p className="text-sm mt-1">
            Monitor your goods from production to delivery.
          </p>
        </div>

        {/* Shipment Progress Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {SHIPMENT_MILESTONES.map((milestone, idx) => {
              const isCompleted = idx <= currentMilestoneIdx;
              const isCurrent = idx === currentMilestoneIdx;
              const Icon = milestone.icon;

              return (
                <div key={milestone.state} className="flex-1 flex flex-col items-center">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all
                      ${isCompleted ? 'bg-emerald-400/10' : 'bg-white/5'}
                      ${isCurrent ? 'ring-2 ring-afrikoni-gold scale-110' : ''}
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isCompleted ? 'text-emerald-200' : 'text-white/40'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <p
                    className={`text-xs font-medium text-center
                      ${isCompleted ? 'text-emerald-200' : 'text-white/50'}
                    `}
                  >
                    {milestone.label}
                  </p>

                  {/* Connector */}
                  {idx < SHIPMENT_MILESTONES.length - 1 && (
                    <div
                      className={`absolute h-1 w-full mt-5 -translate-x-1/2 left-1/2
                        ${isCompleted && idx < currentMilestoneIdx ? 'bg-emerald-400/60' : 'bg-white/10'}
                      `}
                      style={{
                        width: `calc(100% - 40px)`,
                        transform: 'translateX(50%)',
                        zIndex: -1
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipment Details */}
        {shipment && (
          <div className="rounded-xl p-4 mb-6 border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {shipment.tracking_number && (
                <div>
                  <p className="">Tracking Number</p>
                  <p className="font-mono font-semibold">
                    {shipment.tracking_number}
                  </p>
                </div>
              )}
              {shipment.carrier_name && (
                <div>
                  <p className="">Carrier</p>
                  <p className="font-semibold">
                    {shipment.carrier_name}
                  </p>
                </div>
              )}
              {shipment.actual_pickup_date && (
                <div>
                  <p className="">Picked Up</p>
                  <p className="font-semibold">
                    {new Date(shipment.actual_pickup_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {shipment.scheduled_delivery_date && (
                <div>
                  <p className="">Expected Delivery</p>
                  <p className="font-semibold">
                    {new Date(shipment.scheduled_delivery_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivered - Confirm Receipt */}
        {shipment?.status === 'delivered' && trade.status !== 'delivered' && (
          <Button
            onClick={handleDeliveryConfirmed}
            disabled={isTransitioning}
            className="w-full hover:bg-emerald-300 font-semibold"
          >
            {isTransitioning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming...</>
            ) : (
              '✓ Confirm Delivery Received'
            )}
          </Button>
        )}

        {/* Status Badge */}
        <div className="mt-6 pt-6 border-t">
          <Badge className="capitalize border">
            {shipment.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
