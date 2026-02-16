import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Award, Users, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageTimeline, SystemPageCTA } from '@/components/system/SystemPageLayout';

export default function TradeShield() {
  const howItWorksSteps = [
    {
      number: 1,
      title: 'Agree & Submit',
      description: 'Buyer and supplier agree on price, quantity, and delivery terms. Order is submitted through Afrikoni platform.',
      icon: FileText
    },
    {
      number: 2,
      title: 'Secure Payment',
      description: 'Buyer pays through Afrikoni. Funds are held safely in escrow, not sent directly to any bank account.',
      icon: Lock
    },
    {
      number: 3,
      title: 'Production & Shipping',
      description: 'Goods are produced and shipped. Optional inspections and documents are uploaded inside Afrikoni for verification.',
      icon: Shield
    },
    {
      number: 4,
      title: 'Confirmation & Release',
      description: 'Buyer confirms that goods match the agreement. Only then is payment released to the supplier.',
      icon: CheckCircle
    },
    {
      number: 5,
      title: 'Dispute Resolution',
      description: 'If there is a disagreement, Afrikoni reviews documents and messages and proposes a fair outcome.',
      icon: AlertCircle
    }
  ];

  const buyerProtections = [
    {
      icon: Lock,
      title: 'Escrow Protection',
      description: 'Your payment is held securely until you confirm receipt of goods. No advance payments to unknown suppliers.'
    },
    {
      icon: Shield,
      title: 'Supplier Verification',
      description: 'All suppliers undergo rigorous KYC/KYB checks. Document verification and identity confirmation before funds are released.'
    },
    {
      icon: Award,
      title: 'Quality Guarantee',
      description: 'Structured dispute and refund process if goods don\'t match the agreement. Money-back guarantee for non-conforming orders.'
    }
  ];

  const supplierProtections = [
    {
      icon: Users,
      title: 'Verified Buyers',
      description: 'Only serious, verified buyers with proof of funds can place orders. Reduced risk of non-payment and fraud.'
    },
    {
      icon: FileText,
      title: 'Clear Terms',
      description: 'Clear delivery conditions and acceptance criteria are established before shipment. Transparent dispute timelines and mediation.'
    },
    {
      icon: CheckCircle,
      title: 'Payment Security',
      description: 'Funds are secured in escrow. Payment is released automatically upon buyer confirmation, with Afrikoni mediation if needed.'
    }
  ];

  return (
    <>
      <SEO
        title="Afrikoni Trade Shield™ | Secure B2B Order Protection"
        description="Protect every cross-border B2B order with Afrikoni Trade Shield™. Escrow, inspections, dispute resolution, and compliance monitoring for African trade."
        url="/protection"
      />
      
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <SystemPageHero
          eyebrow="Afrikoni Trade Shield"
          eyebrowIcon={Shield}
          title="Trade with Confidence Across Africa"
          subtitle="Enterprise-grade protection for serious B2B buyers and suppliers: secure payments, verified counterparties, inspections, and a clear dispute path for every order."
          primaryCTA={{ label: 'Start Trading Safely', to: '/signup' }}
          secondaryCTA={{ label: 'Find Verified Suppliers', to: '/suppliers' }}
        />

        {/* What Trade Shield Guarantees */}
        <SystemPageSection
          title="What Trade Shield Guarantees"
          subtitle="Afrikoni does two things at the same time: it keeps your money safe in escrow until you receive what was agreed, and it gives both sides a clear, written process if something goes wrong."
        >
          <div className="bg-afrikoni-cream rounded-os-sm border-2 border-os-accent/40 p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-os-accent/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-os-accent" />
              </div>
              <div>
                <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-3">
                  No Legal English, No Confusion
                </h3>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  Trade Shield provides clear, written protection for every transaction. Both buyers and suppliers know exactly what to expect, when payments are released, and how disputes are resolved. No hidden terms, no surprises.
                </p>
              </div>
            </div>
          </div>
        </SystemPageSection>

        {/* Buyer & Supplier Protections */}
        <SystemPageSection
          title="Protection for Both Sides"
          subtitle="Comprehensive safeguards designed to protect buyers and suppliers equally"
        >
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-h3 font-semibold leading-[1.3] text-os-accent mb-6 text-center">
                Buyer Protections
              </h3>
              <div className="space-y-4">
                {buyerProtections.map((protection, idx) => {
                  const Icon = protection.icon;
                  return (
                    <SystemPageCard
                      key={idx}
                      icon={Icon}
                      title={protection.title}
                    >
                      {protection.description}
                    </SystemPageCard>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-h3 font-semibold leading-[1.3] text-os-accent mb-6 text-center">
                Supplier Protections
              </h3>
              <div className="space-y-4">
                {supplierProtections.map((protection, idx) => {
                  const Icon = protection.icon;
                  return (
                    <SystemPageCard
                      key={idx}
                      icon={Icon}
                      title={protection.title}
                    >
                      {protection.description}
                    </SystemPageCard>
                  );
                })}
              </div>
            </div>
          </div>
        </SystemPageSection>

        {/* How Trade Shield Works */}
        <SystemPageSection
          title="How Trade Shield Works"
          subtitle="Whether you're buying shea butter from Ghana or machinery from South Africa, the same simple flow protects every order"
        >
          <SystemPageTimeline steps={howItWorksSteps} />
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="Ready to Trade with Protection?"
          description="Join thousands of buyers and suppliers trading safely across Africa with Afrikoni Trade Shield"
          ctaLabel="Start Trading Safely"
          ctaTo="/signup"
          note="Important: Trade Shield protection works only when payments and communication stay inside Afrikoni platform."
        />
      </div>
    </>
  );
}
