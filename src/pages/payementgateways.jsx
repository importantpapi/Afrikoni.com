import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/shared/ui/radio-group';
import { Label } from '@/components/shared/ui/label';
import { CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { isValidUUID } from '@/utils/security';
import { logPaymentEvent } from '@/utils/auditLogger';

export default function PaymentGateway() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const flutterwavePublicKey = import.meta.env.VITE_FLW_PUBLIC_KEY;

  // Load Flutterwave inline script lazily
  const loadFlutterwaveScript = () => {
    return new Promise((resolve, reject) => {
      if (window.FlutterwaveCheckout) {
        resolve(true);
        return;
      }
      const existing = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[PaymentGateway] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login');
      return;
    }

    // Now safe to load order
    loadOrder();
  }, [authReady, authLoading, user, navigate]);

  const loadOrder = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    
    // Security: Validate UUID format
    if (!orderId || !isValidUUID(orderId)) {
      toast.error('Invalid order ID');
      navigate(createPageUrl('Orders'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Order not found');
        navigate(createPageUrl('Orders'));
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      const errorMessage = error?.message || 'Failed to load order';
      
      // Provide more specific error messages
      if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
        toast.error('Authentication error. Please log in again.');
        navigate('/login');
      } else if (errorMessage.includes('not found') || errorMessage.includes('PGRST116')) {
        toast.error('Order not found. Please check the order ID.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to load order: ${errorMessage}`);
      }
    }
  };

  const handlePayment = async () => {
    if (!order) return;
    if (order.payment_status === 'paid') {
      toast.error('Order already paid');
      return;
    }

    // Security: Verify user is the buyer of this order
    const userCompanyId = profile?.company_id || user?.company_id || null;
    if (!user || !userCompanyId || userCompanyId !== order.buyer_company_id) {
      toast.error('Unauthorized: Only the order buyer can process payment');
      return;
    }

    if (!flutterwavePublicKey) {
      toast.error('Payment gateway not configured. Please contact support.');
      return;
    }

    setIsProcessing(true);
    try {
      await loadFlutterwaveScript();

      const txRef = `${order.id}-${Date.now()}`;
      const amount = Number(order.total_amount) || 0;
      if (!amount || amount <= 0) {
        throw new Error('Invalid order amount');
      }

      // eslint-disable-next-line no-undef
      window.FlutterwaveCheckout({
        public_key: flutterwavePublicKey,
        tx_ref: txRef,
        amount,
        currency: order.currency || 'USD',
        payment_options: selectedMethod === 'bank_transfer' ? 'banktransfer' : 'card,banktransfer',
        customer: {
          email: user.email,
          name: user.full_name || user.email,
        },
        meta: {
          order_id: order.id,
          buyer_company_id: profile?.company_id || user?.company_id,
        },
        customizations: {
          title: 'Afrikoni Trade Shield',
          description: `Payment for Order #${order.id.slice(0, 8)}`,
          logo: '/logo192.png',
        },
        callback: async (response) => {
          try {
            if (response.status === 'successful' || response.status === 'completed') {
              const { error } = await supabase
                .from('orders')
                .update({
                  payment_status: 'paid',
                  payment_method: 'flutterwave',
                  status: 'processing',
                  payment_reference: response.transaction_id || response.tx_ref || txRef
                })
                .eq('id', order.id);

              if (error) throw error;

              // Get order details with product and supplier info for email
              const { data: orderDetails } = await supabase
                .from('orders')
                .select(`
                  *,
                  products:product_id (
                    title,
                    supplier_id,
                    companies:supplier_id (
                      company_name,
                      email
                    )
                  )
                `)
                .eq('id', order.id)
                .single();

              // Send order confirmation email to buyer
              try {
                const { sendOrderConfirmationEmail } = await import('@/services/emailService');
                await sendOrderConfirmationEmail(user.email, {
                  orderNumber: order.id.slice(0, 8),
                  orderId: order.id,
                  productName: orderDetails?.products?.title || 'Product',
                  quantity: order.quantity || 1,
                  totalAmount: order.total_amount,
                  currency: order.currency || 'USD',
                  supplierName: orderDetails?.products?.companies?.company_name || 'Supplier',
                  estimatedDelivery: order.estimated_delivery_date || null
                });
              } catch (emailError) {
                console.log('Order confirmation email not sent:', emailError);
              }

              // Send payment received email to supplier
              if (orderDetails?.products?.companies?.email) {
                try {
                  const { sendPaymentReceivedEmail } = await import('@/services/emailService');
                  await sendPaymentReceivedEmail(orderDetails.products.companies.email, {
                    amount: order.total_amount,
                    currency: order.currency || 'USD',
                    orderNumber: order.id.slice(0, 8),
                    orderId: order.id,
                    buyerName: user.full_name || user.email
                  });
                } catch (emailError) {
                  console.log('Payment received email not sent to supplier:', emailError);
                }
              }

              await supabase.from('notifications').insert({
                user_email: user.email,
                company_id: profile?.company_id || user?.company_id,
                title: 'Payment Confirmed',
                message: `Payment of $${order.total_amount} confirmed for Order #${order.id.slice(0, 8)}`,
                type: 'payment',
                link: createPageUrl('OrderDetail') + '?id=' + order.id,
                related_id: order.id
              });

              // Log payment success to audit log
              // Use auth from context (no duplicate call)
              await logPaymentEvent({
                order_id: order.id,
                amount: order.total_amount,
                currency: order.currency || 'USD',
                payment_method: 'flutterwave',
                status: 'success',
                user: user,
                profile: profile,
                company_id: profile?.company_id || user?.company_id,
                metadata: {
                  transaction_id: response.transaction_id || response.tx_ref || txRef,
                  payment_method_selected: selectedMethod
                }
              });

              toast.success('Payment processed successfully via Flutterwave!');
              navigate(createPageUrl('OrderDetail') + '?id=' + order.id);
            } else {
              // Log payment failure to audit log
              // Use auth from context (no duplicate call)
              await logPaymentEvent({
                order_id: order.id,
                amount: order.total_amount,
                currency: order.currency || 'USD',
                payment_method: 'flutterwave',
                status: 'failed',
                user: user,
                profile: profile,
                company_id: profile?.company_id || user?.company_id,
                metadata: {
                  failure_reason: response.message || 'Payment not completed',
                  payment_method_selected: selectedMethod
                }
              });
              
              toast.error('Payment was not completed. Please try again.');
            }
          } catch (err) {
            toast.error('Error confirming payment. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        onclose: () => {
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error?.message || 'Payment failed';
      
      // Provide specific error messages
      if (errorMessage.includes('Flutterwave') || errorMessage.includes('script')) {
        toast.error('Payment gateway not available. Please refresh the page and try again.');
      } else if (errorMessage.includes('amount') || errorMessage.includes('Invalid')) {
        toast.error('Invalid payment amount. Please contact support.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Payment error: ${errorMessage}. Please try again or contact support.`);
      }
      
      setIsProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="border-os-accent/20">
          <CardHeader>
            <CardTitle className="text-os-2xl">Payment Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-os-sm text-afrikoni-deep">Order #</span>
                <span className="font-semibold text-afrikoni-chestnut">{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-os-sm text-afrikoni-deep">Amount</span>
                <span className="text-os-2xl font-bold text-amber-600">${order.total_amount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-os-sm text-afrikoni-deep">Currency</span>
                <span className="font-semibold text-afrikoni-chestnut">{order.currency}</span>
              </div>
            </div>

            <div>
              <Label className="mb-4 block">Select Payment Method</Label>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                <div className="flex items-center space-x-2 p-4 border border-os-accent/20 rounded-lg mb-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Credit/Debit Card</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border border-os-accent/20 rounded-lg mb-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Bank Transfer</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border border-os-accent/20 rounded-lg">
                  <RadioGroupItem value="escrow" id="escrow" />
                  <Label htmlFor="escrow" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Escrow Service (Recommended)</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-4 bg-afrikoni-offwhite rounded-lg">
              <p className="text-os-sm text-afrikoni-deep mb-2">Payment Terms:</p>
              <ul className="text-os-sm text-afrikoni-deep space-y-1 list-disc list-inside">
                <li>Secure payment processing via Flutterwave</li>
                <li>Money-back guarantee under Afrikoni Trade Shield</li>
                <li>Protected transactions with dispute resolution</li>
              </ul>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-os-accent hover:bg-amber-700 h-12 text-os-lg"
            >
              {isProcessing ? 'Processing Payment...' : `Pay $${order.total_amount}`}
            </Button>

            <p className="text-os-xs text-center text-afrikoni-deep/70">
              By proceeding, you agree to our terms and conditions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

