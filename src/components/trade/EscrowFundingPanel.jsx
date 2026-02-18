import { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Shield, Check, Lock, CreditCard, Building, Smartphone } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { calculateTradeFees } from '@/services/revenueEngine';
import { toast } from 'sonner';

export default function EscrowFundingPanel({ trade, onNextStep, isTransitioning, capabilities, profile }) {
  const [loading, setLoading] = useState(false);

  const config = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `TRD-${trade.id}-${Date.now()}`,
    amount: trade.total_amount || 0,
    currency: trade.currency || 'USD',
    payment_options: 'card,mobilemoney,ussd,banktransfer,mpesa',
    customer: {
      email: profile?.email || '',
      phone_number: profile?.phone || '',
      name: profile?.full_name || profile?.name || '',
    },
    customizations: {
      title: 'Afrikoni Trade Escrow',
      description: `Escrow for ${trade.product_name || trade.title || 'trade'}`,
      logo: 'https://afrikoni.com/logo.png',
    },
    // ✅ WEBHOOK FIX: Pass trade_id so the server-side webhook can route this payment
    meta: {
      trade_id: trade.id,
      user_id: profile?.id || '',
      company_id: profile?.company_id || '',
      order_type: 'trade',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    handleFlutterPayment({
      callback: async (response) => {
        // Client-side callback — optimistic UI update only.
        // The server-side webhook (flutterwave-webhook Edge Function) is the
        // authoritative source that updates the DB, even if browser closes.
        if (response.status === 'successful') {
          setLoading(true);
          toast.success('Payment received! Confirming with server…', { duration: 3000 });

          // Optimistic update — webhook will also do this server-side
          const { error } = await supabase
            .from('trades')
            .update({
              status: 'ESCROW_FUNDED',
              escrow_funded_at: new Date().toISOString(),
              payment_reference: response.transaction_id,
            })
            .eq('id', trade.id);

          if (!error) {
            toast.success('✅ Escrow funded! Your money is protected until delivery.', { duration: 6000 });
            if (onNextStep) {
              onNextStep('ESCROW_FUNDED');
            }
          } else {
            // Webhook will still handle it — just show a softer message
            toast.info('Payment confirmed. Trade will update shortly.', { duration: 6000 });
          }
        } else {
          toast.error('Payment was not completed. Please try again.');
        }

        closePaymentModal();
        setLoading(false);
      },
      onClose: () => {
        // User closed the modal without paying
      },
    });
  };

  // ✅ FEE FIX: Use revenue engine (8% total) instead of hardcoded 4%
  const fees = calculateTradeFees(trade.total_amount || 0);
  const productValue = fees.netSettlement;
  const platformFee = fees.total;

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* HUGE AMOUNT (Stripe-style) */}
      <div className="text-center mb-8">
        <div className="text-os-sm text-gray-600 mb-2">Amount to pay</div>
        <div className="text-6xl md:text-7xl font-mono font-bold mb-2">
          ${(trade.total_amount || 0).toLocaleString()}
        </div>
        <div className="text-gray-600">
          for {trade.quantity} tons {trade.product_name}
        </div>
      </div>

      {/* TRUST BADGE - HUGE */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-os-md p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-os-2xl font-bold">Your money is 100% protected</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-os-lg">
              Your ${(trade.total_amount || 0).toLocaleString()} is held in escrow (not sent to supplier yet)
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-os-lg">
              Money released ONLY after you confirm delivery
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-os-lg">
              Full refund if supplier fails to deliver
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-os-lg">
              Dispute resolved in 7 days (guaranteed)
            </span>
          </div>
        </div>
      </div>

      {/* ITEMIZED BREAKDOWN */}
      <div className="bg-white border-2 rounded-os-sm p-6 mb-8">
        <h4 className="font-bold mb-4">Price Breakdown</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Product value</span>
            <span className="font-mono">${productValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform fee (8%)</span>
            <span className="font-mono">${platformFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-os-xs">
            <span className="text-gray-500">Payment processing</span>
            <span className="text-gray-500 font-mono">Included</span>
          </div>
          <div className="border-t-2 pt-3 mt-3 flex justify-between font-bold text-os-xl">
            <span>Total</span>
            <span className="font-mono">${(trade.total_amount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* PAYMENT METHODS */}
      <div className="mb-8">
        <h4 className="font-bold mb-4">Payment Methods Accepted</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="border-2 rounded-os-sm p-4 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-os-sm font-semibold">Card</div>
          </div>
          <div className="border-2 rounded-os-sm p-4 text-center">
            <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-os-sm font-semibold">Mobile Money</div>
          </div>
          <div className="border-2 rounded-os-sm p-4 text-center">
            <Building className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-os-sm font-semibold">Bank</div>
          </div>
        </div>
      </div>

      {/* ONE BIG BUTTON */}
      <button
        onClick={handlePayment}
        disabled={loading || isTransitioning || !capabilities?.can_buy}
        className="w-full h-20 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-os-sm text-os-2xl font-bold transition-colors mb-4"
      >
        {loading ? 'Processing...' : `Pay $${(trade.total_amount || 0).toLocaleString()} Securely →`}
      </button>

      {/* SUPPORT */}
      <div className="text-center">
        <p className="text-os-sm text-gray-600 mb-2">
          <Lock className="w-4 h-4 inline mr-1" />
          Secured by Flutterwave · 256-bit encryption
        </p>
        <p className="text-os-sm text-gray-600">
          Need help?{' '}
          <a href="mailto:support@afrikoni.com" className="text-blue-600 font-semibold underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
