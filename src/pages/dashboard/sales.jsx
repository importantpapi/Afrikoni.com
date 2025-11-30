import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { ShoppingCart, DollarSign, TrendingUp, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';

export default function DashboardSales() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('seller');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadSales();
  }, [statusFilter]);

  const loadSales = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);
      
      const role = userData.role || userData.user_role || 'seller';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

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
    { header: 'Buyer', accessor: 'buyer_id', render: (value) => value ? `Buyer ${value.substring(0, 8)}` : 'N/A' },
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
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Sales</h1>
          <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">Manage your sales and fulfillments</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Total Sales</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{orders.length}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-afrikoni-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Total Revenue</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">${totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Pending Payment</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">${pendingRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">To Fulfill</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {orders.filter(o => o.status === 'pending' || o.status === 'processing').length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  placeholder="Search sales..."
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

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Orders</CardTitle>
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

