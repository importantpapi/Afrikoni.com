import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, DollarSign, Calendar, MapPin, MessageSquare, 
  CheckCircle, Clock, Send, User, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [buyerCompany, setBuyerCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRole, setCurrentRole] = useState('buyer');
  const [companyId, setCompanyId] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    price_per_unit: '',
    total_price: '',
    currency: 'USD',
    delivery_time: '',
    payment_terms: '',
    notes: ''
  });

  useEffect(() => {
    loadRFQData();
  }, [id]);

  const loadRFQData = async () => {
    try {
      setIsLoading(true);
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userData.role || userData.user_role || 'buyer';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const userCompanyId = await getOrCreateCompany(supabase, userData);
      setCompanyId(userCompanyId);

      // Load RFQ with related data
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          *,
          categories(*)
        `)
        .eq('id', id)
        .single();

      if (rfqError) throw rfqError;
      if (!rfqData) {
        toast.error('RFQ not found');
        navigate('/dashboard/rfqs');
        return;
      }

      setRfq(rfqData);

      // Load buyer company
      if (rfqData.buyer_company_id) {
        const { data: buyerData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', rfqData.buyer_company_id)
          .single();
        setBuyerCompany(buyerData);
      }

      // Load quotes for this RFQ
      const { data: quotesData } = await supabase
        .from('quotes')
        .select(`
          *,
          companies:supplier_company_id(*)
        `)
        .eq('rfq_id', id)
        .order('created_at', { ascending: false });

      setQuotes(quotesData || []);

    } catch (error) {
      console.error('Error loading RFQ:', error);
      toast.error('Failed to load RFQ details');
      navigate('/dashboard/rfqs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!companyId) {
      toast.error('Company information required to submit quotes');
      navigate('/dashboard/company-info');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalPrice = parseFloat(quoteForm.total_price || quoteForm.price_per_unit) * parseFloat(rfq.quantity);

      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          rfq_id: id,
          supplier_company_id: companyId,
          price_per_unit: parseFloat(quoteForm.price_per_unit),
          total_price: totalPrice,
          currency: quoteForm.currency,
          delivery_time: quoteForm.delivery_time,
          payment_terms: quoteForm.payment_terms,
          notes: quoteForm.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create notification for buyer using notification service
      if (rfq.buyer_company_id) {
        try {
          const { notifyQuoteSubmitted } = await import('@/services/notificationService');
          await notifyQuoteSubmitted(newQuote.id, id, rfq.buyer_company_id);
        } catch (err) {
          // Fallback to direct insert if service fails
          await supabase.from('notifications').insert({
            company_id: rfq.buyer_company_id,
            title: 'New Quote Received',
            message: `You received a new quote for RFQ: ${rfq.title}`,
            type: 'rfq',
            link: `/dashboard/rfqs/${id}`,
            related_id: newQuote.id
          }).catch(() => {
            // Silently fail
          });
        }
      }

      toast.success('Quote submitted successfully!');
      setShowQuoteForm(false);
      setQuoteForm({
        price_per_unit: '',
        total_price: '',
        currency: 'USD',
        delivery_time: '',
        payment_terms: '',
        notes: ''
      });
      loadRFQData();
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAwardRFQ = async (quoteId) => {
    if (!rfq) return;

    setIsSubmitting(true);
    try {
      // Update RFQ status and awarded_to (awarded_to should be company_id, not quote_id)
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) {
        toast.error('Quote not found');
        return;
      }

      const { error: rfqError } = await supabase
        .from('rfqs')
        .update({
          status: 'awarded',
          awarded_to: quote.supplier_company_id
        })
        .eq('id', id);

      if (rfqError) throw rfqError;

      // Update quote status
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Reject other quotes
      await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('rfq_id', id)
        .neq('id', quoteId);

      // Create notification for awarded supplier
      if (quote.supplier_company_id) {
        try {
          const { createNotification } = await import('@/services/notificationService');
          await createNotification({
            company_id: quote.supplier_company_id,
            title: 'RFQ Awarded',
            message: `Your quote for RFQ "${rfq.title}" has been awarded`,
            type: 'rfq',
            link: `/dashboard/rfqs/${id}`,
            related_id: id
          });
        } catch (err) {
          console.error('Error creating notification:', err);
        }
      }

      toast.success('RFQ awarded successfully!');
      loadRFQData();
    } catch (error) {
      console.error('Error awarding RFQ:', error);
      toast.error('Failed to award RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRFQ = async () => {
    if (!rfq || !confirm('Are you sure you want to close this RFQ? This action cannot be undone.')) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'closed' })
        .eq('id', id);

      if (error) throw error;

      toast.success('RFQ closed successfully');
      loadRFQData();
    } catch (error) {
      console.error('Error closing RFQ:', error);
      toast.error('Failed to close RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenConversation = async (supplierCompanyId) => {
    if (!companyId) return;

    try {
      // Create or get conversation
      const conversationId = `${rfq.buyer_company_id}-${supplierCompanyId}`;
      
      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .or(`id.eq.${conversationId},and(buyer_company_id.eq.${rfq.buyer_company_id},seller_company_id.eq.${supplierCompanyId})`)
        .maybeSingle();

      if (!existingConv) {
        // Get user IDs for buyer and seller
        const [buyerProfile, sellerProfile] = await Promise.all([
          supabase.from('profiles').select('id').eq('company_id', rfq.buyer_company_id).maybeSingle(),
          supabase.from('profiles').select('id').eq('company_id', supplierCompanyId).maybeSingle()
        ]);

        // Create conversation
        const { error: convError } = await supabase.from('conversations').insert({
          id: conversationId,
          buyer_id: buyerProfile.data?.id || null,
          seller_id: sellerProfile.data?.id || null,
          buyer_company_id: rfq.buyer_company_id,
          seller_company_id: supplierCompanyId,
          subject: `RFQ: ${rfq.title}`,
          last_message: `Started conversation about RFQ: ${rfq.title}`
        });

        if (convError && convError.code !== '23505') {
          // Ignore duplicate key errors
          throw convError;
        }
      }

      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error opening conversation:', error);
      toast.error('Failed to open conversation');
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

  if (!rfq) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <EmptyState type="rfqs" title="RFQ not found" description="The RFQ you're looking for doesn't exist" />
      </DashboardLayout>
    );
  }

  const isOwner = (currentRole === 'buyer' || currentRole === 'hybrid') && 
                 rfq.buyer_company_id === companyId;
  const canSubmitQuote = (currentRole === 'seller' || currentRole === 'hybrid') && 
                         rfq.status === 'open' && 
                         rfq.buyer_company_id !== companyId;

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard/rfqs" className="text-afrikoni-gold hover:text-afrikoni-goldDark text-sm mb-2 inline-block">
              ← Back to RFQs
            </Link>
            <h1 className="text-2xl font-bold text-afrikoni-chestnut">{rfq.title}</h1>
          </div>
          <Badge variant={rfq.status === 'open' ? 'default' : 'outline'} className="text-sm px-3 py-1">
            {rfq.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* RFQ Details */}
            <Card>
              <CardHeader>
                <CardTitle>RFQ Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-2">Description</h3>
                  <p className="text-afrikoni-deep/70 whitespace-pre-wrap">{rfq.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <span className="text-sm text-afrikoni-deep/70">Quantity</span>
                    <p className="font-medium">{rfq.quantity} {rfq.unit}</p>
                  </div>
                  {rfq.target_price && (
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Target Price</span>
                      <p className="font-medium">{rfq.target_price}</p>
                    </div>
                  )}
                  {rfq.delivery_location && (
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Delivery Location</span>
                      <p className="font-medium">{rfq.delivery_location}</p>
                    </div>
                  )}
                  {rfq.delivery_deadline && (
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Delivery Deadline</span>
                      <p className="font-medium">{format(new Date(rfq.delivery_deadline), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {rfq.expires_at && (
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Expires</span>
                      <p className="font-medium">{format(new Date(rfq.expires_at), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quote Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quote Responses ({quotes.length})</span>
                  {canSubmitQuote && !showQuoteForm && (
                    <Button onClick={() => setShowQuoteForm(true)} size="sm">
                      Submit Quote
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showQuoteForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 border border-afrikoni-gold/30 rounded-lg bg-afrikoni-offwhite"
                  >
                    <h4 className="font-semibold mb-4">Submit Your Quote</h4>
                    <form onSubmit={handleSubmitQuote} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Price per Unit *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={quoteForm.price_per_unit}
                            onChange={(e) => setQuoteForm({ ...quoteForm, price_per_unit: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Total Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={quoteForm.total_price || (quoteForm.price_per_unit * rfq.quantity)}
                            onChange={(e) => setQuoteForm({ ...quoteForm, total_price: e.target.value })}
                            readOnly={!!quoteForm.price_per_unit}
                          />
                        </div>
                        <div>
                          <Label>Currency</Label>
                          <select
                            value={quoteForm.currency}
                            onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                            className="w-full px-3 py-2 border border-afrikoni-gold/30 rounded-md"
                          >
                            <option value="USD">USD</option>
                            <option value="NGN">NGN</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                        <div>
                          <Label>Delivery Time</Label>
                          <Input
                            value={quoteForm.delivery_time}
                            onChange={(e) => setQuoteForm({ ...quoteForm, delivery_time: e.target.value })}
                            placeholder="e.g., 2-3 weeks"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Payment Terms</Label>
                        <Input
                          value={quoteForm.payment_terms}
                          onChange={(e) => setQuoteForm({ ...quoteForm, payment_terms: e.target.value })}
                          placeholder="e.g., 30% advance, 70% on delivery"
                        />
                      </div>
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={quoteForm.notes}
                          onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                          rows={3}
                          placeholder="Any additional information..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSubmitting} className="flex-1">
                          {isSubmitting ? 'Submitting...' : 'Submit Quote'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowQuoteForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {quotes.length === 0 ? (
                  <EmptyState type="quotes" title="No quotes yet" description="Be the first to submit a quote" />
                ) : (
                  <div className="space-y-4">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="p-4 border border-afrikoni-gold/20 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-afrikoni-chestnut">
                                {quote.companies?.company_name || 'Supplier'}
                              </h4>
                              {quote.status === 'accepted' && (
                                <Badge className="bg-green-600">Accepted</Badge>
                              )}
                            </div>
                            <p className="text-sm text-afrikoni-deep/70">
                              {quote.companies?.country || ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-afrikoni-chestnut">
                              {quote.currency} {parseFloat(quote.total_price).toLocaleString()}
                            </p>
                            <p className="text-xs text-afrikoni-deep/70">
                              {quote.currency} {parseFloat(quote.price_per_unit).toLocaleString()} per unit
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-3 text-sm">
                          {quote.delivery_time && (
                            <div>
                              <span className="text-afrikoni-deep/70">Delivery:</span>
                              <span className="ml-2 font-medium">{quote.delivery_time}</span>
                            </div>
                          )}
                          {quote.payment_terms && (
                            <div>
                              <span className="text-afrikoni-deep/70">Payment:</span>
                              <span className="ml-2 font-medium">{quote.payment_terms}</span>
                            </div>
                          )}
                        </div>

                        {quote.notes && (
                          <p className="text-sm text-afrikoni-deep/70 mb-3">{quote.notes}</p>
                        )}

                        <div className="flex items-center gap-2 pt-3 border-t">
                          {isOwner && rfq.status === 'open' && (
                            <Button
                              onClick={() => handleAwardRFQ(quote.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Award RFQ
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenConversation(quote.supplier_company_id)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Open Conversation
                          </Button>
                          <span className="text-xs text-afrikoni-deep/50 ml-auto">
                            {format(new Date(quote.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Buyer Info */}
            {buyerCompany && (
              <Card>
                <CardHeader>
                  <CardTitle>Buyer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-afrikoni-chestnut">{buyerCompany.company_name}</h4>
                  <p className="text-sm text-afrikoni-deep/70 mt-1">{buyerCompany.country}</p>
                  {buyerCompany.verified && (
                    <Badge className="mt-2 bg-green-600">Verified</Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* RFQ Info */}
            <Card>
              <CardHeader>
                <CardTitle>RFQ Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-afrikoni-deep/70">Created</span>
                  <span>{format(new Date(rfq.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-afrikoni-deep/70">Status</span>
                  <Badge variant="outline">{rfq.status}</Badge>
                </div>
                {rfq.categories && (
                  <div>
                    <span className="text-afrikoni-deep/70">Category</span>
                    <p className="font-medium">{rfq.categories.name}</p>
                  </div>
                )}
                {rfq.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-afrikoni-deep/70">Closes</span>
                    <span>{format(new Date(rfq.expires_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {isOwner && rfq.status === 'open' && (
                  <Button 
                    onClick={handleCloseRFQ}
                    disabled={isSubmitting}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    Close RFQ
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


