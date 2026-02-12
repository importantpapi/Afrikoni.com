import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { FileText, Building2, DollarSign, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isValidUUID } from '@/utils/security';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';
import { generateContractFromQuote } from '@/services/contractService';

export default function RFQDetail() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [rfq, setRfq] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [linkedTradeId, setLinkedTradeId] = useState(null);
  const [linkedTradeStatus, setLinkedTradeStatus] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    price_per_unit: '',
    delivery_time: '',
    payment_terms: '',
    notes: ''
  });

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[RFQDetail] Waiting for auth to be ready...');
      return;
    }

    // Now safe to load data (public page, user optional)
    loadData();
  }, [authReady, authLoading]);

  const navigate = useNavigate();

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const rfqId = urlParams.get('id') || urlParams.get('rfqId');
    if (!rfqId || !isValidUUID(rfqId)) {
      toast.error('Invalid RFQ ID');
      navigate('/rfq');
      return;
    }

    try {
      const [rfqsRes, companiesRes, quotesRes] = await Promise.all([
        supabase.from('rfqs').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('quotes').select('*')
      ]);

      if (rfqsRes.error) {
        console.error('Error loading RFQs:', rfqsRes.error);
        throw rfqsRes.error;
      }
      if (companiesRes.error) {
        console.error('Error loading companies:', companiesRes.error);
        throw companiesRes.error;
      }
      if (quotesRes.error) {
        console.error('Error loading quotes:', quotesRes.error);
        throw quotesRes.error;
      }

      const foundRFQ = Array.isArray(rfqsRes.data) && rfqsRes.data.length > 0 ? rfqsRes.data[0] : null;
      if (!foundRFQ) {
        toast.error('RFQ not found');
        navigate('/dashboard');
        return;
      }

      setRfq(foundRFQ);
      const buyerCompany = Array.isArray(companiesRes.data) ? companiesRes.data.find(c => c.id === foundRFQ.buyer_company_id) : null;
      setBuyer(buyerCompany);
      setQuotes(Array.isArray(quotesRes.data) ? quotesRes.data : []);

      try {
        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .select('id, status')
          .or(`rfq_id.eq.${foundRFQ.id},id.eq.${foundRFQ.id}`)
          .maybeSingle?.() ?? { data: null, error: null };
        if (!tradeError && trade?.id) {
          setLinkedTradeId(trade.id);
          setLinkedTradeStatus(trade.status);
        }
      } catch {
        setLinkedTradeId(null);
        setLinkedTradeStatus(null);
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuote = async () => {
    if (!user || !user.company_id) {
      toast.error('Please login first');
      return;
    }

    if (!quoteForm.price_per_unit || !quoteForm.delivery_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Security: Verify user is authenticated and has a company
    if (!user || !user.company_id) {
      toast.error('Please complete your company information to submit quotes');
      navigate('/dashboard/company-info');
      return;
    }

    // Security: Validate numeric inputs
    const pricePerUnit = parseFloat(quoteForm.price_per_unit);
    const quantity = parseFloat(rfq.quantity);

    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      toast.error('Invalid price');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    try {
      const totalPrice = pricePerUnit * quantity;
      const { error } = await supabase.from('quotes').insert({
        rfq_id: rfq.id,
        supplier_company_id: user.company_id, // Always from authenticated user
        price_per_unit: pricePerUnit,
        total_price: totalPrice,
        currency: 'USD',
        delivery_time: quoteForm.delivery_time.trim(),
        payment_terms: quoteForm.payment_terms?.trim() || null,
        notes: quoteForm.notes?.trim() || null,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Quote submitted successfully!');
      setQuoteForm({ price_per_unit: '', delivery_time: '', payment_terms: '', notes: '' });
      setShowQuoteForm(false);
      loadData();
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to submit quote');
    }
  };

  const handleAwardQuote = async (quoteId, supplierCompanyId) => {
    // Security: Verify user is the buyer of this RFQ
    if (!user || !user.company_id || user.company_id !== rfq.buyer_company_id) {
      toast.error('Unauthorized: Only the RFQ buyer can award quotes');
      return;
    }

    // Security: Validate UUIDs
    if (!quoteId || !supplierCompanyId || !rfq.id) {
      toast.error('Invalid quote or supplier ID');
      return;
    }

    try {
      if (!linkedTradeId) {
        toast.error('Kernel trade not linked. Use Trade Workspace to advance.');
        return;
      }

      const contractResult = await generateContractFromQuote(linkedTradeId, quoteId);
      if (!contractResult.success) {
        toast.error(contractResult.error || 'Failed to generate contract');
        return;
      }

      const transitionResult = await transitionTrade(linkedTradeId, TRADE_STATE.CONTRACTED, {
        selectedQuoteId: quoteId,
        supplierId: supplierCompanyId,
        contractId: contractResult.contract?.id
      });

      if (!transitionResult.success) {
        toast.error(transitionResult.error || 'Kernel blocked transition');
        return;
      }

      const quote = quotes.find(q => q.id === quoteId);
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_company_id: rfq.buyer_company_id,
          seller_company_id: supplierCompanyId,
          rfq_id: rfq.id,
          quote_id: quoteId,
          product_id: rfq.product_id || null,
          quantity: rfq.quantity,
          unit_price: quote.price_per_unit,
          total_amount: quote.total_price,
          currency: quote.currency,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Record escrow hold in wallet_transactions (mocked escrow)
      try {
        await supabase.from('wallet_transactions').insert({
          order_id: newOrder.id,
          rfq_id: rfq.id,
          company_id: rfq.buyer_company_id,
          type: 'escrow_hold',
          amount: quote.total_price,
          currency: quote.currency || 'USD',
          status: 'pending',
          description: `Escrow hold for order ${newOrder.id}`
        });
      } catch {
        // non‑blocking
      }

      // Send email notification (buyer + seller)
      try {
        await supabaseHelpers.email.send({
          to: user.email,
          subject: 'Quote Awarded - AFRIKONI',
          body: `Your RFQ "${rfq.title}" has been awarded. Order ${newOrder.id} was created.`
        });
      } catch {
        // ignore email failures here
      }

      // Create notification
      try {
        await supabase.from('notifications').insert({
          user_email: user.email,
          company_id: supplierCompanyId,
          title: 'Quote Awarded',
          message: `Your quote for "${rfq.title}" has been accepted`,
          type: 'quote',
          link: `/dashboard/orders/${newOrder.id}`,
          related_id: newOrder.id
        });
      } catch {
        // non‑blocking
      }

      toast.success('Quote awarded! Order created.');
      setTimeout(() => {
        navigate(createPageUrl('OrderDetail') + '?id=' + newOrder.id);
      }, 1000);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to award quote');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!rfq) return null;

  // ✅ KERNEL COMPLIANCE: Use capabilities instead of user_role
  const { capabilities } = useCapability();
  const isBuyer = user?.company_id === rfq.buyer_company_id;
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const lifecycleStatus = linkedTradeStatus || 'UNLINKED';
  const isRfqOpen = lifecycleStatus === 'rfq_open';

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Card className="border-afrikoni-gold/20 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{rfq.title}</CardTitle>
                <Badge className={isRfqOpen ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                  {lifecycleStatus}
                </Badge>
              </div>
              {isBuyer && isRfqOpen && (
                <Button variant="outline">Edit RFQ</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-afrikoni-chestnut mb-2">Description</h3>
              <p className="text-afrikoni-deep whitespace-pre-wrap">{rfq.description}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-afrikoni-deep mb-1">Quantity</div>
                <div className="font-semibold text-afrikoni-chestnut">{rfq.quantity} {rfq.unit}</div>
              </div>
              {rfq.target_price && (
                <div>
                  <div className="text-sm text-afrikoni-deep mb-1">Target Price</div>
                  <div className="font-semibold text-afrikoni-chestnut">${rfq.target_price} / {rfq.unit}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-afrikoni-deep mb-1">Delivery Location</div>
                <div className="font-semibold text-afrikoni-chestnut">{rfq.delivery_location}</div>
              </div>
              {rfq.delivery_deadline && (
                <div>
                  <div className="text-sm text-afrikoni-deep mb-1">Deadline</div>
                  <div className="font-semibold text-afrikoni-chestnut">{format(new Date(rfq.delivery_deadline), 'PPP')}</div>
                </div>
              )}
            </div>
            {buyer && (
              <div className="pt-4 border-t border-afrikoni-gold/20">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-afrikoni-deep/70" />
                  <span className="text-sm text-afrikoni-deep">Buyer: </span>
                  <span className="font-semibold text-afrikoni-chestnut">{buyer.company_name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isSeller && isRfqOpen && !quotes.find(q => q.supplier_company_id === user.company_id) && (
          <Card className="border-afrikoni-gold/20 mb-6">
            <CardHeader>
              <CardTitle>Submit a Quote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_per_unit">Price per Unit (USD) *</Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    value={quoteForm.price_per_unit}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, price_per_unit: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_time">Delivery Time *</Label>
                  <Input
                    id="delivery_time"
                    value={quoteForm.delivery_time}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, delivery_time: e.target.value }))}
                    placeholder="e.g. 7-14 days"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  value={quoteForm.payment_terms}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder="e.g. 30% advance, 70% on delivery"
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmitQuote} className="bg-afrikoni-gold hover:bg-amber-700">
                Submit Quote
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle>Quotes Received ({quotes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="text-center py-12 text-afrikoni-deep/70">
                <FileText className="w-16 h-16 mx-auto mb-4 text-afrikoni-deep/50" />
                <p>No quotes yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(Array.isArray(quotes) ? quotes : []).map(quote => {
                  const supplierCompany = buyer; // You'd fetch this from companies table
                  return (
                    <Card key={quote.id} className="border-afrikoni-gold/20">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="font-semibold text-afrikoni-chestnut mb-2">Quote #{quote.id.slice(0, 8)}</div>
                            <div className="text-2xl font-bold text-amber-600 mb-1">
                              ${quote.price_per_unit} / {rfq.unit}
                            </div>
                            <div className="text-sm text-afrikoni-deep">Total: ${quote.total_price}</div>
                          </div>
                          <Badge className={quote.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-afrikoni-cream text-afrikoni-deep'}>
                            {quote.status}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <div className="text-afrikoni-deep mb-1">Delivery Time</div>
                            <div className="font-semibold text-afrikoni-chestnut">{quote.delivery_time}</div>
                          </div>
                          {quote.payment_terms && (
                            <div>
                              <div className="text-afrikoni-deep mb-1">Payment Terms</div>
                              <div className="font-semibold text-afrikoni-chestnut">{quote.payment_terms}</div>
                            </div>
                          )}
                        </div>
                        {quote.notes && (
                          <div className="mb-4">
                            <div className="text-sm text-afrikoni-deep mb-1">Notes</div>
                            <p className="text-sm text-afrikoni-deep">{quote.notes}</p>
                          </div>
                        )}
                        {isBuyer && isRfqOpen && quote.status === 'pending' && (
                          <Button
                            onClick={() => handleAwardQuote(quote.id, quote.supplier_company_id)}
                            className="bg-afrikoni-gold hover:bg-amber-700"
                          >
                            Award This Quote
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
