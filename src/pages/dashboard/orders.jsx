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
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndOrders();
  }, [viewMode]);

  const loadUserAndOrders = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userData.role || userData.user_role || 'buyer';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

      // Load orders based on role
      // Note: Using user ID for now - will need to link to companies table later

      // First, get or create company for this user
      let companyId = null;
      if (userData.company_id) {
        companyId = userData.company_id;
      } else if (userData.company_name) {
        // Try to find existing company or create one
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_email', userData.email || userData.business_email)
          .single();
        
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create company for user
          const { data: newCompany } = await supabase
            .from('companies')
            .insert({
              company_name: userData.company_name,
              owner_email: userData.email || userData.business_email,
              role: role === 'hybrid' ? 'hybrid' : role,
              country: userData.country,
              city: userData.city,
              phone: userData.phone,
              email: userData.business_email || userData.email
            })
            .select('id')
            .single();
          
          if (newCompany) {
            companyId = newCompany.id;
            // Update profile with company_id
            await supabase
              .from('profiles')
              .update({ company_id: companyId })
              .eq('id', userData.id);
          }
        }
      }

      let allOrders = [];
      
      if (role === 'buyer' || (role === 'hybrid' && (viewMode === 'all' || viewMode === 'buyer'))) {
        // For buyers, show orders where they are the buyer
        if (companyId) {
          const { data: buyerOrders } = await supabase
            .from('orders')
            .select('*, products(*)')
            .eq('buyer_company_id', companyId)
            .order('created_at', { ascending: false });
          allOrders = [...allOrders, ...(buyerOrders || [])];
        }
      }
      
      // For hybrid users, also load seller orders
      if ((role === 'seller' || (role === 'hybrid' && (viewMode === 'all' || viewMode === 'seller'))) && companyId) {
        // For sellers, show orders where they are the seller
        const { data: sellerOrders } = await supabase
          .from('orders')
          .select('*, products(*)')
          .eq('seller_company_id', companyId)
          .order('created_at', { ascending: false });
        
        allOrders = [...allOrders, ...(sellerOrders || [])];
      }
      
      // Remove duplicates for hybrid users viewing 'all'
      if (role === 'hybrid' && viewMode === 'all') {
        const uniqueOrders = allOrders.filter((order, index, self) =>
          index === self.findIndex((o) => o.id === order.id)
        );
        setOrders(uniqueOrders);
      } else {
        setOrders(allOrders);
      }
      
      if (role === 'logistics') {
        // For logistics, show all orders
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*, products(*)')
          .order('created_at', { ascending: false })
          .limit(100);
        setOrders(allOrders || []);
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-afrikoni-cream text-afrikoni-deep';
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
                      ? 'bg-afrikoni-offwhite text-afrikoni-gold shadow-sm'
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
          <CardContent className="p-4">
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
                <Button
                  variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed
                </Button>
                <Button
                  variant={statusFilter === 'cancelled' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
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
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Pending</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">In Transit</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {orders.filter(o => o.status === 'shipped').length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
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

