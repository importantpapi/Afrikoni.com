import {
  LayoutDashboard,
  Truck,
  Warehouse,
  MessageSquare,
  Building2,
  BarChart3,
  Wallet,
  Settings,
} from 'lucide-react';

// Logistics menu structure:
// PRIMARY: Core operational workflow (always visible)
// SECONDARY: Management & settings (collapsible)
// Note: Logistics users are professional and tolerate more complexity
// Keep functional, don't over-polish (lowest priority per user feedback)

export const logisticsNav = [
  // 🔥 PRIMARY - Core operational workflow
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/logistics', priority: 'primary' },
  { icon: Truck, label: 'Shipments', path: '/dashboard/shipments', priority: 'primary' },
  { icon: Warehouse, label: 'Fulfillment', path: '/dashboard/fulfillment', priority: 'primary' },
  { icon: MessageSquare, label: 'Messages', path: '/messages', priority: 'primary' },
  { icon: Wallet, label: 'Payments', path: '/dashboard/payments', priority: 'primary' },
  
  // 🧩 SECONDARY - Management (collapsible)
  { 
    icon: Building2, 
    label: 'Manage', 
    path: null, 
    priority: 'secondary',
    isSection: true,
    children: [
      { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    ]
  },
];









