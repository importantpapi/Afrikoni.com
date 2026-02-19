/**
 * Verified Supplier Badge Marketplace
 * $99 fast-track verification purchase
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Sparkles, ArrowRight, Crown } from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Surface } from '@/components/system/Surface';
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
    try {
      if (!profileCompanyId) return;
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
    if (!profileCompanyId) {
      toast.error('Company profile not initialized');
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
        {/* Header Banner */}
        <Surface variant="panel" className="bg-gradient-to-r from-os-accent/10 to-transparent border-os-accent/20 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-os-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-center gap-6 relative">
            <div className="w-20 h-20 rounded-os-md bg-gradient-to-br from-os-accent to-amber-600 flex items-center justify-center shadow-os-md shadow-os-accent/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[var(--os-text-primary)]">
                Become a Verified Supplier Today
              </h1>
              <p className="text-os-lg text-os-muted">
                Unlock more buyers and build trust with instant verification
              </p>
            </div>
          </div>
        </Surface>

        {/* Current Status */}
        {isVerified ? (
          <Surface variant="panel" className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-os-xl font-bold mb-1 text-[var(--os-text-primary)]">
                  You're Already Verified! ✅
                </h3>
                <p className="text-os-muted">
                  Your company is verified and trusted by buyers on Afrikoni.
                </p>
              </div>
            </div>
          </Surface>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Fast-Track Option */}
            <Surface variant="panel" className="border-os-accent/40 shadow-gold relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-20 bg-os-accent/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <div className="p-6 border-b border-os-accent/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-os-2xl font-bold text-[var(--os-text-primary)]">Fast-Track Verification</h3>
                  <div className="p-2 rounded-lg bg-os-accent/10 text-os-accent">
                    <Crown className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-os-accent">$99</span>
                  <span className="text-os-muted">one-time</span>
                </div>
                {hasExistingPurchase && (
                  <Badge className="mt-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    Purchase Completed - Verification Pending
                  </Badge>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-os-accent/10 text-os-accent mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--os-text-primary)]">Priority Review</p>
                      <p className="text-os-sm text-os-muted">
                        Your verification will be reviewed within 24-48 hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-os-accent/10 text-os-accent mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--os-text-primary)]">Instant Boost</p>
                      <p className="text-os-sm text-os-muted">
                        Get featured in search results immediately after verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-os-accent/10 text-os-accent mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--os-text-primary)]">Trust Badge</p>
                      <p className="text-os-sm text-os-muted">
                        Display verified badge on your profile and products
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing || hasExistingPurchase}
                  className="w-full bg-os-accent hover:bg-[#C5A028] text-black font-bold h-12 shadow-os-md hover:shadow-os-lg transition-all"
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
              </div>
            </Surface>

            {/* Standard Verification */}
            <Surface variant="panel" className="bg-os-surface-0 border-os-stroke">
              <div className="p-6 border-b border-os-stroke">
                <h3 className="text-os-xl font-bold text-[var(--os-text-primary)]">Standard Verification</h3>
                <p className="text-os-2xl font-bold text-os-muted mt-2">Free</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-os-surface-2 text-os-muted mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--os-text-primary)]">Standard Review</p>
                      <p className="text-os-sm text-os-muted">
                        Verification reviewed within 5-7 business days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-os-surface-2 text-os-muted mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--os-text-primary)]">Same Benefits</p>
                      <p className="text-os-sm text-os-muted">
                        All verification benefits, just takes longer
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 border-os-stroke hover:bg-os-surface-1"
                  onClick={() => window.location.href = '/dashboard/verification-center'}
                >
                  Apply for Free Verification
                </Button>
              </div>
            </Surface>
          </div>
        )}

        {/* Benefits Section */}
        {!isVerified && (
          <Surface variant="panel" className="p-8">
            <h3 className="text-os-xl font-bold mb-6 text-center text-[var(--os-text-primary)]">Why Get Verified?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-os-accent/10 text-os-accent mx-auto">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="font-semibold mb-2 text-[var(--os-text-primary)]">Higher Visibility</h4>
                <p className="text-os-sm text-os-muted">
                  Verified suppliers appear first in search results and get more buyer inquiries
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-os-blue/10 text-os-blue mx-auto">
                  <Shield className="w-7 h-7" />
                </div>
                <h4 className="font-semibold mb-2 text-[var(--os-text-primary)]">Build Trust</h4>
                <p className="text-os-sm text-os-muted">
                  The verified badge shows buyers you're a legitimate, trusted supplier
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-purple-500/10 text-purple-500 mx-auto">
                  <Crown className="w-7 h-7" />
                </div>
                <h4 className="font-semibold mb-2 text-[var(--os-text-primary)]">More Deals</h4>
                <p className="text-os-sm text-os-muted">
                  Verified suppliers close 3x more deals than unverified suppliers
                </p>
              </div>
            </div>
          </Surface>
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

