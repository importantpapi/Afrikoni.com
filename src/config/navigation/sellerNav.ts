import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ShoppingCart,
  Wallet,
  Package,
  Truck,
  Receipt,
  RotateCcw,
  Building2,
  Users as UsersIcon,
  BarChart3,
  TrendingUp,
  Shield,
  Star as StarIcon,
  Sparkles,
  HelpCircle,
  Settings,
} from 'lucide-react';

// Seller menu structure with hierarchy:
// PRIMARY: Daily operational workflow (always visible)
// SECONDARY: Collapsible "Manage" section (operational tools)
// TERTIARY: Collapsed "Insights & Growth" section
// SUPPORT: Help & verification (bottom, separated)

export const sellerNav = [
  // 🔥 PRIMARY - Daily operational workflow (always visible)
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', priority: 'primary' },
  { icon: FileText, label: 'RFQs Received', path: '/dashboard/rfqs', priority: 'primary' },
  { icon: MessageSquare, label: 'Messages', path: '/messages', priority: 'primary' },
  { icon: ShoppingCart, label: 'Sales', path: '/dashboard/sales', priority: 'primary' },
  { icon: Wallet, label: 'Payments', path: '/dashboard/payments', priority: 'primary' },
  
  // 🧩 SECONDARY - Manage section (collapsible, operational tools)
  { 
    icon: Package, 
    label: 'Manage', 
    path: null, 
    priority: 'secondary',
    isSection: true,
    children: [
      { icon: Package, label: 'Products', path: '/dashboard/products' },
      { icon: Truck, label: 'Fulfillment', path: '/dashboard/fulfillment' },
      { icon: Receipt, label: 'Invoices', path: '/dashboard/invoices' },
      { icon: RotateCcw, label: 'Returns', path: '/dashboard/returns' },
      { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: UsersIcon, label: 'Team Members', path: '/dashboard/team' },
      { icon: Package, label: 'Saved Products', path: '/dashboard/saved' },
    ]
  },
  
  // 🛡️ TERTIARY - Insights & Growth (collapsed by default)
  { 
    icon: BarChart3, 
    label: 'Insights & Growth', 
    path: null, 
    priority: 'tertiary',
    isSection: true,
    collapsedByDefault: true,
    children: [
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: TrendingUp, label: 'Performance Metrics', path: '/dashboard/performance' },
      { icon: StarIcon, label: 'Trust & Reviews', path: '/dashboard/reviews' },
      { icon: Sparkles, label: 'Subscriptions', path: '/dashboard/subscriptions' },
    ]
  },
  
  // 💬 SUPPORT - Help & verification (bottom, separated)
  { icon: Shield, label: 'Verification', path: '/verification-center', priority: 'support' },
  { icon: HelpCircle, label: 'Support Chat', path: '/dashboard/support-chat', priority: 'support' },
  { icon: Shield, label: 'Disputes', path: '/dashboard/disputes', priority: 'support' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' },
];







