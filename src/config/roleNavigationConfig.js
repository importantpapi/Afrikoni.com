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
            id: 'intent',
            label: 'Intent',
            items: [
                {
                    id: 'dashboard',
                    label: 'Command Center',
                    path: '/dashboard',
                    icon: LayoutDashboard,
                    activeMatch: (path) => path === '/dashboard'
                },
                isBuyer && {
                    id: 'marketplace',
                    label: 'Discovery',
                    path: '/marketplace',
                    icon: Globe,
                    activeMatch: (path) => path.startsWith('/marketplace')
                },
                (isBuyer || isSeller) && {
                    id: 'rfqs',
                    label: isSeller ? "Quote Intake" : "Sourcing (RFQ)",
                    path: isSeller ? "/dashboard/supplier-rfqs" : "/dashboard/rfqs",
                    icon: FileText,
                    badge: notificationCounts.rfqs || 0,
                    activeMatch: (path) => path.startsWith('/dashboard/rfqs') || path.startsWith('/dashboard/supplier-rfqs')
                }
            ].filter(Boolean)
        },
        {
            id: 'match',
            divider: true,
            label: 'Match',
            items: [
                {
                    id: 'trade-pipeline',
                    label: 'Match Pipeline',
                    path: '/dashboard/trade-pipeline',
                    icon: GitBranch,
                    activeMatch: (path) => path.startsWith('/dashboard/trade-pipeline')
                },
                {
                    id: 'messages',
                    label: 'Negotiation',
                    path: '/dashboard/messages',
                    icon: MessageSquare,
                    activeMatch: (path) => path.startsWith('/dashboard/messages')
                }
            ].filter(Boolean)
        },
        {
            id: 'contract',
            divider: true,
            label: 'Contract',
            items: [
                {
                    id: 'orders',
                    label: 'Smart Agreements',
                    path: '/dashboard/orders',
                    icon: ShoppingCart,
                    activeMatch: (path) => path.startsWith('/dashboard/orders') || path.startsWith('/dashboard/trade/')
                }
            ].filter(Boolean)
        },
        {
            id: 'move',
            divider: true,
            label: 'Move',
            items: [
                {
                    id: 'trace',
                    label: 'Forensic Trace',
                    path: '/dashboard/trace-center',
                    icon: Lock,
                    badge: 'LIVE',
                    activeMatch: (path) => path.startsWith('/dashboard/trace-center')
                },
                (isLogistics || isBuyer || isSeller) && {
                    id: 'logistics',
                    label: 'Logistics Rail',
                    path: '/dashboard/shipments',
                    icon: Truck,
                    activeMatch: (path) => path.startsWith('/dashboard/shipments')
                }
            ].filter(Boolean)
        },
        {
            id: 'pay',
            divider: true,
            label: 'Pay',
            items: [
                {
                    id: 'finance',
                    label: 'Sovereign Pay',
                    path: '/dashboard/payments',
                    icon: Wallet,
                    activeMatch: (path) => path.startsWith('/dashboard/payments')
                },
                workspaceMode === 'operator' && {
                    id: 'revenue',
                    label: 'Treasury',
                    path: '/dashboard/revenue',
                    icon: Landmark,
                    activeMatch: (path) => path.startsWith('/dashboard/revenue')
                }
            ].filter(Boolean)
        },
        {
            id: 'trust',
            divider: true,
            label: 'Trust',
            items: [
                {
                    id: 'trust-center',
                    label: 'Trust DNA',
                    path: '/dashboard/trust-center',
                    icon: Shield,
                    badge: 'NEW',
                    activeMatch: (path) => path.startsWith('/dashboard/trust-center')
                },
                {
                    id: 'verification',
                    label: 'Forensic Lab',
                    path: '/dashboard/verification-center',
                    icon: Building2,
                    badge: 'BETA',
                    activeMatch: (path) => path.startsWith('/dashboard/verification-center')
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
