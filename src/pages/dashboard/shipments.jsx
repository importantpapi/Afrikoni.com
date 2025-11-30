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
import { Truck, MapPin, Calendar, DollarSign, Search, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function DashboardShipments() {
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadShipments();
  }, [statusFilter]);

  const loadShipments = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);

      // Load actual shipments from shipments table
      let shipmentsQuery = supabase
        .from('shipments')
        .select('*, orders(*, products(*))')
        .order('created_at', { ascending: false });

      if (companyId) {
        shipmentsQuery = shipmentsQuery.eq('logistics_partner_id', companyId);
      }

      const { data: shipmentsData, error: shipmentsError } = await shipmentsQuery;

      if (shipmentsError && shipmentsError.code !== 'PGRST116') {
        throw shipmentsError;
      }

      // Transform shipments data
      const transformedShipments = (shipmentsData || []).map(shipment => ({
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
      }));

      setShipments(transformedShipments);
    } catch (error) {
      // Error logged (removed for production)
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

  if (isLoading) {
    return (
      <DashboardLayout currentRole="logistics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole="logistics">
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Shipments</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">Track and manage all shipments</p>
          </div>
          <Link to="/dashboard/shipments/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Shipping Offer
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Active Shipments</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {shipments.filter(s => s.status === 'shipped' || s.status === 'processing').length}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-afrikoni-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Delivered</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {shipments.filter(s => s.status === 'delivered').length}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">In Transit</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {shipments.filter(s => s.status === 'shipped').length}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep">Total Value</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    ${shipments.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
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
                  placeholder="Search shipments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
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

        {/* Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Shipments</CardTitle>
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
    </DashboardLayout>
  );
}

