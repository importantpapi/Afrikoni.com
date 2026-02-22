import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import {
    Search, Filter, Package, ChevronRight, Clock,
    CheckCircle, Truck, AlertCircle, Calendar
} from 'lucide-react';
import { PageLoader } from '@/components/shared/ui/skeletons';
import EmptyState from '@/components/shared/ui/EmptyState';
import { format } from 'date-fns';

export default function OrderHistory() {
    const { profileCompanyId, isSystemReady, capabilities } = useDashboardKernel();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (isSystemReady && profileCompanyId) {
            loadOrders();
        }
    }, [isSystemReady, profileCompanyId]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('trades')
                .select(`
                    *,
                    seller:companies!seller_company_id(company_name, country),
                    buyer:companies!buyer_company_id(company_name, country)
                `)
                .order('created_at', { ascending: false });

            // Filter by role/company
            if (capabilities.can_buy && !capabilities.can_sell) {
                query = query.eq('buyer_company_id', profileCompanyId);
            }
            else if (capabilities.can_sell && !capabilities.can_buy) {
                query = query.eq('seller_company_id', profileCompanyId);
            }
            else {
                query = query.or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Failed to load trades:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
            case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'processing':
            case 'in_transit': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
            case 'delivered': return <CheckCircle className="w-3.5 h-3.5" />;
            case 'pending': return <Clock className="w-3.5 h-3.5" />;
            case 'in_transit': return <Truck className="w-3.5 h-3.5" />;
            case 'cancelled': return <AlertCircle className="w-3.5 h-3.5" />;
            default: return <Package className="w-3.5 h-3.5" />;
        }
    };

    const filteredOrders = orders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                order.id.toLowerCase().includes(term) ||
                order.seller?.company_name?.toLowerCase().includes(term) ||
                order.buyer?.company_name?.toLowerCase().includes(term)
            );
        }
        return true;
    });

    if (!isSystemReady || loading) return <PageLoader />;

    return (
        <div className="os-page space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-os-text-primary">Order History</h1>
                    <p className="text-os-text-secondary text-sm">Track and manage your commercial transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadOrders}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <Surface variant="glass" className="p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary" />
                    <Input
                        placeholder="Search by Order ID or Company..."
                        className="pl-9 bg-os-surface-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'pending', 'processing', 'in_transit', 'delivered', 'cancelled'].map(status => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="capitalize whitespace-nowrap"
                        >
                            {status.replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </Surface>

            {filteredOrders.length === 0 ? (
                <EmptyState
                    title="No Orders Found"
                    description={searchTerm || statusFilter !== 'all'
                        ? "No orders match your search filters."
                        : "You haven't placed or received any orders yet."}
                    icon={Package}
                    actionLabel={capabilities.can_buy ? "Browse Marketplace" : "Share Products"}
                    onAction={() => navigate(capabilities.can_buy ? '/dashboard/rfqs/new' : '/dashboard/products')}
                />
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map((order) => {
                        const isBuying = order.buyer_company_id === profileCompanyId;
                        const counterparty = isBuying ? order.seller : order.buyer;

                        return (
                            <Link key={order.id} to={`/dashboard/trades/${order.id}`}>
                                <Surface className="p-4 hover:border-os-accent/50 transition-colors group cursor-pointer">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-os-surface-soft flex items-center justify-center border border-os-stroke">
                                                <Package className="w-5 h-5 text-os-text-secondary group-hover:text-os-accent transition-colors" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs text-os-text-secondary">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    <Badge variant="outline" className={`text-xs gap-1 py-0 px-2 h-5 ${getStatusColor(order.status)}`}>
                                                        {getStatusIcon(order.status)}
                                                        <span className="capitalize">{order.status.replace('_', ' ')}</span>
                                                    </Badge>
                                                </div>
                                                <h3 className="font-semibold text-os-text-primary text-base mb-0.5">
                                                    {isBuying ? 'Purchase from' : 'Sale to'} {counterparty?.company_name || 'Unknown Company'}
                                                </h3>
                                                <p className="text-sm text-os-text-secondary flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}
                                                    <span className="text-os-stroke">|</span>
                                                    {counterparty?.country || 'International'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-os-text-primary">
                                                {order.currency} {parseFloat(order.total_amount).toLocaleString()}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 text-xs text-os-accent font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Details <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Surface>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Helper icon component
function RotateCcw(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
            <path d="M3 3v9h9" />
        </svg>
    )
}
