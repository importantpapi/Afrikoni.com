/**
 * Mobile Action Zones Component
 * Institutional premium design - calm, neutral cards
 * No colorful gradients or playful blocks
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, PlayCircle, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

// Helper function to trigger haptic feedback
const triggerHapticFeedback = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10); // Short vibration (10ms)
  }
};

export default function MobileActionZones() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [onboardingStep, setOnboardingStep] = useState(null);
  
  // Safely access auth data (may be null for guests)
  const user = auth?.user || null;
  const profile = auth?.profile || null;
  const isNewUser = user && profile && !profile.onboarding_completed;

  useEffect(() => {
    if (isNewUser && profile) {
      // Determine current onboarding step
      if (!profile.company_id) {
        setOnboardingStep(1); // Step 1: Complete Profile
      } else {
        setOnboardingStep(2); // Step 2: Complete Profile (company exists but not fully onboarded)
      }
    }
  }, [isNewUser, profile]);

  const handlePostRFQClick = () => {
    triggerHapticFeedback();
    // ✅ AUTH CHECK: Redirect to login if not authenticated, otherwise to RFQ creation
    if (!user) {
      navigate('/login?redirect=/dashboard/rfqs/new');
    } else {
      navigate('/dashboard/rfqs/new');
    }
  };

  return (
    <section className="block lg:hidden py-8 bg-[#FDFBF7]">
      <div className="max-w-[1440px] mx-auto px-4">
        {/* PRIMARY ACTION - Heavy, institutional, ONE dominant focus */}
        <div onClick={handlePostRFQClick} className="cursor-pointer mb-8">
          <div className="px-5 py-6 bg-gradient-to-b from-[#D4A937] to-[#C29931] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:shadow-[0_1px_4px_rgba(0,0,0,0.12)] active:translate-y-[1px] transition-all touch-manipulation">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-[8px] flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-semibold text-white mb-1 tracking-tight">
                  Post Sourcing Request
                </h3>
                <p className="text-[13px] text-white/85 font-normal">
                  Receive quotes from verified suppliers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary actions - subtle, supporting */}
        <div className="space-y-2">
          {/* Onboarding or How It Works */}
          {isNewUser && onboardingStep ? (
            <Link to="/dashboard/onboarding">
              <div className="px-4 py-3.5 bg-white border border-gray-100 rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-all">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-medium text-gray-900">
                      Complete Profile - Step {onboardingStep}
                    </h3>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                </div>
              </div>
            </Link>
          ) : null}

          {/* Find Suppliers - always show */}
          <Link to="/suppliers">
            <div className="px-4 py-3.5 bg-white border border-gray-100 rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-all">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-medium text-gray-900">
                    Browse Verified Suppliers
                  </h3>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
