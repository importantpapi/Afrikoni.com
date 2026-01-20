/**
 * Afrikoni Shield™ - Admin Marketplace View
 * Unified control panel for all marketplace activity: products, suppliers, orders
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Package, Building2, ShoppingCart, Search, Filter,
  CheckCircle2, XCircle, Eye, TrendingUp, Users, DollarSign,
  MapPin, Calendar, Shield, Star
} from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
// NOTE: Admin check done at route level - removed isAdmin import
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import AccessDenied from '@/components/AccessDenied';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DataTable, StatusChip } from '@/components/shared/ui/data-table';

export default function AdminMarketplace() {
  // ✅ KERNEL COMPLIANCE: Use unified Dashboard Kernel
  const { user, profile, userId, isSystemReady, canLoadData, isAdmin } = useDashboardKernel();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  
  // Products state
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productCountryFilter, setProductCountryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  
  // Suppliers state
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState('all');
  const [supplierCountryFilter, setSupplierCountryFilter] = useState('all');
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  
  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSuppliers: 0,
    verifiedSuppliers: 0,
    totalOrders: 0,
    totalGMV: 0
  });

  useEffect(() => {
    // ✅ KERNEL COMPLIANCE: Use isSystemReady instead of authReady/authLoading
    if (!isSystemReady) {
      console.log('[AdminMarketplace] Waiting for system to be ready...');
      return;
    }

    // ✅ KERNEL COMPLIANCE: Use userId and isAdmin from kernel
    if (!userId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(isAdmin);
    setLoading(false);
    
    if (isAdmin) {
      loadData();
    }
  }, [isSystemReady, userId, isAdmin]);

  useEffect(() => {
    // ✅ KERNEL COMPLIANCE: Use isSystemReady instead of authReady
    if (hasAccess && isSystemReady && activeTab === 'products') {
      loadProducts();
    } else if (hasAccess && isSystemReady && activeTab === 'suppliers') {
      loadSuppliers();
    } else if (hasAccess && isSystemReady && activeTab === 'orders') {
      loadOrders();
    }
  }, [hasAccess, isSystemReady, activeTab, productStatusFilter, productCategoryFilter, productCountryFilter, supplierStatusFilter, supplierCountryFilter, orderStatusFilter]);

  const loadData = async () => {
    await Promise.all([
      loadCategories(),
      loadStats()
    ]);
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(data || []);
    } catch (error) {
      // Silently fail
    }
  };

  const loadStats = async () => {
    try {
      const [productsRes, suppliersRes, ordersRes] = await Promise.allSettled([
        supabase.from('products').select('id, status', { count: 'exact' }),
        supabase.from('companies').select('id, verified, verification_status', { count: 'exact' }),
        supabase.from('orders').select('total_amount', { count: 'exact' })
      ]);

      const products = productsRes.status === 'fulfilled' ? (productsRes.value?.data || []) : [];
      const suppliers = suppliersRes.status === 'fulfilled' ? (suppliersRes.value?.data || []) : [];
      const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || []) : [];

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        totalSuppliers: suppliers.length,
        verifiedSuppliers: suppliers.filter(s => s.verified || s.verification_status === 'verified').length,
        totalOrders: orders.length,
        totalGMV: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
      });
    } catch (error) {
      // Silently fail
    }
  };

  const loadProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*, companies(*), categories(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (productStatusFilter !== 'all') {
        query = query.eq('status', productStatusFilter);
      }
      if (productCategoryFilter !== 'all') {
        query = query.eq('category_id', productCategoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (productCountryFilter !== 'all') {
        filtered = filtered.filter(p => 
          p.country_of_origin === productCountryFilter || 
          p.companies?.country === productCountryFilter
        );
      }
      if (productSearch) {
        filtered = filtered.filter(p =>
          p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.description?.toLowerCase().includes(productSearch.toLowerCase())
        );
      }

      setProducts(filtered);
    } catch (error) {
      toast.error('Failed to load products');
      setProducts([]);
    }
  };

  const loadSuppliers = async () => {
    try {
      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (supplierStatusFilter !== 'all') {
        if (supplierStatusFilter === 'verified') {
          query = query.eq('verified', true);
        } else {
          query = query.eq('verification_status', supplierStatusFilter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (supplierCountryFilter !== 'all') {
        filtered = filtered.filter(s => s.country === supplierCountryFilter);
      }
      if (supplierSearch) {
        filtered = filtered.filter(s =>
          s.company_name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
          s.email?.toLowerCase().includes(supplierSearch.toLowerCase())
        );
      }

      setSuppliers(filtered);
    } catch (error) {
      toast.error('Failed to load suppliers');
      setSuppliers([]);
    }
  };

  const loadOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*, products(*), companies!orders_buyer_company_id_fkey(*), companies!orders_seller_company_id_fkey(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (orderStatusFilter !== 'all') {
        query = query.eq('status', orderStatusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (orderSearch) {
        filtered = filtered.filter(o =>
          o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
          o.products?.title?.toLowerCase().includes(orderSearch.toLowerCase())
        );
      }

      setOrders(filtered);
    } catch (error) {
      toast.error('Failed to load orders');
      setOrders([]);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'active',
          published_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Product approved');
      loadProducts();
      loadStats();
    } catch (error) {
      toast.error('Failed to approve product');
    }
  };

  const handleRejectProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'inactive' })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Product rejected');
      loadProducts();
      loadStats();
    } catch (error) {
      toast.error('Failed to reject product');
    }
  };

  const handleVerifySupplier = async (supplierId) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          verified: true,
          verification_status: 'verified'
        })
        .eq('id', supplierId);

      if (error) throw error;
      toast.success('Supplier verified');
      loadSuppliers();
      loadStats();
      
      // Send notification to supplier
      try {
        const { notifyVerificationStatusChange } = await import('@/services/notificationService');
        await notifyVerificationStatusChange(supplierId, 'approved');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    } catch (error) {
      toast.error('Failed to verify supplier');
    }
  };

  const handleRejectSupplier = async (supplierId) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ verification_status: 'rejected' })
        .eq('id', supplierId);

      if (error) throw error;
      toast.success('Supplier rejected');
      loadSuppliers();
      loadStats();
      
      // Send notification to supplier
      try {
        const { notifyVerificationStatusChange } = await import('@/services/notificationService');
        await notifyVerificationStatusChange(supplierId, 'rejected', 'Your verification request was rejected. Please review your documents and resubmit.');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    } catch (error) {
      toast.error('Failed to reject supplier');
    }
  };

  // ✅ KERNEL COMPLIANCE: Use isSystemReady instead of authReady/authLoading
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading marketplace..." ready={isSystemReady} />;
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const productColumns = [
    { header: 'Product', accessor: 'title', render: (value, row) => (
      <div className="flex items-center gap-3">
        {row.images && row.images[0] && (
          <img src={row.images[0]} alt={value} className="w-12 h-12 object-cover rounded-lg" />
        )}
        <div>
          <div className="font-medium text-afrikoni-text-dark">{value || 'N/A'}</div>
          <div className="text-xs text-afrikoni-text-dark/70">{row.categories?.name || 'No category'}</div>
        </div>
      </div>
    )},
    { header: 'Supplier', accessor: 'companies.company_name', render: (value) => value || 'N/A' },
    { header: 'Country', accessor: 'country_of_origin', render: (value) => value || 'N/A' },
    { header: 'Price', accessor: 'price', render: (value) => `$${parseFloat(value || 0).toLocaleString()}` },
    { header: 'Views', accessor: 'views', render: (value) => value || 0 },
    { header: 'Inquiries', accessor: 'inquiries', render: (value) => value || 0 },
    { header: 'Status', accessor: 'status', render: (value) => <StatusChip status={value} type="product" /> },
    { 
      header: 'Actions', 
      accessor: 'id',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/product?id=${value}`}>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          {row.status === 'draft' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-green-600 border-green-300 hover:bg-green-50"
                onClick={() => handleApproveProduct(value)}
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleRejectProduct(value)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const supplierColumns = [
    { header: 'Company', accessor: 'company_name', render: (value, row) => (
      <div className="flex items-center gap-3">
        {row.logo_url && (
          <img src={row.logo_url} alt={value} className="w-12 h-12 object-cover rounded-lg" />
        )}
        <div>
          <div className="font-medium text-afrikoni-text-dark">{value || 'N/A'}</div>
          <div className="text-xs text-afrikoni-text-dark/70">{row.email || 'N/A'}</div>
        </div>
      </div>
    )},
    { header: 'Country', accessor: 'country', render: (value) => value || 'N/A' },
    { header: 'Trust Score', accessor: 'trust_score', render: (value) => (
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-afrikoni-gold fill-afrikoni-gold" />
        <span>{value || 0}/100</span>
      </div>
    )},
    { header: 'Orders', accessor: 'total_orders', render: (value) => value || 0 },
    { header: 'Response Rate', accessor: 'response_rate', render: (value) => `${value || 0}%` },
    { header: 'Status', accessor: 'verification_status', render: (value, row) => (
      <div className="flex flex-col gap-1">
        <Badge className={row.verified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
          {row.verified ? 'Verified' : value || 'Unverified'}
        </Badge>
      </div>
    )},
    { 
      header: 'Actions', 
      accessor: 'id',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/supplier?id=${value}`}>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          {!row.verified && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-green-600 border-green-300 hover:bg-green-50"
                onClick={() => handleVerifySupplier(value)}
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleRejectSupplier(value)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const orderColumns = [
    { header: 'Order ID', accessor: 'id', render: (value) => `#${value?.slice(0, 8).toUpperCase()}` },
    { header: 'Product', accessor: 'products.title', render: (value) => value || 'N/A' },
    { header: 'Buyer', accessor: 'companies!orders_buyer_company_id_fkey.company_name', render: (value) => value || 'N/A' },
    { header: 'Seller', accessor: 'companies!orders_seller_company_id_fkey.company_name', render: (value) => value || 'N/A' },
    { header: 'Amount', accessor: 'total_amount', render: (value) => `$${parseFloat(value || 0).toLocaleString()}` },
    { header: 'Status', accessor: 'status', render: (value) => <StatusChip status={value} type="order" /> },
    { header: 'Date', accessor: 'created_at', render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : 'N/A' },
    { 
      header: 'Actions', 
      accessor: 'id',
      render: (value) => (
        <Link to={`/dashboard/orders/${value}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      )
    }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/dashboard/admin" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                Marketplace Overview
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                Monitor and manage all products, suppliers, and orders across the platform
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.totalProducts}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Total Products
                </div>
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
                    <Package className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.activeProducts}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Active Products
                </div>
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
                  <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.totalSuppliers}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Total Suppliers
                </div>
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
                  <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.verifiedSuppliers}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Verified Suppliers
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-clay/20 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-afrikoni-clay" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.totalOrders}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Total Orders
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-gold mb-2">
                  ${(stats.totalGMV / 1000).toFixed(1)}K
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Total GMV
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start bg-afrikoni-ivory border-b border-afrikoni-gold/20 p-0">
                <TabsTrigger value="products" className="px-6 py-4">
                  <Package className="w-4 h-4 mr-2" />
                  Products ({products.length})
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="px-6 py-4">
                  <Building2 className="w-4 h-4 mr-2" />
                  Suppliers ({suppliers.length})
                </TabsTrigger>
                <TabsTrigger value="orders" className="px-6 py-4">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Orders ({orders.length})
                </TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products" className="p-6 space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                    />
                  </div>
                  <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  <DataTable
                    data={products}
                    columns={productColumns}
                  />
                </div>
              </TabsContent>

              {/* Suppliers Tab */}
              <TabsContent value="suppliers" className="p-6 space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                    <Input
                      placeholder="Search suppliers..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                    />
                  </div>
                  <Select value={supplierStatusFilter} onValueChange={setSupplierStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Suppliers Table */}
                <div className="overflow-x-auto">
                  <DataTable
                    data={suppliers}
                    columns={supplierColumns}
                  />
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="p-6 space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                    <Input
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                    />
                  </div>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <DataTable
                    data={orders}
                    columns={orderColumns}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

