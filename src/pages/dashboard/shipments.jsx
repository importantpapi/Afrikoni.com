import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { TableSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { buildShipmentQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { DataTable, StatusChip } from '@/components/shared/ui/data-table';
import { Truck, MapPin, Calendar, DollarSign, Search, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/shared/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { format } from 'date-fns';

export default function DashboardShipments() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState(createPaginationState());
  // Derive role from capabilities for display purposes
  const isLogisticsApproved = capabilities.can_logistics === true && capabilities.logistics_status === 'approved';
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ ARCHITECTURAL FIX: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  
  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading shipments..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      if (!userId) {
        console.log('[DashboardShipments] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    // ✅ ARCHITECTURAL FIX: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[DashboardShipments] Data is stale or first load - refreshing');
      loadShipments();
    } else {
      console.log('[DashboardShipments] Data is fresh - skipping reload');
    }
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate]);

  const loadShipments = async () => {
    if (!profileCompanyId) {
      console.log('[DashboardShipments] No company_id - cannot load shipments');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      const query = buildShipmentQuery({
        logisticsCompanyId: isLogisticsApproved ? profileCompanyId : null,
        status: statusFilter === 'all' ? null : statusFilter
      });
      
      // Use pagination
      const result = await paginateQuery(query.select('*, orders(*, products(*))'), {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      if (result.error) throw result.error;

      // Transform shipments data
      const transformedShipments = Array.isArray(result.data) ? result.data.map(shipment => {
        if (!shipment) return null;
        return {
          id: shipment.id,
          order_id: shipment.order_id,
          tracking_number: shipment.tracking_number,
          origin: shipment.origin_address || 'N/A',
          destination: shipment.destination_address || 'N/A',
          product: shipment.orders?.products?.title || 'N/A',
          quantity: shipment.orders?.quantity || 0,
          status: shipment.status,
          carrier: shipment.carrier || 'N/A',
          estimated_delivery: shipment.estimated_delivery || shipment.orders?.delivery_date,
          created_at: shipment.updated_at || shipment.created_at,
          total_amount: shipment.orders?.total_amount || 0
        };
      }).filter(Boolean) : [];

      setShipments(transformedShipments);
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));
      
      // ✅ ARCHITECTURAL FIX: Mark data as fresh after successful load
      lastLoadTimeRef.current = Date.now();
      markFresh();
    } catch (err) {
      console.error('[DashboardShipments] Error loading shipments:', err);
      setError(err.message || 'Failed to load shipments');
      setShipments([]);
      setPagination(prev => ({
        ...prev,
        totalCount: 0,
        totalPages: 1,
        isLoading: false
      }));
      toast.error('Failed to load shipments');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchQuery || 
      shipment.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const shipmentColumns = [
    { header: 'Shipment ID', accessor: 'id', render: (value) => `#${value?.slice(0, 8).toUpperCase()}` },
    { header: 'Order ID', accessor: 'order_id', render: (value) => value ? `#${value.slice(0, 8).toUpperCase()}` : 'N/A' },
    { header: 'Product', accessor: 'product' },
    { 
      header: 'Route', 
      accessor: 'origin',
      render: (value, row) => (
        <div className="text-sm">
          <div className="text-afrikoni-deep/70">{value || 'N/A'}</div>
          <div className="text-afrikoni-deep/70">→ {row.destination || 'N/A'}</div>
        </div>
      )
    },
    { header: 'Carrier', accessor: 'carrier', render: (value) => value || 'N/A' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusChip status={value} />
    },
    { 
      header: 'Last Updated',
      accessor: 'created_at',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : 'N/A'
    },
    { 
      header: 'Actions',
      accessor: 'id',
      render: (value) => (
        <Link to={`/dashboard/shipments/${value}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
        </Link>
      )
    }
  ];

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return <TableSkeleton />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={loadShipments}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">Shipments</h1>
            <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">Track and manage all shipments</p>
          </div>
          <Link to="/dashboard/shipments/new">
            <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni px-6">
              <Plus className="w-4 h-4 mr-2" />
              New Shipment
            </Button>
          </Link>
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
                    <Truck className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {shipments.filter(s => s.status === 'shipped' || s.status === 'processing').length}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Active Shipments</div>
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
                    <Truck className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {shipments.filter(s => s.status === 'delivered').length}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Delivered</div>
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
                    <Truck className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {shipments.filter(s => s.status === 'shipped').length}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">In Transit</div>
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
                    <DollarSign className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-gold mb-2">
                  ${shipments.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0).toLocaleString()}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Total Value</div>
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
                  placeholder="Search shipments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_pickup">Pending Pickup</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="customs">In Customs</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* v2.5: Premium Shipments Table */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">All Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredShipments.length === 0 ? (
              <EmptyState 
                type="default"
                title="No shipments yet"
                description="Shipments will appear here once orders are placed and assigned to logistics."
                cta="View Orders"
                ctaLink="/dashboard/orders"
              />
            ) : (
              <DataTable
                data={filteredShipments}
                columns={shipmentColumns}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

