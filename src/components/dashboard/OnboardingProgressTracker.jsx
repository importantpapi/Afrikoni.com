/**
 * Onboarding Progress Tracker
 * Shows supplier onboarding steps with progress percentage
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Shield, Building2, Package, MessageSquare, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';

export default function OnboardingProgressTracker({ companyId, userId }) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({
    companyProfile: false,
    verification: false,
    firstProduct: false,
    firstInteraction: false
  });
  const [progressPercent, setProgressPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [companyId, userId]);

  const loadProgress = async () => {
    try {
      if (!companyId || !userId) {
        setIsLoading(false);
        return;
      }

      // Check company profile completion
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('company_name, country, city, phone, email, website')
        .eq('id', companyId)
        .maybeSingle(); // Use maybeSingle() to handle no rows gracefully

      const companyProfileComplete = company && 
        company.company_name && 
        company.country && 
        (company.phone || company.email);

      // Check verification status
      let verificationComplete = false;
      try {
        const { data: verification, error: verificationError } = await supabase
          .from('kyc_verifications')
          .select('status')
          .eq('company_id', companyId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows

        verificationComplete = !verificationError && verification && (verification.status === 'approved' || verification.status === 'verified');
      } catch (error) {
        // Table might not exist yet - default to false
        console.warn('KYC verifications table may not exist:', error);
        verificationComplete = false;
      }

      // Check if has products
      let hasProducts = false;
      try {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);
        hasProducts = products && products.length > 0;
      } catch (error) {
        console.warn('Error checking products:', error);
        hasProducts = false;
      }

      // Check if has interactions (RFQ or message)
      let hasInteractions = false;
      try {
        const { data: rfqs } = await supabase
          .from('rfqs')
          .select('id')
          .eq('company_id', companyId)
          .limit(1);

        const { data: messages } = await supabase
          .from('messages')
          .select('id')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .limit(1);

        hasInteractions = (rfqs && rfqs.length > 0) || (messages && messages.length > 0);
      } catch (error) {
        console.warn('Error checking interactions:', error);
        hasInteractions = false;
      }

      const newProgress = {
        companyProfile: companyProfileComplete,
        verification: verificationComplete,
        firstProduct: hasProducts,
        firstInteraction: hasInteractions
      };

      setProgress(newProgress);

      // Calculate percentage
      const completed = Object.values(newProgress).filter(Boolean).length;
      setProgressPercent((completed / 4) * 100);
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      id: 'companyProfile',
      label: 'Complete Company Profile',
      icon: Building2,
      path: '/dashboard/company-info',
      completed: progress.companyProfile
    },
    {
      id: 'verification',
      label: 'Verify Supplier (KYC)',
      icon: Shield,
      path: '/dashboard/kyc',
      completed: progress.verification
    },
    {
      id: 'firstProduct',
      label: 'Add First Product',
      icon: Package,
      path: '/dashboard/products/new',
      completed: progress.firstProduct
    },
    {
      id: 'firstInteraction',
      label: 'Respond to RFQ or Message',
      icon: MessageSquare,
      path: '/dashboard/rfqs',
      completed: progress.firstInteraction
    }
  ];

  if (isLoading) {
    return (
      <Card className="border-afrikoni-gold/20 mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-afrikoni-gold/20 rounded w-3/4"></div>
            <div className="h-2 bg-afrikoni-gold/10 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-afrikoni-gold/10 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Hide if all steps completed
  if (progressPercent === 100) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-afrikoni-chestnut/5 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-afrikoni-chestnut mb-1">
                Onboarding Progress
              </h3>
              <p className="text-sm text-afrikoni-deep/70">
                Complete these steps to unlock Verified Supplier Badge & search boost
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-afrikoni-gold">
                {Math.round(progressPercent)}%
              </div>
              <div className="text-xs text-afrikoni-deep/60">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-afrikoni-gold/10 rounded-full h-2 mb-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-afrikoni-gold to-afrikoni-goldDark rounded-full"
            />
          </div>

          {/* Steps Checklist */}
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = step.completed;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-white border border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-md'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isCompleted ? 'text-green-600' : 'text-afrikoni-gold/40'}`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCompleted ? 'text-green-600' : 'text-afrikoni-deep/60'}`} />
                  <span className={`flex-1 text-sm ${isCompleted ? 'text-green-800 line-through' : 'text-afrikoni-deep font-medium'}`}>
                    {step.label}
                  </span>
                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(step.path)}
                      className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 text-xs"
                    >
                      Complete
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {progressPercent === 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 rounded-lg text-center"
            >
              <Sparkles className="w-6 h-6 text-afrikoni-gold mx-auto mb-2" />
              <p className="text-sm font-semibold text-afrikoni-chestnut">
                🎉 Congratulations! You're now a Verified Supplier!
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

