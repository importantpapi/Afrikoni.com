import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getBusinessProfile } from '@/lib/supabase-auth-helpers';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const { user, profile, role, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        if (!user) {
          navigate('/login');
          return;
        }

        // 1) Prefer new enterprise business_profiles table for seller/logistics
        try {
          const { data: businessProfile } = await getBusinessProfile(user.id);
          if (businessProfile && businessProfile.verification_status === 'pending') {
            setStatus({
              source: 'business_profiles',
              verificationStatus: businessProfile.verification_status,
              companyName: businessProfile.company_name,
              registrationNumber: businessProfile.registration_number,
              country: businessProfile.country,
              role: role || profile?.role || 'seller',
            });
            setLoading(false);
            return;
          }

          if (businessProfile && businessProfile.verification_status === 'approved') {
            // Already approved in new workflow
            navigate('/dashboard');
            return;
          }
        } catch (bpError) {
          // Non-fatal: fall back to legacy company verification flow
          console.debug('Business profile check failed, falling back to legacy companies table', bpError);
        }

        // 2) Legacy flow: companies + verifications
        if (role === 'buyer' || !companyId) {
          navigate('/dashboard');
          return;
        }

        const { data: company, error } = await supabase
          .from('companies')
          .select('verification_status, verified, name')
          .eq('id', companyId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const verificationStatus = company?.verification_status || 'unverified';
        const verified = !!company?.verified;

        if (verified || verificationStatus === 'verified') {
          navigate('/dashboard');
          return;
        }

        setStatus({
          source: 'companies',
          verificationStatus,
          companyName: company?.name || profile?.company_name || 'your company',
          role,
        });
      } catch (err) {
        console.error('AccountPending load error:', err);
        toast.error('Unable to load account status. Please try again.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const { companyName, role, registrationNumber, country, source } = status;

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo type="full" size="lg" link={true} showTagline={false} />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg border border-afrikoni-gold/20 space-y-4">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <ShieldCheck className="w-14 h-14 text-afrikoni-gold" />
              <Clock className="w-6 h-6 text-afrikoni-deep absolute -bottom-1 -right-1 bg-white rounded-full border border-afrikoni-gold/40" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-afrikoni-chestnut">Business Account Under Review</h2>
          <p className="text-afrikoni-deep">
            Your {role === 'logistics' ? 'logistics partner' : 'seller'} account for{' '}
            <span className="font-semibold">{companyName}</span> is being reviewed by Afrikoni.
          </p>
          <p className="text-afrikoni-deep/80 text-sm">
            This verification protects buyers, suppliers, and logistics partners across Afrikoni. Most reviews are
            completed within <span className="font-semibold">24–48 hours</span>.
          </p>

          {source === 'business_profiles' && (
            <div className="bg-afrikoni-cream/60 border border-afrikoni-gold/30 rounded-lg p-4 text-left text-sm text-afrikoni-deep/90">
              <p className="font-semibold text-afrikoni-chestnut mb-1">What we’re reviewing:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Company: {companyName}</li>
                {registrationNumber && <li>Registration: {registrationNumber}</li>}
                {country && <li>Country: {country}</li>}
              </ul>
            </div>
          )}

          <div className="space-y-2 text-left text-sm text-afrikoni-deep/90 mt-4">
            <p className="font-semibold text-afrikoni-chestnut">What you can do while we review:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Complete your company profile and upload missing documents.</li>
              <li>Browse the marketplace and RFQs to understand demand.</li>
              <li>Prepare product catalogs and logistics offers.</li>
            </ul>
          </div>
          <div className="pt-4 space-y-3">
            <Button
              className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-bold"
              onClick={() => navigate('/dashboard/verification-status')}
            >
              View verification status
            </Button>
            <Button
              variant="outline"
              className="w-full border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/10"
              onClick={() => navigate('/dashboard')}
            >
              Go to dashboard home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

