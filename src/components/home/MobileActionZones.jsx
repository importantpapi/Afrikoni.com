/**
 * Mobile Action Zones Component (Bento Architecture)
 * Distinct colored bento-style blocks for "How It Works" and "Post RFQ"
 * Visual anchors in the middle of the scroll
 * 
 * Adaptive: Shows progress tracker for new users, market insights for established users
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, PlayCircle, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
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
    <section className="block lg:hidden py-6 bg-afrikoni-offwhite">
      <div className="max-w-[1440px] mx-auto px-4">
        {/* Side-by-side Bento Blocks */}
        <div className="grid grid-cols-2 gap-3">
          {/* Adaptive Content: Progress Tracker for New Users, Market Insights for Established */}
          {isNewUser && onboardingStep ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/dashboard/onboarding">
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] h-full">
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-blue-900 mb-1">
                          Step {onboardingStep}: Complete Profile
                        </h3>
                        <p className="text-[10px] text-blue-800/80 line-clamp-2">
                          Finish setup to start trading
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/how-it-works">
                <Card className="border border-afrikoni-gold/20 bg-gradient-to-br from-white to-afrikoni-offwhite shadow-sm hover:shadow-md transition-all active:scale-[0.98] h-full">
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PlayCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-afrikoni-chestnut mb-1">
                          How It Works
                        </h3>
                        <p className="text-[10px] text-afrikoni-deep/70 line-clamp-2">
                          Learn the process
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* Post RFQ Bento Block - Primary CTA with Deep Blue/Gold + Haptic Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="col-span-2"
          >
            <div onClick={handlePostRFQClick} className="cursor-pointer">
              <Card className="border-2 border-afrikoni-gold bg-gradient-to-br from-afrikoni-gold via-afrikoni-gold/90 to-afrikoni-goldDark shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="text-base font-bold text-white mb-1">
                        Post RFQ → Get Quotes
                      </h3>
                      <p className="text-xs text-white/90">
                        Connect with verified suppliers instantly
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
