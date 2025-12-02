import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole, isHybrid, canViewBuyerFeatures, canViewSellerFeatures, isLogistics } from '@/utils/roleHelpers';
import { ORDER_STATUS, getStatusLabel } from '@/constants/status';
import { buildOrderQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { TableSkeleton } from '@/components/ui/skeletons';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { ShoppingCart, Search, Filter, Package, DollarSign, Calendar, TrendingUp, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { useLanguage } from '@/i18n/LanguageContext';

export default function DashboardOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('buyer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const [pagination, setPagination] = useState(createPaginationState());
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndOrders();
  }, [viewMode, statusFilter]);

  const loadUserAndOrders = async () => {
    try {
      setIsLoading(true);
      const { user, profile, role, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        navigate('/login');
        return;
      }

      const userData = profile || user;
      const normalizedRole = getUserRole(userData);
      setCurrentRole(normalizedRole);

      // Build query based on role
      let query = buildOrderQuery({
        buyerCompanyId: canViewBuyerFeatures(normalizedRole, viewMode) ? userCompanyId : null,
        sellerCompanyId: canViewSellerFeatures(normalizedRole, viewMode) ? userCompanyId : null,
        status: statusFilter === 'all' ? null : statusFilter
      });
      
      // Use pagination
      const result = await paginateQuery(query, {
        page: pagination.page,
        pageSize: pagination.pageSize
      });
      
      // Remove duplicates for hybrid users viewing 'all'
      const ordersData = Array.isArray(result.data) ? result.data : [];
      if (isHybrid(normalizedRole) && viewMode === 'all') {
        const uniqueOrders = ordersData.filter((order, index, self) =>
          order && index === self.findIndex((o) => o && order && o.id === order.id)
        );
        setOrders(uniqueOrders);
      } else {
        setOrders(ordersData);
      }
      
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
    } catch (error) {
      setOrders([]);
      setPagination(prev => ({
        ...prev,
        totalCount: 0,
        totalPages: 1
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderColumns = [
    { header: 'Order ID', accessor: 'id', render: (value) => value?.substring(0, 8) || 'N/A' },
    { header: 'Product', accessor: 'products.title', render: (value) => value || 'N/A' },
    { header: currentRole === 'buyer' ? 'Supplier' : currentRole === 'seller' ? 'Buyer' : 'Party', accessor: 'company_name', render: (value) => value || 'N/A' },
    { header: 'Quantity', accessor: 'quantity', render: (value) => value || '0' },
    { header: 'Amount', accessor: 'total_amount', render: (value) => `$${value?.toLocaleString() || '0'}` },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusChip status={value} type="order" />
    },
    { 
      header: 'Actions',
      accessor: 'id',
      render: (value) => (
        <Link to={`/dashboard/orders/${value}`}>
          <Button variant="outline" size="sm" className="border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10 text-afrikoni-text-dark">View</Button>
        </Link>
      )
    }
  ];

  const stats = [
    {
      icon: ShoppingCart,
      label: t('dashboard.totalOrders') || 'Total Orders',
      value: orders.length,
      color: 'bg-afrikoni-purple/10 text-afrikoni-purple',
      iconBg: 'bg-afrikoni-purple/20'
    },
    {
      icon: Package,
      label: t('dashboard.pending') || 'Pending',
      value: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
      color: 'bg-afrikoni-gold/10 text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20'
    },
    {
      icon: Truck,
      label: t('dashboard.inTransit') || 'In Transit',
      value: orders.filter(o => o.status === ORDER_STATUS.SHIPPED).length,
      color: 'bg-afrikoni-green/10 text-afrikoni-green',
      iconBg: 'bg-afrikoni-green/20'
    },
    {
      icon: DollarSign,
      label: t('dashboard.totalValue') || 'Total Value',
      value: `$${orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toLocaleString()}`,
      color: 'bg-afrikoni-clay/10 text-afrikoni-clay',
      iconBg: 'bg-afrikoni-clay/20',
      isAmount: true
    }
  ];

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <TableSkeleton rows={10} columns={6} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">
              {currentRole === 'buyer' ? t('dashboard.myOrders') || 'My Orders' : 
               currentRole === 'seller' ? t('dashboard.sales') || 'Sales' : 
               t('dashboard.ordersAndSales') || 'Orders & Sales'}
            </h1>
            <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
              {currentRole === 'buyer' && (t('dashboard.trackOrders') || 'Track your purchase orders')}
              {currentRole === 'seller' && (t('dashboard.manageSales') || 'Manage your sales and fulfillments')}
              {currentRole === 'hybrid' && (t('dashboard.viewAllOrders') || 'View all your orders as buyer and seller')}
              {currentRole === 'logistics' && (t('dashboard.trackShipments') || 'Track shipments and deliveries')}
            </p>
          </div>
          {/* v2.5: Premium Segmented Role Switcher */}
          {isHybrid(currentRole) && (
            <div className="flex items-center gap-0.5 bg-afrikoni-sand/40 p-1 rounded-full border border-afrikoni-gold/20 shadow-premium relative">
              {['all', 'buyer', 'seller'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 capitalize z-10 min-w-[60px] ${
                    viewMode === mode
                      ? 'text-afrikoni-charcoal'
                      : 'text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark'
                  }`}
                >
                  {mode === 'all' ? 'All' : mode}
                </button>
              ))}
              <motion.div
                layoutId="activeOrderView"
                className="absolute top-1 bottom-1 rounded-full bg-afrikoni-gold shadow-afrikoni z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                animate={{
                  x: viewMode === 'all' ? 0 : viewMode === 'buyer' ? 'calc(33.333% + 0.125rem)' : 'calc(66.666% + 0.25rem)',
                  width: 'calc(33.333% - 0.25rem)',
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const iconColorClass =
              typeof stat?.color === 'string'
                ? (stat.color.split(' ')[1] || '')
                : '';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 ${stat.iconBg} rounded-full flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${iconColorClass}`} />
                      </div>
                    </div>
                    {/* v2.5: Increased KPI number size by 20% */}
                    <div className={`text-4xl md:text-5xl font-bold ${stat.isAmount ? 'text-afrikoni-gold' : 'text-afrikoni-text-dark'} mb-2`}>
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Premium Filters */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                <Input
                  placeholder={t('common.searchOrders') || 'Search orders...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-afrikoni text-xs font-semibold transition-all ${
                      statusFilter === status
                        ? 'bg-afrikoni-gold text-afrikoni-charcoal border-afrikoni-gold shadow-afrikoni'
                        : 'border-afrikoni-gold/30 text-afrikoni-text-dark hover:border-afrikoni-gold hover:bg-afrikoni-gold/10'
                    }`}
                  >
                    {status === 'all' ? t('common.all') || 'All' : getStatusLabel(status, 'order')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* v2.5: Premium Orders Table with Gold Underline */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">
              {t('dashboard.orders')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="p-12">
                <EmptyState 
                  type="orders"
                  ctaLink={currentRole === 'buyer' ? '/suppliers' : '/dashboard'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <DataTable
                  data={filteredOrders}
                  columns={orderColumns}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
