import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  MessageSquare,
  Wallet,
  Package,
  Building2,
  Receipt,
  RotateCcw,
  BarChart3,
  Shield,
  HelpCircle,
  Settings,
  Users as UsersIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// Buyer menu structure with hierarchy:
// PRIMARY: Daily workflow items (always visible)
// SECONDARY: Collapsible "Manage" section
// TERTIARY: Collapsed "Insights & Protection" section
// SUPPORT: Help section (bottom, separated)

export const buyerNav = [
  // 🔥 PRIMARY - Daily workflow (always visible)
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', priority: 'primary' },
  { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs', priority: 'primary' },
  { icon: MessageSquare, label: 'Messages', path: '/messages', priority: 'primary' },
  { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders', priority: 'primary' },
  { icon: Wallet, label: 'Payments', path: '/dashboard/payments', priority: 'primary' },
  
  // 🧩 SECONDARY - Manage section (collapsible)
  { 
    icon: Building2, 
    label: 'Manage', 
    path: null, 
    priority: 'secondary',
    isSection: true,
    children: [
      { icon: Package, label: 'Saved Products', path: '/dashboard/saved' },
      { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: UsersIcon, label: 'Team Members', path: '/dashboard/team' },
      { icon: Receipt, label: 'Invoices', path: '/dashboard/invoices' },
      { icon: RotateCcw, label: 'Returns', path: '/dashboard/returns' },
    ]
  },
  
  // 🛡️ TERTIARY - Insights & Protection (collapsed by default)
  { 
    icon: BarChart3, 
    label: 'Insights & Protection', 
    path: null, 
    priority: 'tertiary',
    isSection: true,
    collapsedByDefault: true,
    children: [
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: Shield, label: 'Trade Protection', path: '/dashboard/protection' },
      { icon: Shield, label: 'Disputes', path: '/dashboard/disputes' },
    ]
  },
  
  // 💬 SUPPORT - Help section (bottom, separated)
  { icon: HelpCircle, label: 'Support Chat', path: '/dashboard/support-chat', priority: 'support' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' },
];





