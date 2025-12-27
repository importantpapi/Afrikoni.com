import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { ShoppingCart, DollarSign, TrendingUp, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function DashboardSalesInner() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for data fetching
  const [currentRole, setCurrentRole] = useState(role || 'seller');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[DashboardSales] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[DashboardSales] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadSales();
  }, [authReady, authLoading, user, profile, role, statusFilter, navigate]);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const normalizedRole = role || 'seller';
      setCurrentRole(normalizedRole === 'logistics_partner' ? 'logistics' : normalizedRole);
      
      const companyId = profile?.company_id || null;

      // Load orders where user is the seller
      if (companyId) {
        const { data: salesOrders } = await supabase
          .from('orders')
          .select('*, products(*)')
          .eq('seller_company_id', companyId)
          .order('created_at', { ascending: false });

        setOrders(salesOrders || []);
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load sales');
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
    { header: 'Buyer', accessor: 'buyer_company_id', render: (value) => value ? `Buyer ${value.substring(0, 8)}` : 'N/A' },
    { header: 'Quantity', accessor: 'quantity', render: (value) => value || '0' },
    { header: 'Amount', accessor: 'total_amount', render: (value) => `$${value?.toLocaleString() || '0'}` },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusChip status={value} />
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

  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const pendingRevenue = orders
    .filter(o => o.payment_status === 'pending')
    .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading sales..." />;
  }

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
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
          className="mb-8"
        >
          <h1 className="text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em] text-afrikoni-text-dark mb-6">Sales</h1>
          <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70">Manage your sales and fulfillments</p>
        </motion.div>

        {/* v2.5: Premium Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-h1-mobile md:text-h1 font-bold leading-[1.1] text-afrikoni-text-dark mb-2">{orders.length}</div>
                <div className="text-meta font-medium text-afrikoni-text-dark/70 uppercase tracking-[0.02em]">Total Sales</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-gold mb-2">${totalRevenue.toLocaleString()}</div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Total Revenue</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">${pendingRevenue.toLocaleString()}</div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Pending Payment</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {Array.isArray(orders) ? orders.filter(o => o?.status === 'pending' || o?.status === 'processing').length : 0}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">To Fulfill</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* v2.5: Premium Filters */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                <Input
                  placeholder="Search sales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
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
                  variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'processing' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('processing')}
                >
                  Processing
                </Button>
                <Button
                  variant={statusFilter === 'shipped' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('shipped')}
                >
                  Shipped
                </Button>
                <Button
                  variant={statusFilter === 'delivered' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('delivered')}
                >
                  Delivered
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* v2.5: Premium Orders Table */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <EmptyState 
                type="products"
                title="No sales yet"
                description="Start selling by adding products to your catalog."
                cta="Add Products"
                ctaLink="/products/add"
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

export default function DashboardSales() {
  return (
    <RequireDashboardRole allow={['seller', 'hybrid']}>
      <DashboardSalesInner />
    </RequireDashboardRole>
  );
}

