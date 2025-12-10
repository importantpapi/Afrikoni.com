/**
 * Logistics Quote Request Page
 * Request shipping quotes with Afrikoni markup
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, DollarSign, CheckCircle, Sparkles } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase } from '@/api/supabaseClient';
import { calculateShippingQuote, saveLogisticsQuote, acceptLogisticsQuote, getLogisticsQuotes } from '@/services/logisticsService';

export default function LogisticsQuotePage() {
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
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      const { companyId: cid } = await getCurrentUserAndRole(supabase);
      if (!cid) {
        toast.error('Company ID not found. Please ensure you have a company profile.');
        navigate('/dashboard/orders');
        return;
      }
      setCompanyId(cid);
      
      if (!orderId) {
        toast.error('Order ID is missing');
        navigate('/dashboard/orders');
        return;
      }
      
      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error('Order error:', orderError);
        throw orderError;
      }
      
      if (!orderData) {
        toast.error('Order not found');
        navigate('/dashboard/orders');
        return;
      }
      
      setOrder(orderData);
      
      // Pre-fill form with order data if available
      if (orderData) {
        // Pre-fill from order data
        if (orderData.seller_company_id) {
          const { data: sellerCompany } = await supabase
            .from('companies')
            .select('country, city')
            .eq('id', orderData.seller_company_id)
            .single();
          if (sellerCompany) {
            setPickupCountry(sellerCompany.country || '');
            setPickupCity(sellerCompany.city || '');
          }
        }
        if (orderData.buyer_company_id) {
          const { data: buyerCompany } = await supabase
            .from('companies')
            .select('country, city')
            .eq('id', orderData.buyer_company_id)
            .single();
          if (buyerCompany) {
            setDeliveryCountry(buyerCompany.country || '');
            setDeliveryCity(buyerCompany.city || '');
          }
        }
      }
      
      // Load existing quotes
      try {
        const existing = await getLogisticsQuotes(orderId);
        setExistingQuotes(existing || []);
      } catch (quoteError) {
        console.error('Error loading quotes:', quoteError);
        // Continue even if quotes fail to load
        setExistingQuotes([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(`Failed to load order data: ${error?.message || 'Unknown error'}`);
      navigate('/dashboard/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestQuotes = async () => {
    if (!pickupCountry || !deliveryCountry || !weightKg) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!orderId) {
      toast.error('Order ID is missing');
      return;
    }

    if (!companyId) {
      toast.error('Company ID is missing. Please refresh the page.');
      return;
    }

    setIsRequesting(true);
    try {
      // Calculate quotes
      const calculatedQuotes = await calculateShippingQuote({
        pickupCountry,
        deliveryCountry,
        weightKg: parseFloat(weightKg),
        volumeM3: volumeM3 ? parseFloat(volumeM3) : null,
        dimensions
      });

      if (!calculatedQuotes || calculatedQuotes.length === 0) {
        toast.error('No quotes available. Please try again.');
        return;
      }

      // Show calculated quotes immediately
      setQuotes(calculatedQuotes);
      
      // Save quotes to database
      const savePromises = calculatedQuotes.map(quote => 
        saveLogisticsQuote(orderId, companyId, {
          ...quote,
          pickupCountry,
          deliveryCountry,
          pickupCity,
          deliveryCity,
          weightKg: parseFloat(weightKg),
          volumeM3: volumeM3 ? parseFloat(volumeM3) : null,
          dimensions
        }).catch(err => {
          console.error('Error saving quote:', err);
          // Continue even if one quote fails to save
          return null;
        })
      );

      const savedQuotes = await Promise.all(savePromises);
      const successfulSaves = savedQuotes.filter(q => q !== null);
      
      if (successfulSaves.length > 0) {
        // Reload to get quotes with IDs from database
        await loadData();
        
        // Update quotes with IDs from saved quotes
        const quotesWithIds = calculatedQuotes.map(calcQuote => {
          const savedQuote = successfulSaves.find(
            sq => sq.partner_name === calcQuote.partnerName
          );
          return savedQuote ? {
            ...calcQuote,
            id: savedQuote.id
          } : calcQuote;
        });
        setQuotes(quotesWithIds);
      }
      
      toast.success('Shipping quotes generated!');
    } catch (error) {
      console.error('Error requesting quotes:', error);
      const errorMessage = error?.message || 'Failed to generate quotes. Please check if the logistics_quotes table exists in the database.';
      toast.error(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAcceptQuote = async (quote) => {
    if (!confirm(`Accept quote from ${quote.partnerName} for $${quote.finalPrice}?`)) return;
    
    try {
      // If quote has an id (from database), use it; otherwise find the saved quote
      let quoteId = quote.id;
      
      if (!quoteId && quote.partnerId) {
        // Find the saved quote in existingQuotes
        const savedQuote = existingQuotes.find(
          q => q.logistics_partner_id === quote.partnerId || 
               q.partner_name === quote.partnerName
        );
        if (savedQuote) {
          quoteId = savedQuote.id;
        } else {
          // If not found, we need to save it first
          toast.error('Quote not found in database. Please request quotes again.');
          return;
        }
      }
      
      if (!quoteId) {
        toast.error('Quote ID not found');
        return;
      }
      
      await acceptLogisticsQuote(quoteId);
      toast.success('Quote accepted! Logistics margin recorded.');
      await loadData();
      navigate(`/dashboard/orders/${orderId}`);
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error(`Failed to accept quote: ${error?.message || 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
            Request Shipping Quote
          </h1>
          <p className="text-afrikoni-text-dark/70">
            Get competitive shipping quotes with Afrikoni's preferred logistics partners
          </p>
        </div>

        {/* Quote Request Form */}
        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-afrikoni-gold" />
              Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupCountry">Pickup Country *</Label>
                <Input
                  id="pickupCountry"
                  value={pickupCountry}
                  onChange={(e) => setPickupCountry(e.target.value)}
                  placeholder="e.g., Nigeria"
                />
              </div>
              <div>
                <Label htmlFor="deliveryCountry">Delivery Country *</Label>
                <Input
                  id="deliveryCountry"
                  value={deliveryCountry}
                  onChange={(e) => setDeliveryCountry(e.target.value)}
                  placeholder="e.g., Ghana"
                />
              </div>
              <div>
                <Label htmlFor="pickupCity">Pickup City</Label>
                <Input
                  id="pickupCity"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  placeholder="e.g., Lagos"
                />
              </div>
              <div>
                <Label htmlFor="deliveryCity">Delivery City</Label>
                <Input
                  id="deliveryCity"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder="e.g., Accra"
                />
              </div>
              <div>
                <Label htmlFor="weightKg">Weight (kg) *</Label>
                <Input
                  id="weightKg"
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <Label htmlFor="volumeM3">Volume (m³)</Label>
                <Input
                  id="volumeM3"
                  type="number"
                  value={volumeM3}
                  onChange={(e) => setVolumeM3(e.target.value)}
                  placeholder="e.g., 2.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensions (L×W×H in cm)</Label>
              <Input
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g., 100×50×30"
              />
            </div>
            <Button
              onClick={handleRequestQuotes}
              disabled={isRequesting}
              className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
            >
              {isRequesting ? 'Requesting Quotes...' : 'Get Shipping Quotes'}
            </Button>
          </CardContent>
        </Card>

        {/* Quotes Comparison */}
        {quotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-afrikoni-text-dark">
              Compare Logistics Quotes
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {quotes.map((quote, index) => (
                <Card
                  key={index}
                  className={`border-2 ${
                    quote.recommended
                      ? 'border-afrikoni-gold shadow-lg'
                      : 'border-afrikoni-gold/20'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-afrikoni-gold" />
                        <h3 className="font-bold text-lg">{quote.partnerName}</h3>
                      </div>
                      {quote.recommended && (
                        <Badge className="bg-afrikoni-gold text-afrikoni-chestnut">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-afrikoni-text-dark/70">Base Price:</span>
                        <span className="font-semibold">${quote.basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-afrikoni-text-dark/70">
                          Afrikoni Fee ({quote.afrikoniMarkupPercent}%):
                        </span>
                        <span className="font-semibold text-afrikoni-gold">
                          +${quote.afrikoniMarkupAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-afrikoni-gold/20 pt-2 flex justify-between">
                        <span className="font-bold">Total Price:</span>
                        <span className="text-xl font-bold text-afrikoni-green">
                          ${quote.finalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-afrikoni-text-dark/70">
                        <Package className="w-4 h-4" />
                        <span>Estimated delivery: {quote.estimatedDays} days</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleAcceptQuote(quote)}
                      className={`w-full ${
                        quote.recommended
                          ? 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut'
                          : 'bg-afrikoni-purple hover:bg-afrikoni-purple/90 text-white'
                      }`}
                    >
                      Accept Quote
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Existing Quotes */}
        {existingQuotes.length > 0 && quotes.length === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-afrikoni-text-dark">
              Previous Quotes
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {existingQuotes.map((quote) => (
                <Card 
                  key={quote.id} 
                  className={`border-2 ${
                    quote.status === 'accepted'
                      ? 'border-afrikoni-green shadow-lg'
                      : 'border-afrikoni-gold/20'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-afrikoni-gold" />
                        <h3 className="font-bold text-lg">{quote.partner_name}</h3>
                      </div>
                      <Badge variant={quote.status === 'accepted' ? 'success' : 'outline'}>
                        {quote.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-afrikoni-text-dark/70">Base Price:</span>
                        <span className="font-semibold">${parseFloat(quote.base_price || 0).toFixed(2)}</span>
                      </div>
                      {quote.afrikoni_markup_amount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-afrikoni-text-dark/70">
                            Afrikoni Fee ({quote.afrikoni_markup_percent}%):
                          </span>
                          <span className="font-semibold text-afrikoni-gold">
                            +${parseFloat(quote.afrikoni_markup_amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-afrikoni-gold/20 pt-2 flex justify-between">
                        <span className="font-bold">Total Price:</span>
                        <span className="text-xl font-bold text-afrikoni-green">
                          ${parseFloat(quote.final_price || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-afrikoni-text-dark/70">
                        <Package className="w-4 h-4" />
                        <span>Estimated delivery: {quote.estimated_days || 'N/A'} days</span>
                      </div>
                    </div>
                    
                    {quote.status !== 'accepted' && (
                      <Button
                        onClick={() => handleAcceptQuote({
                          id: quote.id,
                          partnerName: quote.partner_name,
                          finalPrice: quote.final_price,
                          partnerId: quote.logistics_partner_id
                        })}
                        className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                      >
                        Accept Quote
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

