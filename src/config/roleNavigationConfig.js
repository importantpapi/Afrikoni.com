import {
    LayoutDashboard, GitBranch, MessageSquare, FileText, ShoppingCart,
    Package, Truck, Wallet, Shield, Settings, HelpCircle, BarChart3,
    Building, Globe, Landmark, Bell, LogOut, Lock, CheckCircle2, AlertCircle,
    Target, Sparkles, Star, Users, User, Receipt
} from 'lucide-react';

export const getRoleNavigation = ({
    capabilities = {},
    workspaceMode = 'simple',
    notificationCounts = {},
    isAdmin = false,
    isActivated = false,
    isSourcing = true,
    isDistribution = false
}) => {
    const isSeller = capabilities?.can_sell === true;
    const isTrader = capabilities?.displayRole === 'Unified Trader' || capabilities?.role === 'trader';

    // 🏛️ AFRIKONI 2026: The Operational Pillars
    // Mission: Simplified Trade OS navigation.
    const sections = [
        {
            id: 'navigation',
            label: 'Navigation',
            items: [
                {
                    id: 'home',
                    label: 'Dashboard Home',
                    path: '/dashboard',
                    icon: LayoutDashboard,
                    activeMatch: (path) => path === '/dashboard' || path === '/dashboard/'
                },
                !isActivated && {
                    id: 'quick-start',
                    label: 'Start Trade in <30s (NG -> GH)',
                    path: '/dashboard/quick-trade?corridor=NG-GH&first=true',
                    icon: Sparkles,
                    activeMatch: (path) => path.startsWith('/dashboard/quick-trade')
                },
                {
                    id: 'pipeline',
                    label: 'Trade Pipeline',
                    path: '/dashboard/trade-pipeline',
                    icon: GitBranch,
                    activeMatch: (path) => path.startsWith('/dashboard/trade-pipeline'),
                    hidden: !isActivated
                },
                // --- SOURCING TOOLS ---
                isSourcing && {
                    id: 'rfqs',
                    label: 'Sourcing Inquiries',
                    path: '/dashboard/rfqs',
                    icon: FileText,
                    activeMatch: (path) => path.startsWith('/dashboard/rfqs') && !path.includes('/new'),
                    hidden: !isActivated
                },
                isSourcing && {
                    id: 'orders-buying',
                    label: 'My Orders',
                    path: '/dashboard/orders',
                    icon: ShoppingCart,
                    badge: notificationCounts.buying_orders || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/trades') || path.startsWith('/dashboard/orders')
                },
                // --- DISTRIBUTION TOOLS ---
                isDistribution && {
                    id: 'products',
                    label: 'Inventory',
                    path: '/dashboard/products',
                    icon: Package,
                    activeMatch: (path) => path.startsWith('/dashboard/products'),
                    hidden: !isActivated
                },
                isDistribution && {
                    id: 'orders',
                    label: 'Orders Received',
                    path: '/dashboard/sales',
                    icon: ShoppingCart,
                    badge: notificationCounts.orders || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/trades') || path.startsWith('/dashboard/orders'),
                    hidden: !isActivated
                },
                isDistribution && {
                    id: 'rfqs-received',
                    label: 'RFQs Received',
                    path: '/dashboard/supplier-rfqs',
                    icon: FileText,
                    activeMatch: (path) => path.startsWith('/dashboard/supplier-rfqs'),
                    hidden: !isActivated
                },
                {
                    id: 'marketplace',
                    label: 'Marketplace',
                    path: '/marketplace',
                    icon: Globe,
                    activeMatch: (path) => path.startsWith('/marketplace'),
                    hidden: !isActivated
                },
                // --- COMMON SHARED TOOLS ---
                {
                    id: 'messages',
                    label: 'Messages',
                    path: '/dashboard/messages',
                    icon: MessageSquare,
                    badge: notificationCounts.messages || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/messages')
                },
                {
                    id: 'payments',
                    label: 'Payments',
                    path: '/dashboard/payments',
                    icon: Wallet,
                    activeMatch: (path) => path.startsWith('/dashboard/wallet') || path.startsWith('/dashboard/payments')
                },
                {
                    id: 'invoices',
                    label: 'Invoices',
                    path: '/dashboard/invoices',
                    icon: Receipt,
                    activeMatch: (path) => path.startsWith('/dashboard/invoices')
                },
                {
                    id: 'shipments',
                    label: 'Logistics',
                    path: '/dashboard/shipments',
                    icon: Truck,
                    activeMatch: (path) => path.startsWith('/dashboard/shipments'),
                    hidden: !isActivated
                }
            ].filter(item => item && !item.hidden)
        },
        {
            id: 'intelligence',
            divider: true,
            label: 'Intelligence',
            items: [
                {
                    id: 'analytics',
                    label: 'Analytics',
                    path: '/dashboard/analytics',
                    icon: BarChart3,
                    activeMatch: (path) => path.startsWith('/dashboard/analytics'),
                    hidden: !isActivated
                },
                {
                    id: 'performance',
                    label: 'Performance Metrics',
                    path: '/dashboard/performance',
                    icon: Target,
                    activeMatch: (path) => path.startsWith('/dashboard/performance'),
                    hidden: !isActivated
                },
                {
                    id: 'koniai',
                    label: 'KoniAI Assistant',
                    path: '/dashboard/koniai',
                    icon: Sparkles,
                    activeMatch: (path) => path.startsWith('/dashboard/koniai'),
                    hidden: !isActivated
                }
            ].filter(item => item && !item.hidden),
            hidden: !isActivated
        },
        {
            id: 'trust-compliance',
            divider: true,
            label: 'Trust & Compliance',
            items: [
                {
                    id: 'reviews',
                    label: 'Reviews & Trust',
                    path: '/dashboard/reviews',
                    icon: Star,
                    activeMatch: (path) => path.startsWith('/dashboard/reviews'),
                    hidden: !isActivated
                },
                {
                    id: 'disputes',
                    label: 'Disputes',
                    path: '/dashboard/disputes',
                    icon: AlertCircle,
                    activeMatch: (path) => path.startsWith('/dashboard/disputes')
                },
                {
                    id: 'kyc',
                    label: 'KYC Verification',
                    path: '/dashboard/kyc',
                    icon: Shield,
                    activeMatch: (path) => path.startsWith('/dashboard/kyc'),
                    hidden: !isActivated
                },
                {
                    id: 'compliance',
                    label: 'Compliance',
                    path: '/dashboard/compliance',
                    icon: Lock,
                    activeMatch: (path) => path.startsWith('/dashboard/compliance'),
                    hidden: !isActivated
                }
            ].filter(item => item && !item.hidden)
        },
        {
            id: 'settings-section',
            divider: true,
            label: 'Settings',
            items: [
                {
                    id: 'settings',
                    label: 'Settings',
                    path: '/dashboard/settings',
                    icon: Settings,
                    activeMatch: (path) => path === '/dashboard/settings'
                },
                {
                    id: 'company',
                    label: 'Company Info',
                    path: '/dashboard/company-info',
                    icon: Building,
                    activeMatch: (path) => path.startsWith('/dashboard/company-info')
                },
                {
                    id: 'team',
                    label: 'Team Members',
                    path: '/dashboard/team-members',
                    icon: Users,
                    activeMatch: (path) => path.startsWith('/dashboard/team-members')
                },
                {
                    id: 'help',
                    label: 'Help & Support',
                    path: '/dashboard/help',
                    icon: HelpCircle,
                    activeMatch: (path) => path.startsWith('/dashboard/help') || path.startsWith('/dashboard/support')
                }
            ].filter(Boolean)
        },
        isAdmin && {
            id: 'admin',
            divider: true,
            label: 'Administration',
            items: [
                {
                    id: 'admin-payouts',
                    label: 'Payouts',
                    path: '/dashboard/admin/payouts',
                    icon: Wallet,
                    activeMatch: (path) => path.startsWith('/dashboard/admin/payouts')
                },
                {
                    id: 'admin-disputes',
                    label: 'Disputes',
                    path: '/dashboard/admin/disputes',
                    icon: Shield,
                    activeMatch: (path) => path.startsWith('/dashboard/admin/disputes')
                }
            ].filter(Boolean)
        }
    ].filter(section => !section.hidden && section.items?.length > 0);

    const systemApps = [
        {
            id: 'settings',
            label: 'Settings',
            path: '/dashboard/settings',
            icon: Settings,
            activeMatch: (path) => path.startsWith('/dashboard/settings') || path.startsWith('/dashboard/company-info') || path.startsWith('/dashboard/team-members')
        },
        {
            id: 'help',
            label: 'Help',
            path: '/dashboard/help',
            icon: HelpCircle,
            activeMatch: (path) => path.startsWith('/dashboard/help') || path.startsWith('/dashboard/support')
        },
        {
            id: 'website',
            label: 'Exit to Website',
            path: '/',
            icon: LogOut,
            activeMatch: () => false
        }
    ];

    return { sections, systemApps };
};
