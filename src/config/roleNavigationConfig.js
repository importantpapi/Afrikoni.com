import {
    LayoutDashboard, GitBranch, MessageSquare, FileText, ShoppingCart,
    Package, Truck, Wallet, Shield, Settings, HelpCircle, BarChart3,
    Building2, Globe, Landmark, Bell, LogOut, Lock
} from 'lucide-react';

export const getRoleNavigation = ({ capabilities = {}, workspaceMode = 'simple', notificationCounts = {} }) => {
    const isBuyer = capabilities?.can_buy === true;
    const isSeller = capabilities?.can_sell === true;
    const isLogistics = capabilities?.can_logistics === true;

    const sections = [
        {
            id: 'core',
            items: [
                {
                    id: 'dashboard',
                    label: 'Command Center',
                    path: '/dashboard',
                    icon: LayoutDashboard,
                    activeMatch: (path) => path === '/dashboard'
                },
                workspaceMode === 'operator' && {
                    id: 'revenue',
                    label: 'Sovereign Treasury',
                    path: '/dashboard/revenue',
                    icon: Landmark,
                    activeMatch: (path) => path.startsWith('/dashboard/revenue')
                },
                {
                    id: 'messages',
                    label: 'Messages',
                    path: '/dashboard/messages',
                    icon: MessageSquare,
                    activeMatch: (path) => path.startsWith('/dashboard/messages')
                },
                {
                    id: 'notifications',
                    label: 'Signals',
                    path: '/dashboard/notifications',
                    icon: Bell,
                    badge: notificationCounts.messages || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/notifications')
                }
            ].filter(Boolean)
        },
        {
            id: 'intake',
            divider: true,
            items: [
                isBuyer && {
                    id: 'marketplace',
                    label: 'Marketplace',
                    path: '/marketplace',
                    icon: Package,
                    activeMatch: (path) => path.startsWith('/marketplace')
                },
                (isBuyer || isSeller) && {
                    id: 'rfqs',
                    label: isSeller ? "Quotes" : "RFQs (Intake)",
                    path: isSeller ? "/dashboard/supplier-rfqs" : "/dashboard/rfqs",
                    icon: FileText,
                    badge: notificationCounts.rfqs || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/rfqs') || path.startsWith('/dashboard/supplier-rfqs')
                },
                isSeller && {
                    id: 'inventory',
                    label: 'Inventory',
                    path: '/dashboard/products',
                    icon: Package,
                    activeMatch: (path) => path.startsWith('/dashboard/products')
                }
            ].filter(Boolean)
        },
        {
            id: 'execution',
            divider: true,
            items: [
                {
                    id: 'orders',
                    label: 'Active Trades',
                    path: '/dashboard/orders',
                    icon: ShoppingCart,
                    activeMatch: (path) => path.startsWith('/dashboard/orders') || path.startsWith('/dashboard/trade/')
                },
                {
                    id: 'corridors',
                    label: 'Corridors',
                    path: '/dashboard/corridors',
                    icon: Globe,
                    activeMatch: (path) => path.startsWith('/dashboard/corridors')
                }
            ].filter(Boolean)
        },
        {
            id: 'power_ups',
            divider: workspaceMode === 'operator',
            hidden: workspaceMode !== 'operator',
            items: [
                {
                    id: 'trust',
                    label: 'Trust Center',
                    path: '/dashboard/trust-center',
                    icon: Shield,
                    badge: 'NEW',
                    activeMatch: (path) => path.startsWith('/dashboard/trust-center')
                },
                {
                    id: 'trace',
                    label: 'Trace Center',
                    path: '/dashboard/trace-center',
                    icon: Lock,
                    badge: 'LIVE',
                    activeMatch: (path) => path.startsWith('/dashboard/trace-center')
                },
                {
                    id: 'verification',
                    label: 'Verification Lab',
                    path: '/dashboard/verification-center',
                    icon: Building2,
                    badge: 'BETA',
                    activeMatch: (path) => path.startsWith('/dashboard/verification-center')
                },
                isSeller && {
                    id: 'analytics',
                    label: 'Sales Analytics',
                    path: '/dashboard/sales',
                    icon: BarChart3,
                    activeMatch: (path) => path.startsWith('/dashboard/sales')
                }
            ].filter(Boolean)
        },
        {
            id: 'fulfillment',
            divider: true,
            items: [
                (isLogistics || isBuyer || isSeller) && {
                    id: 'logistics',
                    label: 'Logistics',
                    path: '/dashboard/shipments',
                    icon: Truck,
                    activeMatch: (path) => path.startsWith('/dashboard/shipments')
                },
                {
                    id: 'finance',
                    label: 'Finance',
                    path: '/dashboard/payments',
                    icon: Wallet,
                    activeMatch: (path) => path.startsWith('/dashboard/payments')
                },
                workspaceMode === 'operator' && {
                    id: 'documents',
                    label: 'Documents',
                    path: '/dashboard/documents',
                    icon: FileText,
                    activeMatch: (path) => path.startsWith('/dashboard/documents')
                }
            ].filter(Boolean)
        }
    ].filter(section => !section.hidden && section.items.length > 0);

    const systemApps = [
        {
            id: 'settings',
            label: 'Settings',
            path: '/dashboard/settings',
            icon: Settings,
            activeMatch: (path) => path.startsWith('/dashboard/settings')
        },
        {
            id: 'help',
            label: 'Help',
            path: '/dashboard/help',
            icon: HelpCircle,
            activeMatch: (path) => path.startsWith('/dashboard/help')
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
