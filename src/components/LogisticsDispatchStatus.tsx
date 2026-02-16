/**
 * Logistics Dispatch Status Component
 * 
 * Read-only UI component for displaying dispatch status on trade detail pages.
 * Shows real-time updates via Supabase Realtime subscriptions.
 */

import React, { useEffect, useState } from 'react';
import { Truck, Package, CheckCircle, Clock, Search } from 'lucide-react';
import {
  getDispatchStatus,
  subscribeToDispatchUpdates,
  type DispatchEvent,
  type LogisticsProvider,
} from '@/services/logisticsDispatchService';

interface LogisticsDispatchStatusProps {
  tradeId: string;
  className?: string;
}

export const LogisticsDispatchStatus: React.FC<LogisticsDispatchStatusProps> = ({
  tradeId,
  className = '',
}) => {
  const [status, setStatus] = useState<{
    status: 'idle' | 'searching' | 'assigned' | 'in_transit' | 'delivered';
    message: string;
    provider?: LogisticsProvider;
    events: DispatchEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToDispatchUpdates(tradeId, () => {
      loadStatus(); // Reload status when new events arrive
    });

    return unsubscribe;
  }, [tradeId]);

  const loadStatus = async () => {
    try {
      const result = await getDispatchStatus(tradeId);
      setStatus(result);
    } catch (error) {
      console.error('[LogisticsDispatchStatus] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'idle':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'searching':
        return <Search className="w-5 h-5 text-os-blue animate-pulse" />;
      case 'assigned':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'in_transit':
        return <Truck className="w-5 h-5 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-os-green" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'idle':
        return 'bg-gray-50 border-gray-200';
      case 'searching':
        return 'bg-blue-50 border-blue-200';
      case 'assigned':
        return 'bg-yellow-50 border-yellow-200';
      case 'in_transit':
        return 'bg-orange-50 border-orange-200';
      case 'delivered':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`rounded-lg border ${getStatusColor()} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-os-sm font-medium text-gray-900">Logistics Status</h4>
            {status.status === 'searching' && (
              <span className="text-os-xs text-blue-600 font-medium">Finding providers...</span>
            )}
          </div>
          
          <p className="text-os-sm text-gray-600 mt-1">{status.message}</p>

          {status.provider && (
            <div className="mt-3 p-3 bg-white rounded border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-os-xs text-gray-500">Assigned Provider</p>
                  <p className="text-os-sm font-medium text-gray-900 mt-0.5">
                    {status.provider.company_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-os-xs text-gray-500">Location</p>
                  <p className="text-os-sm font-medium text-gray-900 mt-0.5">
                    {status.provider.city}
                  </p>
                </div>
              </div>
              
              {status.provider.vehicle_types.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {status.provider.vehicle_types.map((vehicle) => (
                    <span
                      key={vehicle}
                      className="inline-flex items-center px-2 py-1 rounded text-os-xs bg-gray-100 text-gray-700"
                    >
                      {vehicle}
                    </span>
                  ))}
                </div>
              )}

              {status.provider.response_score && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-os-xs text-gray-500">
                    <span>Response Score</span>
                    <span className="font-medium text-gray-900">
                      {(status.provider.response_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${status.provider.response_score * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Timeline (Optional - show last 3 events) */}
          {status.events.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-os-xs text-gray-500 font-medium">Recent Activity</p>
              {status.events.slice(0, 3).map((event, idx) => (
                <div key={event.id} className="flex items-center gap-2 text-os-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="text-gray-600">
                    {formatEventType(event.event_type)}
                  </span>
                  <span className="text-gray-400">
                    {formatTimeAgo(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    DISPATCH_REQUESTED: 'Dispatch requested',
    PROVIDER_NOTIFIED: 'Provider contacted',
    PROVIDER_ACCEPTED: 'Provider accepted',
    PROVIDER_REJECTED: 'Provider declined',
    SHIPMENT_ASSIGNED: 'Pickup assigned',
  };
  return labels[type] || type;
}

function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
