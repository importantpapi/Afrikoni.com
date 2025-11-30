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
import { ShoppingCart, Search, Filter, Package, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';

export default function DashboardOrders() {
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
      const { user, profile, role, companyId: userCompanyId } = await getCurrentUserAndRole();
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
      if (isHybrid(normalizedRole) && viewMode === 'all') {
        const uniqueOrders = result.data.filter((order, index, self) =>
          index === self.findIndex((o) => o.id === order.id)
        );
        setOrders(uniqueOrders);
      } else {
        setOrders(result.data);
      }
      
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
    } catch (error) {
      toast.error('Failed to load orders');
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
          <Button variant="outline" size="sm">View</Button>
        </Link>
      )
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
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between"
        >
          <div>
          <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">
              {currentRole === 'buyer' ? 'My Orders' : currentRole === 'seller' ? 'Sales' : 'Orders & Sales'}
          </h1>
          <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
            {currentRole === 'buyer' && 'Track your purchase orders'}
            {currentRole === 'seller' && 'Manage your sales and fulfillments'}
            {currentRole === 'hybrid' && 'View all your orders as buyer and seller'}
            {currentRole === 'logistics' && 'Track shipments and deliveries'}
          </p>
          </div>
          {currentRole === 'hybrid' && (
            <div className="flex items-center gap-1 bg-afrikoni-cream rounded-lg p-1">
              {['all', 'buyer', 'seller'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    viewMode === mode
                      ? 'bg-afrikoni-offwhite text-afrikoni-gold shadow-afrikoni'
                      : 'text-afrikoni-deep hover:text-afrikoni-chestnut'
                  }`}
                >
                  {mode === 'all' ? 'All Orders' : mode === 'buyer' ? 'Buyer Orders' : 'Seller Orders'}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === ORDER_STATUS.PENDING ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(ORDER_STATUS.PENDING)}
                >
                  {getStatusLabel(ORDER_STATUS.PENDING, 'order')}
                </Button>
                <Button
                  variant={statusFilter === ORDER_STATUS.PROCESSING ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(ORDER_STATUS.PROCESSING)}
                >
                  {getStatusLabel(ORDER_STATUS.PROCESSING, 'order')}
                </Button>
                <Button
                  variant={statusFilter === ORDER_STATUS.SHIPPED ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(ORDER_STATUS.SHIPPED)}
                >
                  {getStatusLabel(ORDER_STATUS.SHIPPED, 'order')}
                </Button>
                <Button
                  variant={statusFilter === ORDER_STATUS.DELIVERED ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(ORDER_STATUS.DELIVERED)}
                >
                  {getStatusLabel(ORDER_STATUS.DELIVERED, 'order')}
                </Button>
                <Button
                  variant={statusFilter === ORDER_STATUS.COMPLETED ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(ORDER_STATUS.COMPLETED)}
                >
                  {getStatusLabel(ORDER_STATUS.COMPLETED, 'order')}
                </Button>
                <Button
                  variant={statusFilter === ORDER_STATUS.CANCELLED ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(ORDER_STATUS.CANCELLED)}
                >
                  {getStatusLabel(ORDER_STATUS.CANCELLED, 'order')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Total Orders</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{orders.length}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-afrikoni-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Pending</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {orders.filter(o => o.status === ORDER_STATUS.PENDING).length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">In Transit</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {orders.filter(o => o.status === ORDER_STATUS.SHIPPED).length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Total Value</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    ${orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <EmptyState 
                type="orders"
                ctaLink={currentRole === 'buyer' ? '/suppliers' : '/dashboard'}
              />
            ) : (
              <DataTable
                data={filteredOrders}
                columns={orderColumns}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

