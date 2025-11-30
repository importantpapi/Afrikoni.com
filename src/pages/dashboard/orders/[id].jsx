import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
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
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userData.role || userData.user_role || 'buyer';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

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

      // Build timeline
      buildTimeline(orderData, shipmentData);

    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
      navigate('/dashboard/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const buildTimeline = (orderData, shipmentData) => {
    const timelineItems = [];

    // Order created
    timelineItems.push({
      id: 'created',
      title: 'Order Created',
      description: 'Order was placed',
      timestamp: orderData.created_at,
      icon: ShoppingCart,
      status: 'completed'
    });

    // Payment status
    if (orderData.payment_status === 'paid') {
      timelineItems.push({
        id: 'paid',
        title: 'Payment Received',
        description: `Payment of ${orderData.currency} ${parseFloat(orderData.total_amount).toLocaleString()} received`,
        timestamp: orderData.updated_at,
        icon: DollarSign,
        status: 'completed'
      });
    } else {
      timelineItems.push({
        id: 'payment_pending',
        title: 'Payment Pending',
        description: 'Awaiting payment',
        timestamp: orderData.created_at,
        icon: Clock,
        status: 'pending'
      });
    }

    // Order status updates
    if (orderData.status === 'processing') {
      timelineItems.push({
        id: 'processing',
        title: 'Order Processing',
        description: 'Seller is preparing your order',
        timestamp: orderData.updated_at,
        icon: Package,
        status: 'completed'
      });
    }

    if (orderData.status === 'shipped') {
      timelineItems.push({
        id: 'shipped',
        title: 'Order Shipped',
        description: shipmentData?.tracking_number ? `Tracking: ${shipmentData.tracking_number}` : 'Order has been shipped',
        timestamp: shipmentData?.updated_at || orderData.updated_at,
        icon: Truck,
        status: 'completed'
      });
    }

    if (orderData.status === 'delivered') {
      timelineItems.push({
        id: 'delivered',
        title: 'Order Delivered',
        description: 'Order has been delivered',
        timestamp: orderData.delivery_date || orderData.updated_at,
        icon: CheckCircle,
        status: 'completed'
      });
    }

    if (orderData.status === 'completed') {
      timelineItems.push({
        id: 'completed',
        title: 'Order Completed',
        description: 'Order has been completed',
        timestamp: orderData.updated_at,
        icon: CheckCircle,
        status: 'completed'
      });
    }

    if (orderData.status === 'cancelled') {
      timelineItems.push({
        id: 'cancelled',
        title: 'Order Cancelled',
        description: 'Order was cancelled',
        timestamp: orderData.updated_at,
        icon: X,
        status: 'cancelled'
      });
    }

    // Sort by timestamp
    timelineItems.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setTimeline(timelineItems);
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
          console.error('Error creating notification:', err);
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
      console.error('Error updating order:', error);
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
      console.error('Error updating payment:', error);
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
            <h1 className="text-2xl font-bold text-afrikoni-chestnut">
              Order #{id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={order.status === 'completed' ? 'default' : 'outline'} className="text-sm px-3 py-1">
              {order.status}
            </Badge>
            <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'} className="text-sm px-3 py-1">
              {order.payment_status}
            </Badge>
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
                  {timeline.map((item, idx) => {
                    const Icon = item.icon;
                    const isLast = idx === timeline.length - 1;
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-600' :
                            item.status === 'pending' ? 'bg-afrikoni-gold/20 text-afrikoni-gold' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-full ${
                              item.status === 'completed' ? 'bg-green-200' : 'bg-afrikoni-cream'
                            }`} style={{ minHeight: '40px' }} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <h4 className="font-medium text-afrikoni-chestnut">{item.title}</h4>
                          <p className="text-sm text-afrikoni-deep/70">{item.description}</p>
                          <p className="text-xs text-afrikoni-deep/50 mt-1">
                            {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                    {order.status === 'pending' && (
                      <Button 
                        onClick={() => handleStatusUpdate('processing')}
                        disabled={isUpdating}
                        className="w-full" 
                        size="sm"
                      >
                        Start Processing
                      </Button>
                    )}
                    {order.status === 'processing' && (
                      <Button 
                        onClick={() => handleStatusUpdate('shipped')}
                        disabled={isUpdating}
                        className="w-full" 
                        size="sm"
                      >
                        Mark as Shipped
                      </Button>
                    )}
                  </>
                )}

                {canConfirmReceipt && (
                  <Button 
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                    className="w-full bg-green-600 hover:bg-green-700" 
                    size="sm"
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


