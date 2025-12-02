import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { isValidUUID } from '@/utils/security';

export default function PaymentGateway() {
  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrder();
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
      // Error logged (removed for production)
      toast.error('Failed to load order');
    }
  };

  const handlePayment = async () => {
    if (!order) return;
    if (order.payment_status === 'paid') {
      toast.error('Order already paid');
      return;
    }

    // Security: Verify user is the buyer of this order
    if (!user || !user.company_id || user.company_id !== order.buyer_company_id) {
      toast.error('Unauthorized: Only the order buyer can process payment');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: selectedMethod,
          status: 'processing'
        })
        .eq('id', order.id);

      if (error) throw error;

      // Send email notification
      await supabaseHelpers.email.send({
        to: user.email,
        subject: 'Payment Confirmed - AFRIKONI',
        body: `Your payment of $${order.total_amount} for Order #${order.id.slice(0, 8)} has been confirmed.`
      });

      // Create notification
      await supabase.from('notifications').insert({
        user_email: user.email,
        company_id: user.company_id,
        title: 'Payment Confirmed',
        message: `Payment of $${order.total_amount} confirmed for Order #${order.id.slice(0, 8)}`,
        type: 'payment',
        link: createPageUrl('OrderDetail') + '?id=' + order.id,
        related_id: order.id
      });

      toast.success('Payment processed successfully!');
      setTimeout(() => {
        navigate(createPageUrl('OrderDetail') + '?id=' + order.id);
      }, 1500);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle className="text-2xl">Payment Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-afrikoni-deep">Order #</span>
                <span className="font-semibold text-afrikoni-chestnut">{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-afrikoni-deep">Amount</span>
                <span className="text-2xl font-bold text-amber-600">${order.total_amount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-afrikoni-deep">Currency</span>
                <span className="font-semibold text-afrikoni-chestnut">{order.currency}</span>
              </div>
            </div>

            <div>
              <Label className="mb-4 block">Select Payment Method</Label>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                <div className="flex items-center space-x-2 p-4 border border-afrikoni-gold/20 rounded-lg mb-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Credit/Debit Card</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border border-afrikoni-gold/20 rounded-lg mb-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Bank Transfer</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border border-afrikoni-gold/20 rounded-lg">
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
              <p className="text-sm text-afrikoni-deep mb-2">Payment Terms:</p>
              <ul className="text-sm text-afrikoni-deep space-y-1 list-disc list-inside">
                <li>Secure payment processing</li>
                <li>Money-back guarantee</li>
                <li>Protected transactions</li>
              </ul>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-afrikoni-gold hover:bg-amber-700 h-12 text-lg"
            >
              {isProcessing ? 'Processing Payment...' : `Pay $${order.total_amount}`}
            </Button>

            <p className="text-xs text-center text-afrikoni-deep/70">
              By proceeding, you agree to our terms and conditions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

