import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { getUserRole, isHybrid, canViewBuyerFeatures, canViewSellerFeatures, isLogistics } from '@/utils/roleHelpers';
import { ORDER_STATUS, getStatusLabel } from '@/constants/status';
import { buildOrderQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { TableSkeleton } from '@/components/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShoppingCart, Search, Filter, Package, DollarSign, Calendar, TrendingUp, Truck, CheckCircle,
  Download, FileText, Copy, MoreVertical, Trash2, Edit, Save, RotateCcw, CheckSquare, Square, Star
} from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import RequireDashboardRole from '@/guards/RequireDashboardRole';
import LeaveReviewModal from '@/components/reviews/LeaveReviewModal';
import { assertRowOwnedByCompany } from '@/utils/securityAssertions';

function DashboardOrdersInner() {
  const { t } = useTranslation();
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for data fetching
  const [currentRole, setCurrentRole] = useState(role || 'buyer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const [pagination, setPagination] = useState(createPaginationState());
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState([]);
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [orderReviewStatus, setOrderReviewStatus] = useState({});
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[DashboardOrders] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[DashboardOrders] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadUserAndOrders();
    loadTemplates();
  }, [authReady, authLoading, user, profile, role, viewMode, statusFilter, dateRangeFilter, navigate]);

  useEffect(() => {
    setShowBulkActions(selectedOrders.length > 0);
  }, [selectedOrders]);

  const loadUserAndOrders = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      if (!user) {
        navigate('/login');
        return;
      }

      const normalizedRole = getUserRole(profile || user);
      setCurrentRole(normalizedRole);
      const userCompanyId = profile?.company_id || null;
      setCompanyId(userCompanyId);

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

      // SAFETY ASSERTION: Ensure every order belongs to the current company.
      const ordersData = Array.isArray(result.data) ? result.data : [];
      if (userCompanyId) {
        for (const order of ordersData) {
          await assertRowOwnedByCompany(order, userCompanyId, 'DashboardOrders:orders');
        }
      }

      // Remove duplicates for hybrid users viewing 'all'
      if (isHybrid(normalizedRole) && viewMode === 'all') {
        const uniqueOrders = (Array.isArray(ordersData) ? ordersData : []).filter((order, index, self) =>
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

      // Load review status for buyer's completed orders
      if (canViewBuyerFeatures(normalizedRole, viewMode) && userCompanyId) {
        await loadReviewStatus(ordersData, userCompanyId);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error(error?.message || 'Failed to load orders. Please try again.');
      setOrders([]);
      setPagination(prev => ({
        ...prev,
        totalCount: 0,
        totalPages: 1,
        isLoading: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewStatus = async (ordersList, userCompanyId) => {
    try {
      const orderIds = ordersList.map(o => o.id);
      if (orderIds.length === 0) return;

      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('order_id, status')
        .eq('buyer_company_id', userCompanyId)
        .in('order_id', orderIds);

      if (error) {
        console.error('Error loading review status:', error);
        return;
      }

      const statusMap = {};
      reviews?.forEach(review => {
        statusMap[review.order_id] = review.status;
      });
      setOrderReviewStatus(statusMap);
    } catch (error) {
      console.error('Error in loadReviewStatus:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const stored = localStorage.getItem('afrikoni_order_templates');
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const saveAsTemplate = async (order) => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      const template = {
        id: Date.now().toString(),
        name: templateName,
        order: {
          product_id: order.product_id,
          quantity: order.quantity,
          total_amount: order.total_amount,
          currency: order.currency,
          shipping_address: order.shipping_address,
          notes: order.notes,
        },
        created_at: new Date().toISOString(),
      };

      const updated = [...templates, template];
      localStorage.setItem('afrikoni_order_templates', JSON.stringify(updated));
      setTemplates(updated);
      setTemplateName('');
      setShowTemplateDialog(false);
      toast.success('Order template saved!');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const reorderFromTemplate = (template) => {
    navigate(`/dashboard/rfqs/new?template=${template.id}`);
    toast.info('Redirecting to create RFQ from template...');
  };

  const reorderFromOrder = (order) => {
    navigate(`/dashboard/rfqs/new?product=${order.product_id}&quantity=${order.quantity}`);
    toast.info('Creating new RFQ from this order...');
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) return;

    try {
      const updates = selectedOrders.map(orderId => 
        supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId)
      );

      await Promise.all(updates);
      toast.success(`${selectedOrders.length} order(s) updated to ${getStatusLabel(newStatus, 'order')}`);
      setSelectedOrders([]);
      loadUserAndOrders();
    } catch (error) {
      toast.error('Failed to update orders');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) return;

    try {
      const deletes = selectedOrders.map(orderId =>
        supabase
          .from('orders')
          .update({ status: ORDER_STATUS.CANCELLED })
          .eq('id', orderId)
      );

      await Promise.all(deletes);
      toast.success(`${selectedOrders.length} order(s) cancelled`);
      setSelectedOrders([]);
      loadUserAndOrders();
    } catch (error) {
      toast.error('Failed to cancel orders');
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Product', 'Quantity', 'Amount', 'Status', 'Date'];
    const rows = filteredOrders.map(order => [
      order.id?.substring(0, 8) || '',
      order.products?.title || '',
      order.quantity || 0,
      order.total_amount || 0,
      order.status || '',
      order.created_at ? format(new Date(order.created_at), 'yyyy-MM-dd') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Orders exported to CSV');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Date range filter
    let matchesDate = true;
    if (dateRangeFilter !== 'all' && order.created_at) {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      const daysAgo = parseInt(dateRangeFilter);
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      matchesDate = orderDate >= cutoffDate;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const orderColumns = [
    { 
      header: (
        <button
          onClick={toggleSelectAll}
          className="p-1 hover:bg-afrikoni-gold/10 rounded"
        >
          {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-afrikoni-gold" />
          ) : (
            <Square className="w-4 h-4 text-afrikoni-deep/50" />
          )}
        </button>
      ), 
      accessor: 'id', 
      render: (value, order) => (
        <button
          onClick={() => toggleOrderSelection(value)}
          className="p-1 hover:bg-afrikoni-gold/10 rounded"
        >
          {selectedOrders.includes(value) ? (
            <CheckSquare className="w-4 h-4 text-afrikoni-gold" />
          ) : (
            <Square className="w-4 h-4 text-afrikoni-deep/50" />
          )}
        </button>
      )
    },
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
      render: (value, order) => {
        const reviewStatus = orderReviewStatus[value];
        const canReview = currentRole === 'buyer' && order.status === 'completed' && !reviewStatus;
        
        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/orders/${value}`}>
              <Button variant="outline" size="sm" className="border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10 text-afrikoni-text-dark">View</Button>
            </Link>
            {currentRole === 'buyer' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reorderFromOrder(order)}
                  className="p-1.5"
                  title="Reorder"
                >
                  <RotateCcw className="w-4 h-4 text-afrikoni-gold" />
                </Button>
                {canReview && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedOrderForReview(order);
                      setShowReviewModal(true);
                    }}
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
                    title="Leave Review"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Review
                  </Button>
                )}
                {reviewStatus === 'pending' && (
                  <Badge variant="outline" className="text-xs">
                    Review Pending
                  </Badge>
                )}
                {reviewStatus === 'approved' && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Reviewed
                  </Badge>
                )}
              </>
            )}
          </div>
        );
      }
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
      value: (Array.isArray(orders) ? orders : []).filter(o => o && o.status === ORDER_STATUS.PENDING).length,
      color: 'bg-afrikoni-gold/10 text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/20'
    },
    {
      icon: Truck,
      label: t('dashboard.inTransit') || 'In Transit',
      value: (Array.isArray(orders) ? orders : []).filter(o => o && o.status === ORDER_STATUS.SHIPPED).length,
      color: 'bg-afrikoni-green/10 text-afrikoni-green',
      iconBg: 'bg-afrikoni-green/20'
    },
    {
      icon: DollarSign,
      label: t('dashboard.totalValue') || 'Total Value',
      value: `$${(Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + (parseFloat(o?.total_amount) || 0), 0).toLocaleString()}`,
      color: 'bg-afrikoni-clay/10 text-afrikoni-clay',
      iconBg: 'bg-afrikoni-clay/20',
      isAmount: true
    }
  ];

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading orders..." />;
  }

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
            <div className="flex flex-col gap-4">
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
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="w-full md:w-48 border-afrikoni-gold/30">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  className="border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
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

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-afrikoni-gold bg-afrikoni-gold/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-afrikoni-gold text-afrikoni-charcoal">
                      {selectedOrders.length} selected
                    </Badge>
                    <span className="text-sm text-afrikoni-text-dark">
                      Bulk actions:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={handleBulkStatusUpdate}>
                      <SelectTrigger className="w-48 border-afrikoni-gold/30">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ORDER_STATUS.PROCESSING}>Mark as Processing</SelectItem>
                        <SelectItem value={ORDER_STATUS.SHIPPED}>Mark as Shipped</SelectItem>
                        <SelectItem value={ORDER_STATUS.DELIVERED}>Mark as Delivered</SelectItem>
                        <SelectItem value={ORDER_STATUS.COMPLETED}>Mark as Completed</SelectItem>
                        <SelectItem value={ORDER_STATUS.CANCELLED}>Cancel Orders</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={handleBulkDelete}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedOrders([])}
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order Templates */}
        {templates.length > 0 && currentRole === 'buyer' && (
          <Card className="border-afrikoni-gold/20 bg-afrikoni-gold/5">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg font-bold text-afrikoni-text-dark flex items-center gap-2">
                <FileText className="w-5 h-5 text-afrikoni-gold" />
                Saved Order Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {templates.map(template => (
                  <Button
                    key={template.id}
                    variant="outline"
                    onClick={() => reorderFromTemplate(template)}
                    className="border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* Leave Review Modal */}
      {showReviewModal && selectedOrderForReview && (
        <LeaveReviewModal
          isOpen={showReviewModal}
          onClose={(wasSubmitted) => {
            setShowReviewModal(false);
            setSelectedOrderForReview(null);
            // Reload orders if review was submitted
            if (wasSubmitted) {
              loadUserAndOrders();
            }
          }}
          order={selectedOrderForReview}
          buyerCompanyId={companyId}
        />
      )}
    </DashboardLayout>
  );
}

export default function DashboardOrders() {
  return (
    <RequireDashboardRole allow={['buyer', 'hybrid']}>
      <DashboardOrdersInner />
    </RequireDashboardRole>
  );
}
