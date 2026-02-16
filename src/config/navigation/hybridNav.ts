import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  MessageSquare,
  Wallet,
  Package,
  Truck,
  Receipt,
  RotateCcw,
  Building,
  Users as UsersIcon,
  BarChart3,
  TrendingUp,
  Shield,
  Star as StarIcon,
  Sparkles,
  HelpCircle,
  Settings,
} from 'lucide-react';

// Hybrid menu structure:
// PRIMARY: Core workflow items (always visible, role-agnostic)
// SECONDARY: Collapsible "Manage" section (operational tools)
// TERTIARY: Collapsed "Insights" section
// SUPPORT: Help & verification (bottom, separated)
// Note: Menu changes entirely when role switches via activeView prop

export const hybridNav = [
  // 🔥 PRIMARY - Core workflow (always visible, works for both buyer and seller)
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', priority: 'primary' },
  { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs', priority: 'primary' },
  { icon: MessageSquare, label: 'Messages', path: '/messages', priority: 'primary' },
  { icon: ShoppingCart, label: 'Orders & Sales', path: '/dashboard/orders', priority: 'primary' },
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
      { icon: Building, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: UsersIcon, label: 'Team Members', path: '/dashboard/team' },
    ]
  },

  // 🛡️ TERTIARY - Insights (collapsed by default)
  {
    icon: BarChart3,
    label: 'Insights',
    path: null,
    priority: 'tertiary',
    isSection: true,
    collapsedByDefault: true,
    children: [
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: TrendingUp, label: 'Performance Metrics', path: '/dashboard/performance' },
      { icon: StarIcon, label: 'Trust & Reviews', path: '/dashboard/reviews' },
    ]
  },

  // 💬 SUPPORT - Help & verification (bottom, separated)
  { icon: Shield, label: 'Verification', path: '/dashboard/verification-center', priority: 'support' },
  { icon: HelpCircle, label: 'Support Chat', path: '/dashboard/support-chat', priority: 'support' },
  { icon: Shield, label: 'Disputes', path: '/dashboard/disputes', priority: 'support' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' },
];









