/**
 * Real-Time Tracking Component
 * Displays live tracking events with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Package, CheckCircle, AlertCircle, Truck, Globe } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent } from '@/components/shared/ui/card';

const EVENT_ICONS = {
  created: Package,
  picked_up: Truck,
  in_transit: Truck,
  arrived_at_facility: MapPin,
  departed_facility: Truck,
  in_customs: Globe,
  customs_cleared: CheckCircle,
  out_for_delivery: Truck,
  delivery_attempted: AlertCircle,
  delivered: CheckCircle,
  exception: AlertCircle,
  delay: Clock,
  returned: Package
};

const EVENT_COLORS = {
  created: 'text-blue-600 bg-blue-50',
  picked_up: 'text-blue-600 bg-blue-50',
  in_transit: 'text-purple-600 bg-purple-50',
  arrived_at_facility: 'text-indigo-600 bg-indigo-50',
  departed_facility: 'text-indigo-600 bg-indigo-50',
  in_customs: 'text-orange-600 bg-orange-50',
  customs_cleared: 'text-green-600 bg-green-50',
  out_for_delivery: 'text-indigo-600 bg-indigo-50',
  delivery_attempted: 'text-yellow-600 bg-yellow-50',
  delivered: 'text-green-600 bg-green-50',
  exception: 'text-red-600 bg-red-50',
  delay: 'text-yellow-600 bg-yellow-50',
  returned: 'text-red-600 bg-red-50'
};

export default function RealTimeTracking({ shipmentId }) {
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (!shipmentId) return;

    loadTrackingEvents();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`tracking:${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_tracking_events',
          filter: `shipment_id=eq.${shipmentId}`
        },
        (payload) => {
          setTrackingEvents(prev => [payload.new, ...prev].sort((a, b) => 
            new Date(b.event_timestamp) - new Date(a.event_timestamp)
          ));
          setCurrentLocation(payload.new.location);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  const loadTrackingEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shipment_tracking_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('event_timestamp', { ascending: false });

      if (error) throw error;

      setTrackingEvents(data || []);
      if (data && data.length > 0) {
        setCurrentLocation(data[0].location);
      }
    } catch (error) {
      console.error('Error loading tracking events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (trackingEvents.length === 0) {
    return (
      <Card className="border-afrikoni-gold/20">
        <CardContent className="p-6 text-center">
          <Package className="w-12 h-12 text-afrikoni-gold/50 mx-auto mb-3" />
          <p className="text-sm text-afrikoni-text-dark/70">
            No tracking events yet. Updates will appear here in real-time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Location */}
      {currentLocation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-afrikoni-gold" />
            </div>
            <div>
              <p className="text-xs text-afrikoni-text-dark/70">Current Location</p>
              <p className="font-semibold text-afrikoni-text-dark">{currentLocation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tracking Timeline */}
      <div className="space-y-3">
        <AnimatePresence>
          {trackingEvents.map((event, index) => {
            const Icon = EVENT_ICONS[event.event_type] || Package;
            const colorClass = EVENT_COLORS[event.event_type] || 'text-gray-600 bg-gray-50';
            const isLatest = index === 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`relative flex gap-4 ${isLatest ? 'pb-4' : 'pb-3'}`}
              >
                {/* Timeline Line */}
                {index < trackingEvents.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-afrikoni-gold/20" />
                )}

                {/* Icon */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${colorClass} ${isLatest ? 'ring-2 ring-afrikoni-gold' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-afrikoni-text-dark">
                          {event.description || event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        {isLatest && (
                          <Badge className="bg-afrikoni-gold text-afrikoni-chestnut text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      {event.location && (
                        <p className="text-xs text-afrikoni-text-dark/70 flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      )}
                      <p className="text-xs text-afrikoni-text-dark/60">
                        {format(new Date(event.event_timestamp), 'MMM d, yyyy • h:mm a')}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-afrikoni-text-dark/70 mt-1 italic">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

