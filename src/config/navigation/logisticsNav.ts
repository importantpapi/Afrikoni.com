import {
  LayoutDashboard,
  Sparkles,
  Truck,
  Warehouse,
  FileText,
  MessageSquare,
  Building2,
  BarChart3,
  Wallet,
  Settings,
  AlertTriangle,
} from 'lucide-react';

export const logisticsNav = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/logistics' },
  { icon: Sparkles, label: 'KoniAI', path: '/dashboard/koniai' },
  { icon: Truck, label: 'Shipments', path: '/dashboard/shipments' },
  { icon: Truck, label: 'Logistics Overview', path: '/dashboard/logistics' },
  { icon: Warehouse, label: 'Fulfillment', path: '/dashboard/fulfillment' },
  { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
  { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Wallet, label: 'Payments', path: '/dashboard/payments' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  { icon: AlertTriangle, label: 'Risk & Compliance', path: '/dashboard/risk' },
];





