import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { getUserRole } from '@/utils/roleHelpers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { 
  FileText, DollarSign, Calendar, MapPin, MessageSquare, 
  CheckCircle, Clock, Send, User, Package, Sparkles,
  List, Columns, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { generateSupplierReply } from '@/ai/aiFunctions';
import KoniAIActionButton from '@/components/koni/KoniAIActionButton';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import { getRFQStatusExplanation } from '@/utils/rfqStatusExplanations';
import { RFQ_STATUS, RFQ_STATUS_LABELS } from '@/constants/status';
import { assertRowOwnedByCompany } from '@/utils/securityAssertions';
import { DealMilestoneTracker, DealMilestoneCompact } from '@/components/orders/DealMilestoneTracker';
import { SupplierQuoteTemplates, QuoteWritingTips } from '@/components/quotes/SupplierQuoteTemplates';
import { FirstTimeQuoteGuidance } from '@/components/onboarding/FirstTimeUserGuidance';

export default function RFQDetail() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [buyerCompany, setBuyerCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRole, setCurrentRole] = useState(role || 'buyer');
  const [companyId, setCompanyId] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [quoteViewMode, setQuoteViewMode] = useState('list'); // 'list' or 'compare'
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    quantity: '',
    unit: '',
    target_price: '',
    delivery_location: ''
  });
  const [quoteForm, setQuoteForm] = useState({
    price_per_unit: '',
    total_price: '',
    currency: 'USD',
    incoterms: '',
    lead_time: '',
    moq: '',
    notes: '',
    confirmed: false
  });
  const [koniaiLoading, setKoniaiLoading] = useState(false);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[RFQDetail] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[RFQDetail] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadRFQData();
  }, [id, authReady, authLoading, user, profile, role, navigate]);

  const loadRFQData = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const normalizedRole = getUserRole(profile || user) || role || 'buyer';
      setCurrentRole(normalizedRole);
      const userCompanyId = profile?.company_id || null;
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

      // SAFETY ASSERTION: RFQ must belong to current company as buyer to be viewed in detail
      if (userCompanyId) {
        await assertRowOwnedByCompany(rfqData, userCompanyId, 'RFQDetail:rfq');
      }

      setRfq(rfqData);
      setEditForm({
        title: rfqData.title || '',
        description: rfqData.description || '',
        quantity: rfqData.quantity != null ? String(rfqData.quantity) : '',
        unit: rfqData.unit || '',
        target_price: rfqData.target_price != null ? String(rfqData.target_price) : '',
        delivery_location: rfqData.delivery_location || ''
      });

      // Load buyer company - ONLY if user is the buyer or admin
      // Suppliers should NOT see buyer identity
      const isBuyer = normalizedRole === 'buyer' || normalizedRole === 'hybrid';
      const isAdmin = normalizedRole === 'admin';
      if (rfqData.buyer_company_id && (isBuyer || isAdmin)) {
        if (userCompanyId === rfqData.buyer_company_id || isAdmin) {
          const { data: buyerData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', rfqData.buyer_company_id)
            .single();
          setBuyerCompany(buyerData);
        }
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

      setQuotes(Array.isArray(quotesData) ? quotesData : []);

    } catch (error) {
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

    if (!quoteForm.confirmed) {
      toast.error('Please confirm that your quote is accurate and executable');
      return;
    }

    if (!quoteForm.price_per_unit) {
      toast.error('Unit price is required');
      return;
    }

    if (quoteForm.notes && quoteForm.notes.length > 500) {
      toast.error('Notes must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-calculate total if not provided
      const totalPrice = quoteForm.total_price 
        ? parseFloat(quoteForm.total_price)
        : parseFloat(quoteForm.price_per_unit) * parseFloat(rfq.quantity);

      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          rfq_id: id,
          supplier_company_id: companyId,
          price_per_unit: parseFloat(quoteForm.price_per_unit),
          total_price: totalPrice,
          currency: quoteForm.currency,
          delivery_time: quoteForm.lead_time,
          incoterms: quoteForm.incoterms,
          moq: quoteForm.moq || null,
          notes: quoteForm.notes || null,
          status: 'quote_submitted'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Auto-create conversation between buyer and seller when quote is submitted
      if (rfq.buyer_company_id && companyId) {
        try {
          // Check if conversation already exists
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(buyer_company_id.eq.${rfq.buyer_company_id},seller_company_id.eq.${companyId}),and(buyer_company_id.eq.${companyId},seller_company_id.eq.${rfq.buyer_company_id})`)
            .maybeSingle();

          if (!existingConv) {
            // Get user IDs for buyer and seller
            const [buyerProfile, sellerProfile] = await Promise.all([
              supabase.from('profiles').select('id').eq('company_id', rfq.buyer_company_id).limit(1).maybeSingle(),
              supabase.from('profiles').select('id').eq('company_id', companyId).limit(1).maybeSingle()
            ]);

            // Create conversation
            const { error: convError } = await supabase.from('conversations').insert({
              buyer_id: buyerProfile.data?.id || null,
              seller_id: sellerProfile.data?.id || null,
              buyer_company_id: rfq.buyer_company_id,
              seller_company_id: companyId,
              subject: `RFQ: ${rfq.title}`,
              last_message: `Quote submitted for RFQ: ${rfq.title}`,
              last_message_at: new Date().toISOString()
            });

            if (convError && convError.code !== '23505') {
              // Ignore duplicate key errors
              console.warn('Conversation creation failed:', convError);
            }
          }

          // Create initial message in the conversation
          let finalConversationId = existingConv?.id;
          if (!finalConversationId) {
            // Get the newly created conversation
            const { data: newConv } = await supabase
              .from('conversations')
              .select('id')
              .or(`and(buyer_company_id.eq.${rfq.buyer_company_id},seller_company_id.eq.${companyId}),and(buyer_company_id.eq.${companyId},seller_company_id.eq.${rfq.buyer_company_id})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            finalConversationId = newConv?.id;
          }
          
          if (finalConversationId) {
            const { data: currentUser } = await supabase.auth.getUser();
            await supabase.from('messages').insert({
              conversation_id: finalConversationId,
              sender_company_id: companyId,
              receiver_company_id: rfq.buyer_company_id,
              sender_user_email: currentUser.data?.user?.email || '',
              content: `I've submitted a quote for your RFQ: "${rfq.title}". Please review and let me know if you have any questions.`,
              read: false,
              related_to: id,
              related_type: 'rfq',
              subject: `Quote for RFQ: ${rfq.title}`
            });
          }
        } catch (convError) {
          // Conversation creation is optional, continue
          console.warn('Auto-conversation creation failed:', convError);
        }
      }

      // Create notification for buyer using notification service
      if (rfq.buyer_company_id) {
        try {
          const { notifyQuoteSubmitted } = await import('@/services/notificationService');
          await notifyQuoteSubmitted(newQuote.id, id, rfq.buyer_company_id);
        } catch (err) {
          // Fallback to direct insert if service fails
          const { error: notifError } = await supabase.from('notifications').insert({
            company_id: rfq.buyer_company_id,
            title: 'New Quote Received',
            message: `You received a new quote for RFQ: ${rfq.title}`,
            type: 'rfq',
            link: `/dashboard/rfqs/${id}`,
            related_id: newQuote.id
          });
          // Silently ignore notification failures
          if (notifError) {
            // noop
          }
        }
      }

      toast.success('Quote submitted successfully! Your quote is now locked and cannot be edited.');
      setShowQuoteForm(false);
      setQuoteForm({
        price_per_unit: '',
        total_price: '',
        currency: 'USD',
        incoterms: '',
        lead_time: '',
        moq: '',
        notes: '',
        confirmed: false
      });
      loadRFQData();
    } catch (error) {
      toast.error('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKoniaiDraftReply = async () => {
    if (!rfq || !companyId) {
      toast.error('RFQ or company information not available');
      return;
    }

    setKoniaiLoading(true);
    try {
      // Load company data
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      const supplier = companyData || {
        id: companyId,
        company_name: 'Your Company',
        country: '',
        certifications: [],
        trust_score: 50
      };

      const result = await generateSupplierReply(rfq, supplier, {
        tone: 'Professional'
      });

      if (result.success && result.data?.message) {
        setQuoteForm(prev => ({
          ...prev,
          notes: result.data.message
        }));
        toast.success('✨ KoniAI generated a draft reply! Review and edit before submitting.');
      } else {
        toast.error('KoniAI couldn\'t generate a reply. Please try again.');
      }
    } catch (error) {
      console.error('KoniAI draft reply error:', error);
      toast.error('KoniAI couldn\'t complete this request. Please try again in a moment.');
    } finally {
      setKoniaiLoading(false);
    }
  };

  const handleAwardRFQ = async (quoteId) => {
    if (!rfq) return;

    // GUARD: Check auth
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use auth from context (no duplicate call)
      
      // Update RFQ status and awarded_to (awarded_to should be company_id, not quote_id)
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) {
        toast.error('Quote not found');
        return;
      }

      // Use safe status transition with validation
      const { transitionRFQStatus } = await import('@/utils/rfqStatusTransitions');
      const transitionResult = await transitionRFQStatus(
        id,
        'awarded',
        user.id,
        `Awarded to supplier: ${quote.supplier_company_id}`,
        { quote_id: quoteId, supplier_company_id: quote.supplier_company_id }
      );

      if (!transitionResult.success) {
        toast.error(transitionResult.error || 'Invalid status transition');
        setIsSubmitting(false);
        return;
      }

      // Update awarded_to separately
      const { error: rfqError } = await supabase
        .from('rfqs')
        .update({
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

      // Mark RFQ as commission eligible (soft trigger - no payment yet)
      await supabase
        .from('rfqs')
        .update({
          commission_eligible: true,
          commission_eligible_at: new Date().toISOString()
        })
        .eq('id', id);

      // Create order from awarded quote
      // Note: buyer_protection_enabled and buyer_protection_fee can be set later by buyer
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_company_id: rfq.buyer_company_id,
          seller_company_id: quote.supplier_company_id,
          rfq_id: id,
          quote_id: quoteId,
          product_id: rfq.product_id || null,
          quantity: rfq.quantity || quote.quantity || 1,
          unit_price: quote.price_per_unit,
          total_amount: quote.total_price,
          currency: quote.currency || 'USD',
          status: 'pending',
          payment_status: 'pending',
          delivery_location: rfq.delivery_location || null,
          buyer_protection_enabled: false,
          buyer_protection_fee: 0,
          commission_eligible: true // Mark order as commission eligible
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        // Continue even if order creation fails - RFQ was still awarded
        toast.warning('RFQ awarded but order creation failed. Please create order manually.');
      } else {
        // Create escrow payment record
        try {
          const { createEscrowPayment } = await import('@/lib/supabaseQueries/payments');
          await createEscrowPayment({
            order_id: newOrder.id,
            buyer_company_id: rfq.buyer_company_id,
            seller_company_id: quote.supplier_company_id,
            amount: quote.total_price,
            currency: quote.currency || 'USD',
            status: 'pending'
          });
        } catch (escrowError) {
          // Escrow creation is optional, continue
          console.warn('Escrow creation failed:', escrowError);
        }

        // Create wallet transaction for escrow hold
        try {
          await supabase.from('wallet_transactions').insert({
            order_id: newOrder.id,
            rfq_id: id,
            company_id: rfq.buyer_company_id,
            type: 'escrow_hold',
            amount: quote.total_price,
            currency: quote.currency || 'USD',
            status: 'pending',
            description: `Escrow hold for order ${newOrder.id}`
          });
        } catch (walletError) {
          // Wallet transaction is optional
          console.warn('Wallet transaction creation failed:', walletError);
        }
      }

      // Create notification for awarded supplier
      if (quote.supplier_company_id) {
        try {
          const { createNotification } = await import('@/services/notificationService');
          await createNotification({
            company_id: quote.supplier_company_id,
            title: 'RFQ Awarded',
            message: `Your quote for RFQ "${rfq.title}" has been awarded${newOrder ? ` - Order ${newOrder.id} created` : ''}`,
            type: 'rfq',
            link: newOrder ? `/dashboard/orders/${newOrder.id}` : `/dashboard/rfqs/${id}`,
            related_id: newOrder?.id || id
          });
        } catch (err) {
          // Notification creation failed, but quote was submitted
        }
      }

      toast.success(newOrder ? `RFQ awarded! Order ${newOrder.id} created.` : 'RFQ awarded successfully!');
      
      // Navigate to order if created
      if (newOrder) {
        setTimeout(() => {
          navigate(`/dashboard/orders/${newOrder.id}`);
        }, 1500);
      } else {
        loadRFQData();
      }
    } catch (error) {
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
      toast.error('Failed to open conversation');
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdits = async () => {
    if (!rfq) return;

    const title = editForm.title?.trim();
    const description = editForm.description?.trim();
    const quantityNum = parseFloat(editForm.quantity);
    const targetPriceNum = editForm.target_price ? parseFloat(editForm.target_price) : null;

    if (!title || !description || !editForm.quantity) {
      toast.error('Title, description and quantity are required');
      return;
    }
    if (Number.isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (editForm.target_price && (Number.isNaN(targetPriceNum) || targetPriceNum < 0)) {
      toast.error('Please enter a valid target price');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        title,
        description,
        quantity: quantityNum,
        unit: editForm.unit || rfq.unit || 'pieces',
        target_price: targetPriceNum,
        delivery_location: editForm.delivery_location || null
      };

      const { error } = await supabase
        .from('rfqs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('RFQ updated successfully');
      setIsEditing(false);
      await loadRFQData();
    } catch (error) {
      toast.error('Failed to update RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRFQ = async () => {
    if (!rfq) return;
    if (quotes.length > 0) {
      toast.error('You cannot delete this RFQ because it already has quotes. You can close it instead.');
      return;
    }
    if (!window.confirm('Delete this RFQ permanently? This cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('rfqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('RFQ deleted');
      navigate('/dashboard/rfqs');
    } catch (error) {
      toast.error('Failed to delete RFQ');
    } finally {
      setIsSubmitting(false);
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
  const isSupplier = (currentRole === 'seller' || currentRole === 'hybrid') && 
                     rfq.buyer_company_id !== companyId;
  // Supplier can only submit if: RFQ is matched AND supplier is in matched_supplier_ids
  const isMatchedSupplier = isSupplier && 
    rfq?.status === 'matched' && 
    rfq?.matched_supplier_ids && 
    Array.isArray(rfq.matched_supplier_ids) &&
    rfq.matched_supplier_ids.includes(companyId);
  const canSubmitQuote = isMatchedSupplier && 
    !quotes.some(q => q.supplier_company_id === companyId && q.status === 'quote_submitted');

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

        {/* RFQ Lifecycle Visibility (Buyer Only) */}
        {isOwner && (() => {
          const explanation = getRFQStatusExplanation(rfq.status);
          return (
            <Card className="border-afrikoni-gold/30 bg-afrikoni-cream/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{explanation.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-afrikoni-chestnut">Status: {explanation.title}</h3>
                      <Badge variant={rfq.status === 'matched' ? 'success' : rfq.status === 'awarded' ? 'success' : 'info'}>
                        {RFQ_STATUS_LABELS[rfq.status] || rfq.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-afrikoni-deep mb-2">{explanation.description}</p>
                    <div className="bg-white/50 rounded-lg p-3 border border-afrikoni-gold/20">
                      <p className="text-xs font-semibold text-afrikoni-chestnut mb-1">What's Next:</p>
                      <p className="text-xs text-afrikoni-deep">{explanation.whatNext}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <div className="grid md:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* RFQ Details */}
            <Card>
              <CardHeader>
                <CardTitle>RFQ Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOwner && isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        value={editForm.title}
                        onChange={(e) => handleEditChange('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        rows={5}
                        value={editForm.description}
                        onChange={(e) => handleEditChange('description', e.target.value)}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-quantity">Quantity</Label>
                        <Input
                          id="edit-quantity"
                          type="number"
                          value={editForm.quantity}
                          onChange={(e) => handleEditChange('quantity', e.target.value)}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-unit">Unit</Label>
                        <Input
                          id="edit-unit"
                          value={editForm.unit}
                          onChange={(e) => handleEditChange('unit', e.target.value)}
                          placeholder="pieces, kg, tons..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-target-price">Target Price per Unit (optional)</Label>
                        <Input
                          id="edit-target-price"
                          type="number"
                          step="0.01"
                          value={editForm.target_price}
                          onChange={(e) => handleEditChange('target_price', e.target.value)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-delivery-location">Delivery Location</Label>
                        <Input
                          id="edit-delivery-location"
                          value={editForm.delivery_location}
                          onChange={(e) => handleEditChange('delivery_location', e.target.value)}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveEdits} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            title: rfq.title || '',
                            description: rfq.description || '',
                            quantity: rfq.quantity != null ? String(rfq.quantity) : '',
                            unit: rfq.unit || '',
                            target_price: rfq.target_price != null ? String(rfq.target_price) : '',
                            delivery_location: rfq.delivery_location || ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quote Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quote Responses ({quotes.length})</span>
                  <div className="flex items-center gap-2">
                    {isOwner && quotes.length > 1 && (
                      <div className="flex items-center gap-1 border border-afrikoni-gold/30 rounded-lg p-1">
                        <Button
                          variant={quoteViewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setQuoteViewMode('list')}
                          className="h-8"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={quoteViewMode === 'compare' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setQuoteViewMode('compare')}
                          className="h-8"
                        >
                          <Columns className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {canSubmitQuote && !showQuoteForm && (
                      <Button onClick={() => setShowQuoteForm(true)} size="sm">
                        Submit Quote
                      </Button>
                    )}
                  </div>
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
                    
                    {/* First-Time Quote Guidance */}
                    <FirstTimeQuoteGuidance />
                    
                    {/* Supplier Quote Templates */}
                    <SupplierQuoteTemplates 
                      onTemplateSelect={(templateText) => {
                        setQuoteForm(prev => ({ ...prev, notes: templateText }));
                      }}
                      rfqCategory={rfq?.category?.name}
                    />
                    
                    <form onSubmit={handleSubmitQuote} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Unit Price *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={quoteForm.price_per_unit}
                            onChange={(e) => {
                              const unitPrice = e.target.value;
                              setQuoteForm({ 
                                ...quoteForm, 
                                price_per_unit: unitPrice,
                                total_price: unitPrice && rfq.quantity ? (parseFloat(unitPrice) * parseFloat(rfq.quantity)).toFixed(2) : ''
                              });
                            }}
                            required
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Total Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={quoteForm.total_price || (quoteForm.price_per_unit && rfq.quantity ? (parseFloat(quoteForm.price_per_unit) * parseFloat(rfq.quantity)).toFixed(2) : '')}
                            onChange={(e) => setQuoteForm({ ...quoteForm, total_price: e.target.value })}
                            readOnly={!!quoteForm.price_per_unit}
                            placeholder="Auto-calculated"
                          />
                        </div>
                        <div>
                          <Label>Currency *</Label>
                          <select
                            value={quoteForm.currency}
                            onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                            className="w-full px-3 py-2 border border-afrikoni-gold/30 rounded-md"
                            required
                          >
                            <option value="USD">USD</option>
                            <option value="NGN">NGN</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="XOF">XOF</option>
                            <option value="XAF">XAF</option>
                          </select>
                        </div>
                        <div>
                          <Label>Incoterms *</Label>
                          <select
                            value={quoteForm.incoterms}
                            onChange={(e) => setQuoteForm({ ...quoteForm, incoterms: e.target.value })}
                            className="w-full px-3 py-2 border border-afrikoni-gold/30 rounded-md"
                            required
                          >
                            <option value="">Select Incoterms</option>
                            <option value="EXW">EXW - Ex Works</option>
                            <option value="FOB">FOB - Free On Board</option>
                            <option value="CIF">CIF - Cost, Insurance and Freight</option>
                            <option value="CFR">CFR - Cost and Freight</option>
                            <option value="DDP">DDP - Delivered Duty Paid</option>
                            <option value="DAP">DAP - Delivered At Place</option>
                          </select>
                        </div>
                        <div>
                          <Label>Lead Time *</Label>
                          <Input
                            value={quoteForm.lead_time}
                            onChange={(e) => setQuoteForm({ ...quoteForm, lead_time: e.target.value })}
                            placeholder="e.g., 2-3 weeks, 30 days"
                            required
                          />
                        </div>
                        <div>
                          <Label>MOQ (if different from RFQ quantity)</Label>
                          <Input
                            type="number"
                            value={quoteForm.moq}
                            onChange={(e) => setQuoteForm({ ...quoteForm, moq: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Notes (optional, max 500 characters)</Label>
                          <span className="text-xs text-afrikoni-deep/70">
                            {quoteForm.notes?.length || 0}/500
                          </span>
                        </div>
                        <Textarea
                          value={quoteForm.notes}
                          onChange={(e) => {
                            if (e.target.value.length <= 500) {
                              setQuoteForm({ ...quoteForm, notes: e.target.value });
                            }
                          }}
                          rows={3}
                          placeholder="Any additional information..."
                          maxLength={500}
                        />
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-afrikoni-cream/30 rounded-lg border border-afrikoni-gold/20">
                        <input
                          type="checkbox"
                          id="quote-confirmation"
                          checked={quoteForm.confirmed}
                          onChange={(e) => setQuoteForm({ ...quoteForm, confirmed: e.target.checked })}
                          className="mt-1 w-4 h-4 text-afrikoni-gold border-afrikoni-gold/30 rounded"
                          required
                        />
                        <Label htmlFor="quote-confirmation" className="text-sm cursor-pointer">
                          I confirm this quote is accurate and executable *
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSubmitting || !quoteForm.confirmed} className="flex-1">
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
                ) : quoteViewMode === 'compare' && isOwner ? (
                  // Comparison View (Buyer only)
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-afrikoni-gold/30">
                          <th className="text-left p-3 font-semibold text-afrikoni-chestnut">Supplier</th>
                          <th className="text-right p-3 font-semibold text-afrikoni-chestnut">Total Price</th>
                          <th className="text-right p-3 font-semibold text-afrikoni-chestnut">Price/Unit</th>
                          <th className="text-center p-3 font-semibold text-afrikoni-chestnut">Delivery Time</th>
                          <th className="text-center p-3 font-semibold text-afrikoni-chestnut">Payment Terms</th>
                          <th className="text-center p-3 font-semibold text-afrikoni-chestnut">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(quotes) && quotes
                          .sort((a, b) => parseFloat(a.total_price) - parseFloat(b.total_price))
                          .map((quote) => (
                            <tr key={quote.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-cream/20">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-afrikoni-chestnut">
                                    {quote.companies?.company_name || 'Supplier'}
                                  </p>
                                  <p className="text-xs text-afrikoni-deep/70">
                                    {quote.companies?.country || ''}
                                  </p>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <p className="font-bold text-afrikoni-chestnut">
                                  {quote.currency} {parseFloat(quote.total_price).toLocaleString()}
                                </p>
                              </td>
                              <td className="p-3 text-right">
                                <p className="text-sm text-afrikoni-deep">
                                  {quote.currency} {parseFloat(quote.price_per_unit).toLocaleString()}
                                </p>
                              </td>
                              <td className="p-3 text-center">
                                <p className="text-sm text-afrikoni-deep">
                                  {quote.delivery_time || 'N/A'}
                                </p>
                              </td>
                              <td className="p-3 text-center">
                                <p className="text-sm text-afrikoni-deep">
                                  {quote.payment_terms || 'N/A'}
                                </p>
                              </td>
                              <td className="p-3 text-center">
                                {rfq.status === 'matched' || rfq.status === 'open' ? (
                                  <Button
                                    onClick={() => handleAwardRFQ(quote.id)}
                                    size="sm"
                                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                                  >
                                    <Award className="w-4 h-4 mr-1" />
                                    Award
                                  </Button>
                                ) : (
                                  <Badge variant={quote.status === 'accepted' ? 'success' : 'outline'}>
                                    {quote.status}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // List View (Default)
                  <div className="space-y-4">
                    {Array.isArray(quotes) && quotes.map((quote) => (
                      <div key={quote.id} className="p-4 border border-afrikoni-gold/20 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-afrikoni-chestnut">
                                {quote.companies?.company_name || 'Supplier'}
                              </h4>
                              {quote.status === 'accepted' && (
                                <Badge variant="success">Accepted</Badge>
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
                              variant="primary"
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
            {/* Buyer Info - Only shown to buyer or admin */}
            {buyerCompany && (isOwner || currentRole === 'admin') && (
              <Card>
                <CardHeader>
                  <CardTitle>Buyer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-afrikoni-chestnut">{buyerCompany.company_name}</h4>
                  <p className="text-sm text-afrikoni-deep/70 mt-1">{buyerCompany.country}</p>
                  {buyerCompany.verified && (
                    <Badge variant="verified" className="mt-2">Verified</Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Privacy Note for Suppliers */}
            {isSupplier && !buyerCompany && (
              <Card className="border-afrikoni-gold/30 bg-afrikoni-cream/30">
                <CardHeader>
                  <CardTitle className="text-sm">Privacy Notice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-afrikoni-deep/70">
                    Buyer identity is protected. You'll see buyer contact information only after they accept your offer.
                  </p>
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
                {isOwner && (
                  <div className="space-y-2 pt-3 border-t border-afrikoni-gold/20 mt-3">
                    {rfq.status === 'open' && (
                      <Button 
                        onClick={handleCloseRFQ}
                        disabled={isSubmitting}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Close RFQ
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Edit RFQ
                    </Button>
                    <Button
                      onClick={handleDeleteRFQ}
                      disabled={isSubmitting}
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete RFQ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


