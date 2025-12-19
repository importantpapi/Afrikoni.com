/**
 * Mobile-First RFQ Wizard
 * 
 * 4-step WhatsApp-like flow for creating RFQs in <60 seconds
 * - Step 1: What do you need? (text + optional voice + photo)
 * - Step 2: Quantity & unit + destination country
 * - Step 3: Urgency + budget (optional chips)
 * - Step 4: Trust screen + Send RFQ (sticky CTA)
 * 
 * Features:
 * - Sticky CTA always visible
 * - Draft persistence (localStorage + Supabase)
 * - Smart defaults based on locale
 * - Mobile-first design (44px+ tap targets)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { sanitizeString } from '@/utils/security';
import { format } from 'date-fns';
import MobileStickyCTA from '@/components/ui/MobileStickyCTA';
import RFQStep1Need from '@/components/rfq/RFQStep1Need';
import RFQStep2QuantityDestination from '@/components/rfq/RFQStep2QuantityDestination';
import RFQStep3UrgencyBudget from '@/components/rfq/RFQStep3UrgencyBudget';
import RFQStep4TrustConfirm from '@/components/rfq/RFQStep4TrustConfirm';

const DRAFT_STORAGE_KEY = 'afrikoni_rfq_draft';
const STEPS = ['need', 'quantity', 'urgency', 'confirm'];

export default function RFQMobileWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Form data with smart defaults
  const [formData, setFormData] = useState(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Invalid saved data, use defaults
      }
    }
    
    // Default values with smart defaults
    return {
      title: searchParams.get('product') || '',
      description: '',
      category_id: '',
      quantity: searchParams.get('quantity') || '',
      unit: 'pieces', // Smart default
      target_price: '',
      delivery_location: searchParams.get('country') || '',
      delivery_deadline: null,
      urgency: 'flexible',
      verified_only: true,
      afrikoni_managed: true,
      attachments: [],
      voice_note: null, // Placeholder for future voice input
    };
  });

  useEffect(() => {
    loadInitialData();
    // Auto-save draft on form changes
    return () => {
      saveDraft();
    };
  }, [formData]);

  const loadInitialData = async () => {
    try {
      const [userResult, catsRes] = await Promise.all([
        getCurrentUserAndRole(supabase, supabaseHelpers),
        supabase.from('categories').select('*')
      ]);
      
      const { user: userData } = userResult;
      if (!userData) {
        navigate('/login?redirect=/rfq/create-mobile');
        return;
      }

      setUser(userData);
      setCategories(catsRes.data || []);
      
      // Load draft from Supabase if exists
      await loadDraftFromSupabase(userData.id);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load. Please try again.');
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      // Silently fail - localStorage might be full
    }
  };

  const loadDraftFromSupabase = async (userId) => {
    try {
      const { data } = await supabase
        .from('rfq_drafts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && data.draft_data) {
        setFormData(prev => ({ ...prev, ...data.draft_data }));
      }
    } catch (e) {
      // No draft or error - continue with current formData
    }
  };

  const saveDraftToSupabase = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('rfq_drafts')
        .upsert({
          user_id: user.id,
          draft_data: formData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
    } catch (e) {
      // Silently fail - draft saving is optional
    }
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Validate current step
    const validation = validateStep(currentStep);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Save draft to Supabase on step change
      saveDraftToSupabase();
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Step 1: Need
        if (!formData.title?.trim()) {
          return { valid: false, message: 'Please describe what you need' };
        }
        return { valid: true };
      
      case 1: // Step 2: Quantity & Destination
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
          return { valid: false, message: 'Please enter a valid quantity' };
        }
        if (!formData.delivery_location?.trim()) {
          return { valid: false, message: 'Please select a destination country' };
        }
        return { valid: true };
      
      case 2: // Step 3: Urgency & Budget (optional)
        return { valid: true }; // All fields optional
      
      case 3: // Step 4: Confirm
        return { valid: true };
      
      default:
        return { valid: true };
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      const quantity = parseFloat(formData.quantity) || 0;
      const targetPrice = parseFloat(formData.target_price) || null;
      
      const rfqData = {
        title: sanitizeString(formData.title),
        description: sanitizeString(formData.description || formData.title),
        category_id: formData.category_id || null,
        quantity: quantity,
        unit: sanitizeString(formData.unit || 'pieces'),
        target_price: targetPrice,
        delivery_location: sanitizeString(formData.delivery_location || ''),
        delivery_deadline: formData.delivery_deadline 
          ? format(formData.delivery_deadline, 'yyyy-MM-dd') 
          : null,
        expires_at: formData.delivery_deadline 
          ? format(formData.delivery_deadline, 'yyyy-MM-dd') 
          : null,
        attachments: formData.attachments || [],
        status: 'in_review',
        buyer_company_id: companyId || null,
        verified_only: formData.verified_only ?? true,
        afrikoni_managed: formData.afrikoni_managed ?? true,
      };

      const { data: newRFQ, error } = await supabase
        .from('rfqs')
        .insert(rfqData)
        .select()
        .single();
      
      if (error) throw error;

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      if (user?.id) {
        await supabase
          .from('rfq_drafts')
          .delete()
          .eq('user_id', user.id);
      }

      // Move 1: Auto-create system conversation thread for RFQ
      // This creates a "Waiting for suppliers" thread in inbox
      try {
        // Create a system conversation (buyer_company_id = companyId, seller_company_id = null for system)
        // This will show in inbox as "RFQ: [title]" with system messages
        const { data: systemConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            buyer_company_id: companyId,
            seller_company_id: null, // System conversation
            subject: `RFQ: ${rfqData.title}`,
            last_message: 'Your RFQ is live. Waiting for supplier responses...',
            last_message_at: new Date().toISOString(),
            related_rfq_id: newRFQ.id,
            is_system: true
          })
          .select()
          .single();

        if (!convError && systemConv) {
          // Create system message with expectations
          const systemMessage = `✅ Your RFQ "${rfqData.title}" has been created successfully!

📊 Status: In Review
⏱️ Average response time: 6-24 hours
👥 Verified suppliers only: ${formData.verified_only ? 'Yes' : 'No'}

We're matching your RFQ with verified suppliers. You'll receive notifications when suppliers respond.

💡 Tip: Keep your inbox open to see responses in real-time.`;

          await supabase
            .from('messages')
            .insert({
              conversation_id: systemConv.id,
              sender_company_id: null, // System message
              content: systemMessage,
              message_type: 'system',
              is_system: true
            });

          // Navigate to inbox with the new conversation
          navigate(`/inbox-mobile?conversation=${systemConv.id}&rfq=${newRFQ.id}`);
        } else {
          // Fallback if conversation creation fails
          navigate(`/inbox-mobile?rfq=${newRFQ.id}`);
        }
      } catch (error) {
        console.error('Error creating system conversation:', error);
        // Still navigate to inbox even if system conversation fails
        navigate(`/inbox-mobile?rfq=${newRFQ.id}`);
      }

      toast.success('RFQ created! Check your inbox for responses.');
    } catch (error) {
      console.error('Error creating RFQ:', error);
      toast.error('Failed to create RFQ. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case 0:
        return (
          <RFQStep1Need
            formData={formData}
            updateFormData={updateFormData}
            categories={categories}
          />
        );
      case 1:
        return (
          <RFQStep2QuantityDestination
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <RFQStep3UrgencyBudget
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <RFQStep4TrustConfirm
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  const getStickyCTALabel = () => {
    if (currentStep === STEPS.length - 1) {
      return 'Send RFQ';
    }
    return 'Continue';
  };

  return (
    <div className="min-h-screen bg-afrikoni-offwhite pb-24 md:pb-0">
      {/* Progress Indicator */}
      <div className="sticky top-0 z-30 bg-white border-b border-afrikoni-gold/20 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-afrikoni-gold disabled:text-afrikoni-deep/30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center"
            aria-label="Go back"
          >
            {currentStep > 0 && '← Back'}
          </button>
          <span className="text-sm font-medium text-afrikoni-deep">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= currentStep
                  ? 'bg-afrikoni-gold'
                  : 'bg-afrikoni-gold/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {getStepComponent()}
      </div>

      {/* Sticky CTA */}
      <MobileStickyCTA
        label={getStickyCTALabel()}
        onClick={handleNext}
        disabled={isLoading}
        variant="default"
        className="md:hidden"
      />
    </div>
  );
}

