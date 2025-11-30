import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole } from '@/utils/roleHelpers';
import { ORDER_STATUS, getStatusLabel, getNextStatuses, canTransitionTo } from '@/constants/status';
import { buildOrderTimeline } from '@/utils/timeline';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, Package, Truck, CheckCircle, Clock, X, 
  DollarSign, Calendar, MapPin, MessageSquare, FileText, User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { TimelineItem } from '@/components/ui/reusable/TimelineItem';
import { StatusBadge } from '@/components/ui/reusable/StatusBadge';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [buyerCompany, setBuyerCompany] = useState(null);
  const [sellerCompany, setSellerCompany] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentRole, setCurrentRole] = useState('buyer');

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const loadOrderData = async () => {
    try {
      setIsLoading(true);
      const { user, profile, role } = await getCurrentUserAndRole();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentRole(getUserRole(profile || user));

      // Load order with related data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          products(*),
          rfqs(*),
          quotes(*)
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) {
        toast.error('Order not found');
        navigate('/dashboard/orders');
        return;
      }

      setOrder(orderData);
      setProduct(orderData.products);

      // Load companies
      const [buyerRes, sellerRes] = await Promise.all([
        orderData.buyer_company_id ? supabase.from('companies').select('*').eq('id', orderData.buyer_company_id).single() : Promise.resolve({ data: null }),
        orderData.seller_company_id ? supabase.from('companies').select('*').eq('id', orderData.seller_company_id).single() : Promise.resolve({ data: null })
      ]);

      setBuyerCompany(buyerRes.data);
      setSellerCompany(sellerRes.data);

      // Load shipment if exists
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', id)
        .maybeSingle();

      setShipment(shipmentData);

      // Build timeline using helper
      const timelineData = buildOrderTimeline(orderData, shipmentData);
      setTimeline(timelineData);

    } catch (error) {
      toast.error('Failed to load order details');
      navigate('/dashboard/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Create notification using notification service
      const otherCompanyId = currentRole === 'buyer' ? order.seller_company_id : order.buyer_company_id;
      if (otherCompanyId) {
        try {
          const { notifyOrderStatusChange } = await import('@/services/notificationService');
          await notifyOrderStatusChange(id, newStatus, order.buyer_company_id, order.seller_company_id);
        } catch (err) {
          // Fallback to direct insert
          const userData = await supabaseHelpers.auth.me();
          if (userData?.email) {
        await supabase.from('notifications').insert({
          company_id: otherCompanyId,
              user_email: userData.email,
              user_id: userData.id,
          title: 'Order Status Updated',
          message: `Order ${id.slice(0, 8)} status changed to ${newStatus}`,
          type: 'order',
          link: `/dashboard/orders/${id}`,
          related_id: id
            }).catch(() => {
              // Silently fail
        });
          }
        }
      }

      toast.success('Order status updated');
      loadOrderData();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async (newPaymentStatus) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Payment status updated');
      loadOrderData();
    } catch (error) {
      toast.error('Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
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

  if (!order) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <EmptyState type="orders" title="Order not found" description="The order you're looking for doesn't exist" />
      </DashboardLayout>
    );
  }

  const canUpdateStatus = (currentRole === 'seller' || currentRole === 'hybrid') && 
                          ['pending', 'processing', 'shipped'].includes(order.status);
  const canConfirmReceipt = (currentRole === 'buyer' || currentRole === 'hybrid') && 
                            order.status === 'delivered';

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard/orders" className="text-afrikoni-gold hover:text-afrikoni-goldDark text-sm mb-2 inline-block">
              ← Back to Orders
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">
              Order #{id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} type="order" size="md" />
            <StatusBadge status={order.payment_status} type="payment" size="md" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(timeline) && timeline.length > 0 ? (
                    timeline.map((item, idx) => (
                      <TimelineItem
                        key={item.id || idx}
                        title={item.title}
                        description={item.description}
                        timestamp={item.timestamp}
                        icon={item.icon}
                        status={item.status || 'pending'}
                        isLast={idx === timeline.length - 1}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-afrikoni-deep/70">No timeline events available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            {product && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {product.images && product.images[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-afrikoni-chestnut">{product.title}</h3>
                      <p className="text-sm text-afrikoni-deep/70 mt-1">{product.short_description}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-afrikoni-deep">Quantity: {order.quantity} {order.products?.unit || 'units'}</span>
                        <span className="text-afrikoni-deep">Unit Price: {order.currency} {parseFloat(order.unit_price).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipment Info */}
            {shipment && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-afrikoni-deep">Tracking Number</span>
                      <span className="font-mono font-medium">{shipment.tracking_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-afrikoni-deep">Status</span>
                      <Badge variant="outline">{shipment.status}</Badge>
                    </div>
                    {shipment.origin_address && (
                      <div>
                        <span className="text-sm text-afrikoni-deep">Origin</span>
                        <p className="text-sm text-afrikoni-deep/70">{shipment.origin_address}</p>
                      </div>
                    )}
                    {shipment.destination_address && (
                      <div>
                        <span className="text-sm text-afrikoni-deep">Destination</span>
                        <p className="text-sm text-afrikoni-deep/70">{shipment.destination_address}</p>
                      </div>
                    )}
                    {shipment.estimated_delivery && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-afrikoni-deep">Estimated Delivery</span>
                        <span className="text-sm">{format(new Date(shipment.estimated_delivery), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-afrikoni-deep">Subtotal</span>
                  <span className="font-medium">{order.currency} {parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-afrikoni-deep">Shipping</span>
                  <span className="font-medium">{order.currency} {parseFloat(order.shipping_cost || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{order.currency} {parseFloat(order.total_amount + (order.shipping_cost || 0)).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentRole === 'buyer' || currentRole === 'hybrid' ? 'Supplier' : 'Buyer'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRole === 'buyer' || currentRole === 'hybrid' ? (
                  sellerCompany ? (
                    <div>
                      <h4 className="font-semibold text-afrikoni-chestnut">{sellerCompany.company_name}</h4>
                      <p className="text-sm text-afrikoni-deep/70 mt-1">{sellerCompany.country}</p>
                      <Link to={`/supplier/${sellerCompany.id}`}>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-afrikoni-deep/70">Company information not available</p>
                  )
                ) : (
                  buyerCompany ? (
                    <div>
                      <h4 className="font-semibold text-afrikoni-chestnut">{buyerCompany.company_name}</h4>
                      <p className="text-sm text-afrikoni-deep/70 mt-1">{buyerCompany.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-afrikoni-deep/70">Company information not available</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={`/messages?order=${id}`}>
                  <Button variant="outline" className="w-full" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
                
                {canUpdateStatus && (
                  <>
                    {getNextStatuses(order.status, 'order').map(nextStatus => (
                      <Button
                        key={nextStatus}
                        onClick={() => handleStatusUpdate(nextStatus)}
                        disabled={isUpdating || !canTransitionTo(order.status, nextStatus, 'order')}
                        className="w-full"
                        size="sm"
                      >
                        {getStatusLabel(nextStatus, 'order')}
                      </Button>
                    ))}
                  </>
                )}

                {canConfirmReceipt && (
                  <Button 
                    onClick={() => handleStatusUpdate(ORDER_STATUS.COMPLETED)}
                    disabled={isUpdating}
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    Confirm Receipt
                  </Button>
                )}

                {currentRole === 'buyer' && order.payment_status === 'pending' && (
                  <Button 
                    onClick={() => handlePaymentStatusUpdate('paid')}
                    disabled={isUpdating}
                    className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark" 
                    size="sm"
                  >
                    Mark as Paid
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


