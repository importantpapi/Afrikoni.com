/**
 * Verified Supplier Badge Marketplace
 * $99 fast-track verification purchase
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Sparkles, ArrowRight, Crown } from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import RequireCapability from '@/guards/RequireCapability';

function VerificationMarketplaceInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [company, setCompany] = useState(null);
  const [hasExistingPurchase, setHasExistingPurchase] = useState(false);

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading verification marketplace..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      return;
    }

    loadData();
  }, [canLoadData, userId, profileCompanyId]);

  const loadData = async () => {
    if (!profileCompanyId) {
      toast.error('Company not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      // Load company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileCompanyId)
        .single();
      
      if (companyError) throw companyError;
      
      setCompany(companyData);
      
      // Check for existing purchase
      // ✅ TOTAL VIBRANIUM RESET: Replace .maybeSingle() with .single() wrapped in try/catch
      let purchase = null;
      try {
        const { data, error: purchaseError } = await supabase
          .from('verification_purchases')
          .select('*')
          .eq('company_id', profileCompanyId)
          .eq('status', 'completed')
          .single();
        
        if (purchaseError) {
          // Handle PGRST116 (not found) - purchase doesn't exist yet, this is OK
          if (purchaseError.code !== 'PGRST116') {
            throw purchaseError;
          }
        } else {
          purchase = data;
        }
      } catch (error) {
        // PGRST116 (not found) is expected - purchase may not exist yet
        if (error?.code !== 'PGRST116') {
          throw error;
        }
      }
      
      setHasExistingPurchase(!!purchase);
    } catch (err) {
      console.error('[VerificationMarketplace] Error loading data:', err);
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    if (!confirm('Purchase fast-track verification for $99? This will expedite your verification process.')) {
      return;
    }

    setIsProcessing(true);
    try {
      // In production, this would integrate with payment gateway
      // For now, we'll simulate the purchase
      const paymentData = {
        method: 'stripe',
        paymentId: `mock_verification_${Date.now()}`
      };

      // Create verification purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('verification_purchases')
        .insert({
          company_id: companyId,
          purchase_type: 'fast_track',
          amount: 99.00,
          currency: 'USD',
          status: 'completed',
          payment_method: paymentData.method,
          payment_id: paymentData.paymentId,
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create revenue transaction
      await supabase.from('revenue_transactions').insert({
        transaction_type: 'verification_fee',
        amount: 99.00,
        currency: 'USD',
        company_id: companyId,
        description: 'Fast-track verification purchase',
        status: 'completed',
        processed_at: new Date().toISOString()
      });

      // Update company verification status to pending (fast-track)
      await supabase
        .from('companies')
        .update({
          verification_status: 'pending',
          verified: false // Will be verified after admin review
        })
        .eq('id', companyId);

      // Create or update verification record
      // ✅ TOTAL VIBRANIUM RESET: Replace .maybeSingle() with .single() wrapped in try/catch
      let existingVerification = null;
      try {
        const { data, error: verifError } = await supabase
          .from('verifications')
          .select('id')
          .eq('company_id', companyId)
          .single();
        
        if (verifError) {
          // Handle PGRST116 (not found) - verification doesn't exist yet, this is OK
          if (verifError.code !== 'PGRST116') {
            console.error('[VerificationMarketplace] Error checking existing verification:', verifError);
          }
        } else {
          existingVerification = data;
        }
      } catch (error) {
        // PGRST116 (not found) is expected - verification may not exist yet
        if (error?.code !== 'PGRST116') {
          console.error('[VerificationMarketplace] Error checking existing verification:', error);
        }
      }

      if (!existingVerification) {
        await supabase.from('verifications').insert({
          company_id: companyId,
          status: 'pending',
          trade_assurance_enabled: true
        });
      } else {
        await supabase
          .from('verifications')
          .update({
            status: 'pending',
            trade_assurance_enabled: true
          })
          .eq('company_id', companyId);
      }

      toast.success('Fast-track verification purchased! Your verification will be prioritized.');
      await loadData();
    } catch (err) {
      console.error('[VerificationMarketplace] Error processing purchase:', err);
      toast.error('Failed to process purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={loadData}
      />
    );
  }

  const isVerified = company?.verified || company?.verification_status === 'verified';

  return (
    <>
      <div className="space-y-8">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r border-2 rounded-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                Become a Verified Supplier Today
              </h1>
              <p className="">
                Unlock more buyers and build trust with instant verification
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current Status */}
        {isVerified ? (
          <Card className="">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    You're Already Verified! ✅
                  </h3>
                  <p className="">
                    Your company is verified and trusted by buyers on Afrikoni.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Fast-Track Option */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Fast-Track Verification</CardTitle>
                  <Crown className="w-6 h-6" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="">one-time</span>
                </div>
                {hasExistingPurchase && (
                  <Badge className="mt-2">
                    Purchase Completed - Verification Pending
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Priority Review</p>
                      <p className="text-sm">
                        Your verification will be reviewed within 24-48 hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Instant Boost</p>
                      <p className="text-sm">
                        Get featured in search results immediately after verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Trust Badge</p>
                      <p className="text-sm">
                        Display verified badge on your profile and products
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing || hasExistingPurchase}
                  className="w-full hover:bg-afrikoni-goldDark"
                  size="lg"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : hasExistingPurchase ? (
                    'Purchase Completed'
                  ) : (
                    <>
                      Purchase Fast-Track Verification
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Standard Verification */}
            <Card className="">
              <CardHeader>
                <CardTitle>Standard Verification</CardTitle>
                <p className="text-2xl font-bold">Free</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Standard Review</p>
                      <p className="text-sm">
                        Verification reviewed within 5-7 business days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Same Benefits</p>
                      <p className="text-sm">
                        All verification benefits, just takes longer
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full hover:bg-afrikoni-gold/10"
                  onClick={() => window.location.href = '/verification-center'}
                >
                  Apply for Free Verification
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Benefits Section */}
        {!isVerified && (
          <Card className="">
            <CardHeader>
              <CardTitle>Why Get Verified?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2">Higher Visibility</h4>
                  <p className="text-sm">
                    Verified suppliers appear first in search results and get more buyer inquiries
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2">Build Trust</h4>
                  <p className="text-sm">
                    The verified badge shows buyers you're a legitimate, trusted supplier
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
                    <Crown className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2">More Deals</h4>
                  <p className="text-sm">
                    Verified suppliers close 3x more deals than unverified suppliers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export default function VerificationMarketplace() {
  return (
    <>
      {/* PHASE 5B: Verification marketplace requires sell capability (approved) */}
      <RequireCapability canSell={true} requireApproved={true}>
        <VerificationMarketplaceInner />
      </RequireCapability>
    </>
  );
}

