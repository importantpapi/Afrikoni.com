import {
    LayoutDashboard, GitBranch, MessageSquare, FileText, ShoppingCart,
    Package, Truck, Wallet, Shield, Settings, HelpCircle, BarChart3,
    Building, Globe, Landmark, Bell, LogOut, Lock, CheckCircle2, AlertCircle
} from 'lucide-react';

export const getRoleNavigation = ({ capabilities = {}, workspaceMode = 'simple', notificationCounts = {}, isAdmin = false }) => {
    const isBuyer = capabilities?.can_buy === true;
    const isSeller = capabilities?.can_sell === true;
    const isLogistics = capabilities?.can_logistics === true;

    // 🏛️ AFRIKONI 2026: The 5 Action Pillars
    // Mission: Consolidate 60+ routes into clear operational zones.
    const sections = [
        {
            id: 'workbench',
            label: 'Command',
            items: [
                {
                    id: 'dashboard',
                    label: 'Workbench',
                    path: '/dashboard',
                    icon: LayoutDashboard,
                    activeMatch: (path) => path === '/dashboard' || path === '/dashboard/'
                },
                {
                    id: 'messages',
                    label: 'Inbox',
                    path: '/dashboard/messages',
                    icon: MessageSquare,
                    badge: notificationCounts.messages || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/messages')
                }
            ].filter(Boolean)
        },
        {
            id: 'sourcing',
            divider: true,
            label: 'Discovery',
            items: [
                isBuyer && {
                    id: 'marketplace',
                    label: 'Marketplace',
                    path: '/marketplace',
                    icon: Globe,
                    activeMatch: (path) => path.startsWith('/marketplace')
                },
                (isBuyer || isSeller) && {
                    id: 'rfqs',
                    label: isSeller ? "Open Requests" : "My RFQs",
                    path: isSeller ? "/dashboard/supplier-rfqs" : "/dashboard/rfqs",
                    icon: FileText,
                    badge: notificationCounts.rfqs || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/rfqs') || path.startsWith('/dashboard/supplier-rfqs')
                }
            ].filter(Boolean)
        },
        {
            id: 'inventory',
            divider: true,
            label: 'Supply',
            items: [
                isSeller && {
                    id: 'products',
                    label: 'My Catalog',
                    path: '/dashboard/products',
                    icon: Package,
                    activeMatch: (path) => path.startsWith('/dashboard/products')
                },
                isSeller && workspaceMode === 'pro' && {
                    id: 'analytics',
                    label: 'Market Insights',
                    path: '/dashboard/supplier-analytics',
                    icon: BarChart3,
                    activeMatch: (path) => path.startsWith('/dashboard/supplier-analytics')
                }
            ].filter(Boolean)
        },
        {
            id: 'trades',
            divider: true,
            label: 'Fulfillment',
            items: [
                {
                    id: 'orders',
                    label: 'Active Trades',
                    path: '/dashboard/orders',
                    icon: ShoppingCart,
                    badge: notificationCounts.orders || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/orders') || path.startsWith('/dashboard/trade/') || path.startsWith('/dashboard/escrow/')
                },
                {
                    id: 'pipeline',
                    label: 'Deal Flow',
                    path: '/dashboard/trade-pipeline',
                    icon: GitBranch,
                    activeMatch: (path) => path.startsWith('/dashboard/trade-pipeline')
                },
                (isLogistics || isBuyer || isSeller) && {
                    id: 'logistics',
                    label: 'Shipments',
                    path: '/dashboard/shipments',
                    icon: Truck,
                    activeMatch: (path) => path.startsWith('/dashboard/shipments') || path.startsWith('/dashboard/trace-center')
                },
                {
                    id: 'finance',
                    label: 'Payments',
                    path: '/dashboard/wallet',
                    icon: Wallet,
                    activeMatch: (path) => path.startsWith('/dashboard/wallet') || path.startsWith('/dashboard/payments') || path.startsWith('/dashboard/invoices')
                }
            ].filter(Boolean)
        },
        {
            id: 'trust',
            divider: true,
            label: 'Governance',
            items: [
                {
                    id: 'verification',
                    label: 'Trust Hub',
                    path: '/dashboard/kyc',
                    icon: Shield,
                    activeMatch: (path) => path.startsWith('/dashboard/kyc') || path.startsWith('/dashboard/verification-center') || path.startsWith('/dashboard/trust-health')
                },
                workspaceMode === 'pro' && {
                    id: 'compliance',
                    label: 'Compliance',
                    path: '/dashboard/compliance',
                    icon: Lock,
                    activeMatch: (path) => path.startsWith('/dashboard/compliance') || path.startsWith('/dashboard/risk') || path.startsWith('/dashboard/audit')
                },
                {
                    id: 'disputes',
                    label: 'Resolutions',
                    path: '/dashboard/disputes',
                    icon: AlertCircle,
                    badge: notificationCounts.disputes || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/disputes') && !path.includes('/admin/')
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
                    label: 'Payout Approval',
                    path: '/dashboard/admin/payouts',
                    icon: Wallet,
                    activeMatch: (path) => path.startsWith('/dashboard/admin/payouts')
                },
                {
                    id: 'admin-disputes',
                    label: 'Manage Disputes',
                    path: '/dashboard/admin/disputes',
                    icon: Shield,
                    activeMatch: (path) => path.startsWith('/dashboard/admin/disputes')
                },
                {
                    id: 'admin-verifications',
                    label: 'Verification Desk',
                    path: '/dashboard/admin/verifications',
                    icon: CheckCircle2,
                    activeMatch: (path) => path.startsWith('/dashboard/admin/verifications')
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
