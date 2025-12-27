/**
 * Verified Supplier Badge Marketplace
 * $99 fast-track verification purchase
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Sparkles, ArrowRight, Crown } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function VerificationMarketplaceInner() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [isProcessing, setIsProcessing] = useState(false);
  const [company, setCompany] = useState(null);
  const [hasExistingPurchase, setHasExistingPurchase] = useState(false);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[VerificationMarketplace] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → exit
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, profile]);

  const loadData = async () => {
    try {
      // Use company_id from profile
      const cid = profile?.company_id || null;
      if (!cid) {
        toast.error('Company not found');
        return;
      }
      
      setCompanyId(cid);
      
      // Load company
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', cid)
        .single();
      
      setCompany(companyData);
      
      // Check for existing purchase
      const { data: purchase } = await supabase
        .from('verification_purchases')
        .select('*')
        .eq('company_id', cid)
        .eq('status', 'completed')
        .maybeSingle();
      
      setHasExistingPurchase(!!purchase);
    } catch (error) {
      console.error('Error loading data:', error);
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
      const { data: existingVerification } = await supabase
        .from('verifications')
        .select('id')
        .eq('company_id', companyId)
        .maybeSingle();

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
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  const isVerified = company?.verified || company?.verification_status === 'verified';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-purple/20 border-2 border-afrikoni-gold rounded-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-afrikoni-gold flex items-center justify-center">
              <Shield className="w-8 h-8 text-afrikoni-chestnut" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
                Become a Verified Supplier Today
              </h1>
              <p className="text-afrikoni-text-dark/80">
                Unlock more buyers and build trust with instant verification
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current Status */}
        {isVerified ? (
          <Card className="border-afrikoni-green/30 bg-afrikoni-green/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-afrikoni-green" />
                <div>
                  <h3 className="text-xl font-bold text-afrikoni-text-dark mb-1">
                    You're Already Verified! ✅
                  </h3>
                  <p className="text-afrikoni-text-dark/70">
                    Your company is verified and trusted by buyers on Afrikoni.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Fast-Track Option */}
            <Card className="border-2 border-afrikoni-gold shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Fast-Track Verification</CardTitle>
                  <Crown className="w-6 h-6 text-afrikoni-gold" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-afrikoni-gold">$99</span>
                  <span className="text-afrikoni-text-dark/70">one-time</span>
                </div>
                {hasExistingPurchase && (
                  <Badge className="bg-afrikoni-green text-white mt-2">
                    Purchase Completed - Verification Pending
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-afrikoni-text-dark">Priority Review</p>
                      <p className="text-sm text-afrikoni-text-dark/70">
                        Your verification will be reviewed within 24-48 hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-afrikoni-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-afrikoni-text-dark">Instant Boost</p>
                      <p className="text-sm text-afrikoni-text-dark/70">
                        Get featured in search results immediately after verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-afrikoni-purple flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-afrikoni-text-dark">Trust Badge</p>
                      <p className="text-sm text-afrikoni-text-dark/70">
                        Display verified badge on your profile and products
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing || hasExistingPurchase}
                  className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
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
            <Card className="border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle>Standard Verification</CardTitle>
                <p className="text-2xl font-bold text-afrikoni-text-dark">Free</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-afrikoni-text-dark/60 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-afrikoni-text-dark">Standard Review</p>
                      <p className="text-sm text-afrikoni-text-dark/70">
                        Verification reviewed within 5-7 business days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-afrikoni-text-dark/60 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-afrikoni-text-dark">Same Benefits</p>
                      <p className="text-sm text-afrikoni-text-dark/70">
                        All verification benefits, just takes longer
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-afrikoni-gold/30 text-afrikoni-gold hover:bg-afrikoni-gold/10"
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
          <Card className="border-afrikoni-gold/20">
            <CardHeader>
              <CardTitle>Why Get Verified?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  <h4 className="font-semibold text-afrikoni-text-dark mb-2">Higher Visibility</h4>
                  <p className="text-sm text-afrikoni-text-dark/70">
                    Verified suppliers appear first in search results and get more buyer inquiries
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-afrikoni-purple/20 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                  <h4 className="font-semibold text-afrikoni-text-dark mb-2">Build Trust</h4>
                  <p className="text-sm text-afrikoni-text-dark/70">
                    The verified badge shows buyers you're a legitimate, trusted supplier
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-afrikoni-green/20 flex items-center justify-center mb-3">
                    <Crown className="w-6 h-6 text-afrikoni-green" />
                  </div>
                  <h4 className="font-semibold text-afrikoni-text-dark mb-2">More Deals</h4>
                  <p className="text-sm text-afrikoni-text-dark/70">
                    Verified suppliers close 3x more deals than unverified suppliers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function VerificationMarketplace() {
  return (
    <RequireDashboardRole allow={['seller', 'hybrid']}>
      <VerificationMarketplaceInner />
    </RequireDashboardRole>
  );
}

