/**
 * Onboarding Progress Tracker - Trade OS 2026
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
    if (!companyId) {
      setIsLoading(false);
      return;
    }
    loadProgress();
  }, [companyId, userId]);

  const loadProgress = async () => {
    try {
      if (!companyId || !userId) {
        setIsLoading(false);
        return;
      }

      const { data: company } = await supabase
        .from('companies')
        .select('company_name, country, city, phone, email, website')
        .eq('id', companyId)
        .maybeSingle();

      const companyProfileComplete = company &&
        company.company_name &&
        company.country &&
        (company.phone || company.email);

      let verificationComplete = false;
      try {
        const { data: verification, error: verificationError } = await supabase
          .from('kyc_verifications')
          .select('status')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        verificationComplete = !verificationError && verification && (verification.status === 'approved' || verification.status === 'verified');
      } catch (error) {
        console.warn('KYC verifications table may not exist:', error);
        verificationComplete = false;
      }

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

      let hasInteractions = false;
      try {
        const { data: rfqs } = await supabase
          .from('rfqs')
          .select('id')
          .eq('buyer_company_id', companyId)
          .limit(1);

        const { data: messages } = await supabase
          .from('messages')
          .select('id')
          .or(`sender_company_id.eq.${companyId},receiver_company_id.eq.${companyId}`)
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
      const completed = Object.values(newProgress).filter(Boolean).length;
      setProgressPercent((completed / 4) * 100);
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 'companyProfile', label: 'Complete Company Profile', icon: Building2, path: '/dashboard/company-info', completed: progress.companyProfile },
    { id: 'verification', label: 'Verify Supplier (KYC)', icon: Shield, path: '/dashboard/kyc', completed: progress.verification },
    { id: 'firstProduct', label: 'Add First Product', icon: Package, path: '/dashboard/products/new', completed: progress.firstProduct },
    { id: 'firstInteraction', label: 'Respond to RFQ or Message', icon: MessageSquare, path: '/dashboard/rfqs', completed: progress.firstInteraction }
  ];

  if (isLoading) {
    return (
      <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded w-3/4" />
            <div className="h-2 bg-gray-200 dark:bg-[#2A2A2A] rounded" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progressPercent === 100) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-[#D4A937]/20 bg-gradient-to-br from-[#D4A937]/5 to-transparent dark:from-[#D4A937]/5 dark:to-[#141414] rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-[#F5F0E8] mb-0.5">
                Onboarding Progress
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Complete these steps to unlock Verified Supplier Badge
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-[#D4A937]">
                {Math.round(progressPercent)}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-[#2A2A2A] rounded-full h-1.5 mb-5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-[#D4A937] rounded-full"
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = step.completed;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30'
                      : 'bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] hover:border-[#D4A937]/30'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'}`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className={`flex-1 text-[13px] ${isCompleted ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                    {step.label}
                  </span>
                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(step.path)}
                      className="h-7 px-3 text-[11px] font-semibold border-[#D4A937]/30 text-[#D4A937] hover:bg-[#D4A937]/10 dark:border-[#D4A937]/30 dark:text-[#D4A937]"
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
              className="mt-4 p-4 bg-[#D4A937]/10 rounded-lg text-center"
            >
              <Sparkles className="w-5 h-5 text-[#D4A937] mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8]">
                Congratulations! You're now a Verified Supplier!
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
