import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Clock, Shield, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/shared/ui/button';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageTimeline, SystemPageCTA } from '@/components/system/SystemPageLayout';

export default function Disputes() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      return;
    }

    // Redirect authenticated users to dashboard disputes
    if (user) {
      navigate('/dashboard/disputes', { replace: true });
    }
  }, [authReady, authLoading, user, navigate]);

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading..." />;
  }

  const disputeFlowSteps = [
    {
      number: 1,
      title: 'Open Dispute',
      description: 'Buyer or supplier opens a dispute directly from the protected order page with clear reason and initial evidence.',
      icon: AlertCircle
    },
    {
      number: 2,
      title: 'Upload Evidence',
      description: 'Both sides upload clear evidence: contracts, invoices, photos, videos, and key messages from the order conversation.',
      icon: FileText
    },
    {
      number: 3,
      title: 'Afrikoni Review',
      description: 'Afrikoni\'s team reviews the case and, if needed, asks questions or involves inspection partners for verification.',
      icon: Shield
    },
    {
      number: 4,
      title: 'Resolution Proposed',
      description: 'Afrikoni proposes a resolution (refund, partial refund, re-shipment, or other remedy) based on what was agreed in writing.',
      icon: CheckCircle
    }
  ];

  const requiredEvidence = [
    {
      icon: FileText,
      title: 'Order Documents',
      description: 'Original order confirmation, contract, or agreement showing terms and conditions.'
    },
    {
      icon: MessageSquare,
      title: 'Communication Records',
      description: 'Relevant messages from the order conversation that support your case.'
    },
    {
      icon: Shield,
      title: 'Visual Evidence',
      description: 'Photos or videos showing the issue (damaged goods, wrong items, etc.).'
    }
  ];

  const timelines = [
    {
      icon: Clock,
      title: 'Acknowledgment',
      description: 'Afrikoni acknowledges new disputes within 1 business day.'
    },
    {
      icon: FileText,
      title: 'Initial Review',
      description: 'Initial review and information request usually within 3–5 business days.'
    },
    {
      icon: CheckCircle,
      title: 'Resolution',
      description: 'Most cases are resolved within 7–14 business days, depending on evidence and inspections.'
    }
  ];

  return (
    <>
      <SEO
        title="Dispute Resolution | Afrikoni Trade Shield"
        description="Understand how Afrikoni handles order disputes between buyers and suppliers, with clear timelines, documentation, and mediation."
        url="/disputes"
      />
      
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <SystemPageHero
          eyebrow="Dispute Resolution"
          eyebrowIcon={Shield}
          title="Dispute Resolution"
          subtitle="When something goes wrong, Afrikoni Trade Shield provides a structured path to investigate, document, and resolve disputes between buyers and suppliers."
          primaryCTA={{ label: 'Open a Dispute', to: '/login' }}
        />

        {/* Before You Worry Notice */}
        <SystemPageSection>
          <div className="bg-afrikoni-cream rounded-xl border-2 border-afrikoni-gold/40 p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-afrikoni-gold" />
              </div>
              <div>
                <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-3">
                  Before You Worry
                </h3>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  Most trades finish without any dispute. This page explains what happens in the rare cases where there is a problem, so you know <strong>Afrikoni will stand in the middle</strong> and follow a clear, fair process.
                </p>
              </div>
            </div>
          </div>
        </SystemPageSection>

        {/* Dispute Flow */}
        <SystemPageSection
          title="Typical Dispute Flow"
          subtitle="A clear, structured process for resolving issues"
        >
          <SystemPageTimeline steps={disputeFlowSteps} />
        </SystemPageSection>

        {/* Required Evidence & Timelines */}
        <SystemPageSection
          title="What You Need to Know"
          subtitle="Essential information for successful dispute resolution"
        >
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Required Evidence */}
            <div>
              <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-gold mb-6">
                Required Evidence
              </h3>
              <div className="space-y-4">
                {requiredEvidence.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <SystemPageCard
                      key={idx}
                      icon={Icon}
                      title={item.title}
                    >
                      {item.description}
                    </SystemPageCard>
                  );
                })}
              </div>
            </div>

            {/* Timelines */}
            <div>
              <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-gold mb-6">
                Typical Timelines
              </h3>
              <div className="space-y-4">
                {timelines.map((timeline, idx) => {
                  const Icon = timeline.icon;
                  return (
                    <SystemPageCard
                      key={idx}
                      icon={Icon}
                      title={timeline.title}
                    >
                      {timeline.description}
                    </SystemPageCard>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-afrikoni-cream/50 rounded-lg border border-afrikoni-gold/20">
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/70 text-sm">
                  <strong>Note:</strong> Complex cross-border cases may take longer, but Afrikoni will always communicate clearly inside the order chat about the status and next steps.
                </p>
              </div>
            </div>
          </div>
        </SystemPageSection>

        {/* Important Notice */}
        <SystemPageSection>
          <div className="bg-afrikoni-cream rounded-xl border-2 border-afrikoni-gold/40 p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-afrikoni-gold" />
              </div>
              <div>
                <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-3">
                  Important: Full Protection Requires Staying Inside Afrikoni
                </h3>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  Disputes are only fully covered when payment and communication stay inside Afrikoni Trade Shield™. Moving conversations or payments outside the platform reduces our ability to mediate and resolve disputes effectively.
                </p>
              </div>
            </div>
          </div>
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="Have an Active Dispute?"
          description="If you're already logged in, access your dispute dashboard to manage active cases"
          ctaLabel="Go to Dispute Dashboard"
          ctaTo="/login"
        />
      </div>
    </>
  );
}
