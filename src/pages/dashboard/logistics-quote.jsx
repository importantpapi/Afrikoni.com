/**
 * Logistics Quote Request Page
 * Request shipping quotes with Afrikoni markup
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Package, Sparkles } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import {
  calculateShippingQuote,
  saveLogisticsQuote,
  acceptLogisticsQuote,
  getLogisticsQuotes,
} from '@/services/logisticsService';
import { recordLogisticsRevenue } from '@/services/revenueService';
import RequireCapability from '@/guards/RequireCapability';

function LogisticsQuoteInner() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  // Quote request form
  const [pickupCountry, setPickupCountry] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [volumeM3, setVolumeM3] = useState('');
  const [dimensions, setDimensions] = useState('');

  // Quotes
  const [quotes, setQuotes] = useState([]);
  const [existingQuotes, setExistingQuotes] = useState([]);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[LogisticsQuote] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadData();
  }, [orderId, authReady, authLoading, user, profile, role, navigate]);

  const loadData = async () => {
    try {
      // Use company_id from profile
      const cid = profile?.company_id || null;

      if (!cid) {
        toast.error('Company ID not found.');
        navigate('/dashboard/orders');
        return;
      }

      setCompanyId(cid);

      if (orderId) {
        const { data: orderData, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) {
          toast.error('Order not found');
        } else {
          setOrder(orderData);

          if (orderData.seller_company_id) {
            const { data } = await supabase
              .from('companies')
              .select('country, city')
              .eq('id', orderData.seller_company_id)
              .single();
            if (data) {
              setPickupCountry(data.country || '');
              setPickupCity(data.city || '');
            }
          }

          if (orderData.buyer_company_id) {
            const { data } = await supabase
              .from('companies')
              .select('country, city')
              .eq('id', orderData.buyer_company_id)
              .single();
            if (data) {
              setDeliveryCountry(data.country || '');
              setDeliveryCity(data.city || '');
            }
          }

          const existing = await getLogisticsQuotes(orderId);
          setExistingQuotes(existing || []);
        }
      }
    } catch (err) {
      toast.error('Failed to load logistics data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestQuotes = async () => {
    if (!pickupCountry || !deliveryCountry || !weightKg) {
      toast.error('Missing required fields');
      return;
    }

    setIsRequesting(true);
    try {
      const calculated = await calculateShippingQuote({
        pickupCountry,
        deliveryCountry,
        weightKg: parseFloat(weightKg),
        volumeM3: volumeM3 ? parseFloat(volumeM3) : null,
        dimensions,
      });

      setQuotes(calculated || []);

      if (orderId && companyId) {
        await Promise.all(
          calculated.map((q) =>
            saveLogisticsQuote(orderId, companyId, {
              ...q,
              pickupCountry,
              deliveryCountry,
              pickupCity,
              deliveryCity,
              weightKg,
              volumeM3,
              dimensions,
            })
          )
        );
      }

      toast.success('Quotes generated');
    } catch (err) {
      toast.error('Failed to generate quotes');
      console.error(err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAcceptQuote = async (quote) => {
    if (!window.confirm(`Accept quote from ${quote.partnerName}?`)) return;

    try {
      await acceptLogisticsQuote(quote.id);

      // Record Afrikoni logistics margin as a revenue transaction.
      // This is best-effort and should not block acceptance if it fails.
      try {
        await recordLogisticsRevenue({
          orderId,
          logisticsQuoteId: quote.id,
          logisticsPartnerId: companyId,
          basePrice: typeof quote.basePrice === 'number' ? quote.basePrice : quote.finalPrice,
          markupPercent: typeof quote.afrikoniMarkupPercent === 'number' ? quote.afrikoniMarkupPercent : 0,
          markupAmount: typeof quote.afrikoniMarkupAmount === 'number' ? quote.afrikoniMarkupAmount : 0,
          finalPrice: quote.finalPrice,
          currency: quote.currency || (order && order.currency) || 'USD',
        });
      } catch (revErr) {
        if (import.meta.env.DEV) {
          console.error('Failed to record logistics revenue:', revErr);
        }
      }

      toast.success('Quote accepted');
      navigate(`/dashboard/orders/${orderId}`);
    } catch (err) {
      toast.error('Failed to accept quote');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-b-2 border-afrikoni-gold rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Request Shipping Quote</h1>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Pickup Country" value={pickupCountry} onChange={(e) => setPickupCountry(e.target.value)} />
            <Input placeholder="Delivery Country" value={deliveryCountry} onChange={(e) => setDeliveryCountry(e.target.value)} />
            <Input placeholder="Weight (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            <Button onClick={handleRequestQuotes} disabled={isRequesting}>
              Get Quotes
            </Button>
          </CardContent>
        </Card>

        {quotes.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {quotes.map((q, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <span className="font-bold">{q.partnerName}</span>
                    {q.recommended && (
                      <Badge>
                        <Sparkles className="w-3 h-3 mr-1" /> Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 font-semibold">${q.finalPrice}</p>
                  <Button className="mt-4 w-full" onClick={() => handleAcceptQuote(q)}>
                    Accept Quote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function LogisticsQuotePage() {
  return (
    <>
      {/* PHASE 5B: Logistics quote page requires logistics capability (approved) */}
      <RequireCapability canLogistics={true} requireApproved={true}>
        <LogisticsQuoteInner />
      </RequireCapability>
    </>
  );
}
