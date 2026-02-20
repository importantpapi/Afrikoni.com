import {
    LayoutDashboard, GitBranch, MessageSquare, FileText, ShoppingCart,
    Package, Truck, Wallet, Shield, Settings, HelpCircle, BarChart3,
    Building, Globe, Landmark, Bell, LogOut, Lock, CheckCircle2, AlertCircle,
    Target, Sparkles, Star, Users, User, Receipt
} from 'lucide-react';

export const getRoleNavigation = ({ capabilities = {}, workspaceMode = 'simple', notificationCounts = {}, isAdmin = false }) => {
    const isBuyer = capabilities?.can_buy === true;
    const isSeller = capabilities?.can_sell === true;
    const isLogistics = capabilities?.can_logistics === true;

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
                {
                    id: 'pipeline',
                    label: 'Trade Pipeline',
                    path: '/dashboard/trade-pipeline',
                    icon: GitBranch,
                    activeMatch: (path) => path.startsWith('/dashboard/trade-pipeline')
                },
                {
                    id: 'products',
                    label: 'Products',
                    path: '/dashboard/products',
                    icon: Package,
                    activeMatch: (path) => path.startsWith('/dashboard/products')
                },
                {
                    id: 'orders',
                    label: 'Orders',
                    path: '/dashboard/orders',
                    icon: ShoppingCart,
                    badge: notificationCounts.orders || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/orders')
                },
                isSeller && {
                    id: 'sales',
                    label: 'Sales',
                    path: '/dashboard/sales',
                    icon: ShoppingCart,
                    activeMatch: (path) => path.startsWith('/dashboard/sales')
                },
                {
                    id: 'rfqs',
                    label: 'RFQs (My Requests)',
                    path: '/dashboard/rfqs',
                    icon: FileText,
                    activeMatch: (path) => path.startsWith('/dashboard/rfqs') && !path.includes('/new')
                },
                isSeller && {
                    id: 'rfqs-received',
                    label: 'RFQs Received',
                    path: '/dashboard/supplier-rfqs',
                    icon: FileText,
                    activeMatch: (path) => path.startsWith('/dashboard/supplier-rfqs')
                },
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
                    path: '/dashboard/wallet',
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
                    label: 'Shipments',
                    path: '/dashboard/shipments',
                    icon: Truck,
                    activeMatch: (path) => path.startsWith('/dashboard/shipments')
                },
                {
                    id: 'fulfillment',
                    label: 'Fulfillment',
                    path: '/dashboard/fulfillment',
                    icon: Package,
                    activeMatch: (path) => path.startsWith('/dashboard/fulfillment')
                }
            ].filter(Boolean)
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
                    activeMatch: (path) => path.startsWith('/dashboard/analytics')
                },
                {
                    id: 'performance',
                    label: 'Performance Metrics',
                    path: '/dashboard/performance',
                    icon: Target,
                    activeMatch: (path) => path.startsWith('/dashboard/performance')
                },
                {
                    id: 'koniai',
                    label: 'KoniAI Assistant',
                    path: '/dashboard/koniai',
                    icon: Sparkles,
                    activeMatch: (path) => path.startsWith('/dashboard/koniai')
                }
            ].filter(Boolean)
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
                    activeMatch: (path) => path.startsWith('/dashboard/reviews')
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
                    activeMatch: (path) => path.startsWith('/dashboard/kyc')
                },
                {
                    id: 'compliance',
                    label: 'Compliance',
                    path: '/dashboard/compliance',
                    icon: Lock,
                    activeMatch: (path) => path.startsWith('/dashboard/compliance')
                }
            ].filter(Boolean)
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
