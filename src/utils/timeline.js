/**
 * Centralized Timeline Building Helpers
 * 
 * Provides timeline builders for:
 * - Orders
 * - Shipments
 */

import {
  ShoppingCart, Package, Truck, CheckCircle, Clock,
  DollarSign, X, AlertCircle
} from 'lucide-react';
import { ORDER_STATUS, SHIPMENT_STATUS, SHIPMENT_STATUS_ORDER } from '@/constants/status';

/**
 * Build order timeline
 */
export function buildOrderTimeline(order, shipment = null) {
  const timeline = [];
  
  // Order created
  timeline.push({
    id: 'created',
    title: 'Order Created',
    description: 'Order was placed',
    timestamp: order.created_at,
    icon: ShoppingCart,
    status: 'completed'
  });
  
  // Payment status
  if (order.payment_status === 'paid') {
    timeline.push({
      id: 'paid',
      title: 'Payment Received',
      description: `Payment of ${order.currency} ${parseFloat(order.total_amount || order.total || 0).toLocaleString()} received`,
      timestamp: order.updated_at,
      icon: DollarSign,
      status: 'completed'
    });
  } else {
    timeline.push({
      id: 'payment_pending',
      title: 'Payment Pending',
      description: 'Awaiting payment',
      timestamp: order.created_at,
      icon: Clock,
      status: 'pending'
    });
  }
  
  // Order status updates
  if (order.status === ORDER_STATUS.PROCESSING) {
    timeline.push({
      id: 'processing',
      title: 'Order Processing',
      description: 'Seller is preparing your order',
      timestamp: order.updated_at,
      icon: Package,
      status: 'completed'
    });
  }
  
  if (order.status === ORDER_STATUS.SHIPPED) {
    timeline.push({
      id: 'shipped',
      title: 'Order Shipped',
      description: shipment?.tracking_number ? `Tracking: ${shipment.tracking_number}` : 'Order has been shipped',
      timestamp: shipment?.updated_at || order.updated_at,
      icon: Truck,
      status: 'completed'
    });
  }
  
  if (order.status === ORDER_STATUS.DELIVERED) {
    timeline.push({
      id: 'delivered',
      title: 'Order Delivered',
      description: 'Order has been delivered',
      timestamp: order.delivery_date || order.updated_at,
      icon: CheckCircle,
      status: 'completed'
    });
  }
  
  if (order.status === ORDER_STATUS.COMPLETED) {
    timeline.push({
      id: 'completed',
      title: 'Order Completed',
      description: 'Order has been completed',
      timestamp: order.updated_at,
      icon: CheckCircle,
      status: 'completed'
    });
  }
  
  if (order.status === ORDER_STATUS.CANCELLED) {
    timeline.push({
      id: 'cancelled',
      title: 'Order Cancelled',
      description: 'Order has been cancelled',
      timestamp: order.updated_at,
      icon: X,
      status: 'cancelled'
    });
  }
  
  return timeline;
}

/**
 * Build shipment timeline
 */
export function buildShipmentTimeline(shipment) {
  if (!shipment) return [];
  
  const timeline = [];
  const currentStatusIndex = SHIPMENT_STATUS_ORDER.indexOf(shipment.status);
  
  SHIPMENT_STATUS_ORDER.forEach((status, index) => {
    const isCompleted = index <= currentStatusIndex;
    const isCurrent = index === currentStatusIndex;
    
    const statusLabels = {
      [SHIPMENT_STATUS.PENDING_PICKUP]: 'Pickup Scheduled',
      [SHIPMENT_STATUS.PICKED_UP]: 'Picked Up',
      [SHIPMENT_STATUS.IN_TRANSIT]: 'In Transit',
      [SHIPMENT_STATUS.CUSTOMS]: 'In Customs',
      [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [SHIPMENT_STATUS.DELIVERED]: 'Delivered'
    };
    
    timeline.push({
      status,
      label: statusLabels[status] || status,
      completed: isCompleted,
      current: isCurrent,
      date: shipment.updated_at && isCompleted ? shipment.updated_at : null
    });
  });
  
  return timeline;
}

