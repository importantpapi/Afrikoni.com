import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Calendar, Package, User, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/ui/EmptyState';

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [currentRole, setCurrentRole] = useState('logistics');

  useEffect(() => {
    loadShipmentData();
  }, [id]);

  const loadShipmentData = async () => {
    try {
      setIsLoading(true);
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userData.role || userData.user_role || 'logistics';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

      // Load shipment with order and related data
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select(`
          *,
          orders(
            *,
            products(*),
            buyer_company:buyer_company_id(company_name, country, city),
            seller_company:seller_company_id(company_name, country, city)
          )
        `)
        .eq('id', id)
        .single();

      if (shipmentError) throw shipmentError;
      if (!shipmentData) {
        toast.error('Shipment not found');
        navigate('/dashboard/shipments');
        return;
      }

      setShipment(shipmentData);
      setOrder(shipmentData.orders);
      setNewStatus(shipmentData.status);
    } catch (error) {
      console.error('Error loading shipment:', error);
      toast.error('Failed to load shipment details');
      navigate('/dashboard/shipments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!shipment || !newStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // If delivered, set actual_delivery
      if (newStatus === 'delivered' && !shipment.actual_delivery) {
        await supabase
          .from('shipments')
          .update({ actual_delivery: new Date().toISOString() })
          .eq('id', id);
      }

      toast.success('Shipment status updated');
      loadShipmentData();
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast.error('Failed to update shipment status');
    } finally {
      setIsUpdating(false);
    }
  };

  const buildTimeline = () => {
    if (!shipment) return [];

    const timeline = [];
    const statusOrder = ['pending_pickup', 'picked_up', 'in_transit', 'customs', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(shipment.status);

    statusOrder.forEach((status, index) => {
      const isCompleted = index <= currentStatusIndex;
      const isCurrent = index === currentStatusIndex;

      const statusLabels = {
        pending_pickup: 'Pickup Scheduled',
        picked_up: 'Picked Up',
        in_transit: 'In Transit',
        customs: 'In Customs',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered'
      };

      timeline.push({
        status,
        label: statusLabels[status] || status,
        completed: isCompleted,
        current: isCurrent,
        date: shipment.updated_at && isCompleted ? shipment.updated_at : null
      });
    });

    return timeline;
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <EmptyState 
          type="shipments"
          title="Shipment not found"
          description="The shipment you're looking for doesn't exist"
        />
      </DashboardLayout>
    );
  }

  const timeline = buildTimeline();
  const isLogistics = currentRole === 'logistics';

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard/shipments" className="text-afrikoni-gold hover:text-afrikoni-goldDark text-sm mb-2 inline-block">
              ← Back to Shipments
            </Link>
            <h1 className="text-2xl font-bold text-afrikoni-chestnut">Shipment Details</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
              Tracking: {shipment.tracking_number || 'N/A'}
            </p>
          </div>
          <Badge variant={shipment.status === 'delivered' ? 'success' : 'outline'} className="text-sm px-3 py-1">
            {shipment.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Timeline */}
            <Card className="border-afrikoni-gold/20 shadow-lg bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle>Shipment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.completed 
                            ? 'bg-afrikoni-gold text-white' 
                            : 'bg-afrikoni-cream border-2 border-afrikoni-gold/30'
                        }`}>
                          {item.completed ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Clock className="w-6 h-6 text-afrikoni-deep/50" />
                          )}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className={`w-0.5 h-12 ${
                            item.completed ? 'bg-afrikoni-gold' : 'bg-afrikoni-gold/20'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <h4 className={`font-semibold ${
                          item.current ? 'text-afrikoni-gold' : item.completed ? 'text-afrikoni-chestnut' : 'text-afrikoni-deep/70'
                        }`}>
                          {item.label}
                        </h4>
                        {item.date && (
                          <p className="text-xs text-afrikoni-deep/70 mt-1">
                            {format(new Date(item.date), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            {order && (
              <Card className="border-afrikoni-gold/20 shadow-lg bg-afrikoni-offwhite">
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Order ID</span>
                      <p className="font-medium">{order.id?.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Product</span>
                      <p className="font-medium">{order.products?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Quantity</span>
                      <p className="font-medium">{order.quantity} {order.unit || 'units'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Total Amount</span>
                      <p className="font-medium">{order.currency || 'USD'} {parseFloat(order.total_amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <Link to={`/dashboard/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      View Full Order
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Update Status (for logistics) */}
            {isLogistics && (
              <Card className="border-afrikoni-gold/20 shadow-lg bg-afrikoni-offwhite">
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-afrikoni-chestnut mb-2 block">Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Button 
                    onClick={handleStatusUpdate} 
                    disabled={isUpdating || newStatus === shipment.status}
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Shipment Info */}
            <Card className="border-afrikoni-gold/20 shadow-lg bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle>Shipment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-afrikoni-deep/70">Tracking Number</span>
                  <p className="font-medium">{shipment.tracking_number || 'N/A'}</p>
                </div>
                {shipment.carrier && (
                  <div>
                    <span className="text-afrikoni-deep/70">Carrier</span>
                    <p className="font-medium">{shipment.carrier}</p>
                  </div>
                )}
                {shipment.estimated_delivery && (
                  <div>
                    <span className="text-afrikoni-deep/70">Estimated Delivery</span>
                    <p className="font-medium">{format(new Date(shipment.estimated_delivery), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {shipment.actual_delivery && (
                  <div>
                    <span className="text-afrikoni-deep/70">Delivered On</span>
                    <p className="font-medium">{format(new Date(shipment.actual_delivery), 'MMM d, yyyy')}</p>
                  </div>
                )}
                <div>
                  <span className="text-afrikoni-deep/70">Created</span>
                  <p className="font-medium">{format(new Date(shipment.created_at), 'MMM d, yyyy')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Route */}
            <Card className="border-afrikoni-gold/20 shadow-lg bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle>Route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-afrikoni-deep/70 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Origin</span>
                  </div>
                  <p className="font-medium">{shipment.origin_address || 'N/A'}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-afrikoni-gold mx-auto" />
                <div>
                  <div className="flex items-center gap-2 text-sm text-afrikoni-deep/70 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Destination</span>
                  </div>
                  <p className="font-medium">{shipment.destination_address || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Buyer/Seller Info */}
            {order && (
              <>
                {order.buyer_company && (
                  <Card className="border-afrikoni-gold/20 shadow-lg bg-afrikoni-offwhite">
                    <CardHeader>
                      <CardTitle>Buyer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold text-afrikoni-chestnut">{order.buyer_company.company_name}</h4>
                      <p className="text-sm text-afrikoni-deep/70 mt-1">
                        {order.buyer_company.city && `${order.buyer_company.city}, `}
                        {order.buyer_company.country}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {order.seller_company && (
                  <Card className="border-afrikoni-gold/20 shadow-lg bg-afrikoni-offwhite">
                    <CardHeader>
                      <CardTitle>Seller</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold text-afrikoni-chestnut">{order.seller_company.company_name}</h4>
                      <p className="text-sm text-afrikoni-deep/70 mt-1">
                        {order.seller_company.city && `${order.seller_company.city}, `}
                        {order.seller_company.country}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

