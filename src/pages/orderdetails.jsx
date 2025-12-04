import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, DollarSign, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReviewForm from '../components/reviews/ReviewForm';
import { isValidUUID } from '@/utils/security';

export default function OrderDetail() {
  const [order, setOrder] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    // Security: Validate UUID format
    if (!orderId || !isValidUUID(orderId)) {
      toast.error('Invalid order ID');
      navigate(createPageUrl('Orders'));
      return;
    }

    try {
      const [ordersRes, companiesRes, reviewsRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('reviews').select('*').eq('order_id', orderId)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (companiesRes.error) throw companiesRes.error;

      const foundOrder = ordersRes.data?.find(o => o.id === orderId);
      if (!foundOrder) {
        toast.error('Order not found');
        navigate(createPageUrl('Orders'));
        return;
      }

      setOrder(foundOrder);
      const buyerCompany = companiesRes.data?.find(c => c.id === foundOrder.buyer_company_id);
      const sellerCompany = companiesRes.data?.find(c => c.id === foundOrder.seller_company_id);
      setBuyer(buyerCompany);
      setSeller(sellerCompany);
      setHasReviewed(reviewsRes.data && reviewsRes.data.length > 0);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (order.payment_status === 'paid') {
      toast.error('Order already paid');
      return;
    }

    // Security: Verify user is the buyer of this order
    if (!user || !user.company_id || user.company_id !== order.buyer_company_id) {
      toast.error('Unauthorized: Only the order buyer can process payment');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'processing' })
        .eq('id', order.id);

      if (error) throw error;
      toast.success('Payment confirmed!');
      loadData();
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to process payment');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      toast.success('Order status updated');
      loadData();
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!order) return null;

  const isBuyer = user?.company_id === order.buyer_company_id;
  const isSeller = user?.company_id === order.seller_company_id;
  const platformFeeRate = 0.08;
  const totalAmountNumber = Number(order.total_amount) || 0;
  const platformFeeAmount = totalAmountNumber * platformFeeRate;
  const supplierPayoutEstimate = totalAmountNumber - platformFeeAmount;

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Link to={createPageUrl('Orders')} className="text-amber-600 hover:text-amber-700">
            ← Back to Orders
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-afrikoni-gold/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                      {order.status}
                    </Badge>
                    <Badge variant="outline" className={order.payment_status === 'paid' ? 'bg-green-50 text-green-700' : ''}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-afrikoni-deep mb-1">Quantity</div>
                    <div className="font-semibold text-afrikoni-chestnut">{order.quantity} units</div>
                  </div>
                  <div>
                    <div className="text-sm text-afrikoni-deep mb-1">Unit Price</div>
                    <div className="font-semibold text-afrikoni-chestnut">${order.unit_price}</div>
                  </div>
                  <div>
                    <div className="text-sm text-afrikoni-deep mb-1">Total Amount</div>
                    <div className="text-2xl font-bold text-amber-600">${order.total_amount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-afrikoni-deep mb-1">Currency</div>
                    <div className="font-semibold text-afrikoni-chestnut">{order.currency}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-afrikoni-gold/20 space-y-1">
                  <div className="flex items-center justify-between text-sm text-afrikoni-deep/80">
                    <span>Afrikoni fee (8%)</span>
                    <span className="font-semibold text-afrikoni-chestnut">
                      ${platformFeeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-afrikoni-deep/80">
                    <span>Estimated supplier payout</span>
                    <span className="font-semibold text-afrikoni-chestnut">
                      ${supplierPayoutEstimate.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-afrikoni-deep/60 mt-1">
                    This breakdown is indicative. Final payouts may differ slightly after payment
                    processor fees or special agreements.
                  </p>
                </div>
                {order.shipping_address && (
                  <div>
                    <div className="text-sm text-afrikoni-deep mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Shipping Address
                    </div>
                    <div className="font-semibold text-afrikoni-chestnut">{order.shipping_address}</div>
                  </div>
                )}
                {order.delivery_date && (
                  <div>
                    <div className="text-sm text-afrikoni-deep mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Expected Delivery
                    </div>
                    <div className="font-semibold text-afrikoni-chestnut">
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isBuyer && order.status === 'completed' && !hasReviewed && (
              <Card className="border-afrikoni-gold/20">
                <CardHeader>
                  <CardTitle>Leave a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm
                    order={order}
                    company={seller}
                    onSuccess={() => {
                      setHasReviewed(true);
                      setShowReviewForm(false);
                      loadData();
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {isSeller && (
              <Card className="border-afrikoni-gold/20">
                <CardHeader>
                  <CardTitle>Update Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {['processing', 'shipped', 'delivered', 'completed'].map(status => (
                      <Button
                        key={status}
                        variant={order.status === status ? 'default' : 'outline'}
                        onClick={() => handleUpdateStatus(status)}
                        disabled={order.status === status}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {buyer && (
              <Card className="border-afrikoni-gold/20">
                <CardHeader>
                  <CardTitle>Buyer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-afrikoni-chestnut">{buyer.company_name}</div>
                  <div className="text-sm text-afrikoni-deep">{buyer.country}</div>
                </CardContent>
              </Card>
            )}

            {seller && (
              <Card className="border-afrikoni-gold/20">
                <CardHeader>
                  <CardTitle>Seller</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-afrikoni-chestnut">{seller.company_name}</div>
                  <div className="text-sm text-afrikoni-deep">{seller.country}</div>
                </CardContent>
              </Card>
            )}

            {isBuyer && order.payment_status === 'pending' && (
              <Card className="border-afrikoni-gold/20">
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handlePayment} className="w-full bg-afrikoni-gold hover:bg-amber-700">
                    Mark as Paid
                  </Button>
                  <p className="text-xs text-afrikoni-deep/70 mt-2">Or proceed to payment gateway</p>
                  <Link to={createPageUrl('PaymentGateway') + '?order=' + order.id}>
                    <Button variant="outline" className="w-full mt-2">
                      Go to Payment Gateway
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

