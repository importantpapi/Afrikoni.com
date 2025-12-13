/**
 * Fulfillment Dashboard
 * Manage order fulfillment and warehouse locations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Warehouse, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { 
  getOrderFulfillment,
  updateFulfillmentStatus,
  getWarehouseLocations
} from '@/lib/supabaseQueries/logistics';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';

export default function FulfillmentDashboard() {
  const [fulfillments, setFulfillments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user || !userCompanyId) {
        navigate('/login');
        return;
      }

      setCompanyId(userCompanyId);

      // Load orders with fulfillment status
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          fulfillment:order_fulfillment(*),
          buyer_company:companies!orders_buyer_company_id_fkey(*)
        `)
        .eq('seller_company_id', userCompanyId)
        .order('created_at', { ascending: false });

      if (orders) {
        const fulfillmentsList = orders
          .filter(order => order.fulfillment)
          .map(order => ({
            ...order.fulfillment,
            order: order
          }))
          .filter(f => statusFilter === 'all' || f.status === statusFilter);
        
        setFulfillments(fulfillmentsList);
      }

      // Load warehouses
      const warehousesList = await getWarehouseLocations(userCompanyId);
      setWarehouses(warehousesList);
    } catch (error) {
      console.error('Error loading fulfillment data:', error);
      toast.error('Failed to load fulfillment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (fulfillmentId, newStatus) => {
    try {
      await updateFulfillmentStatus(fulfillmentId, newStatus);
      toast.success(`Fulfillment status updated to ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Error updating fulfillment:', error);
      toast.error('Failed to update fulfillment status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'outline',
      'picking': 'default',
      'packed': 'default',
      'ready_for_dispatch': 'default',
      'handed_to_carrier': 'success',
      'cancelled': 'destructive'
    };
    return variants[status] || 'outline';
  };

  const getStatusIcon = (status) => {
    if (status === 'handed_to_carrier') return <CheckCircle className="w-4 h-4" />;
    if (status === 'cancelled') return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      'pending': 'picking',
      'picking': 'packed',
      'packed': 'ready_for_dispatch',
      'ready_for_dispatch': 'handed_to_carrier'
    };
    return flow[currentStatus];
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Order Fulfillment</h1>
            <p className="text-afrikoni-text-dark/70">Manage order picking, packing, and dispatch</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {fulfillments.filter(f => f.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {fulfillments.filter(f => ['picking', 'packed'].includes(f.status)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Ready</p>
              <p className="text-2xl font-bold text-purple-600">
                {fulfillments.filter(f => f.status === 'ready_for_dispatch').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Dispatched</p>
              <p className="text-2xl font-bold text-green-600">
                {fulfillments.filter(f => f.status === 'handed_to_carrier').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="picking">Picking</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="ready_for_dispatch">Ready for Dispatch</SelectItem>
                <SelectItem value="handed_to_carrier">Dispatched</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Fulfillments List */}
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {fulfillments.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No fulfillment orders"
                description="Orders requiring fulfillment will appear here"
              />
            ) : (
              <div className="space-y-3">
                {fulfillments.map((fulfillment) => (
                  <motion.div
                    key={fulfillment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-afrikoni-gold" />
                          <p className="font-semibold">
                            Order #{fulfillment.order?.order_number || fulfillment.order_id?.slice(0, 8)}
                          </p>
                          <Badge variant={getStatusBadge(fulfillment.status)}>
                            {getStatusIcon(fulfillment.status)}
                            <span className="ml-1 capitalize">{fulfillment.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          Buyer: {fulfillment.order?.buyer_company?.name || 'Buyer'}
                        </p>
                        {fulfillment.warehouse && (
                          <p className="text-sm text-afrikoni-text-dark/60">
                            Warehouse: {fulfillment.warehouse?.name || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Link to={`/dashboard/orders/${fulfillment.order_id}`}>
                        <Button variant="outline" size="sm">
                          View Order
                        </Button>
                      </Link>
                      {getNextStatus(fulfillment.status) && (
                        <Button
                          size="sm"
                          className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                          onClick={() => handleUpdateStatus(fulfillment.id, getNextStatus(fulfillment.status))}
                        >
                          Mark as {getNextStatus(fulfillment.status).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warehouses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="w-5 h-5" />
              Warehouse Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <EmptyState
                icon={Warehouse}
                title="No warehouses"
                description="Add warehouse locations to manage fulfillment"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warehouses.map((warehouse) => (
                  <div key={warehouse.id} className="border rounded-lg p-4">
                    <p className="font-semibold mb-2">{warehouse.name}</p>
                    {warehouse.address && (
                      <p className="text-sm text-afrikoni-text-dark/60 mb-1">
                        {warehouse.address}
                      </p>
                    )}
                    {(warehouse.city || warehouse.country) && (
                      <p className="text-sm text-afrikoni-text-dark/60">
                        {warehouse.city}{warehouse.city && warehouse.country ? ', ' : ''}{warehouse.country}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

