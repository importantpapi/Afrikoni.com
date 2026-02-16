import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, FileText, Users, CheckCircle, Eye } from 'lucide-react';
import SEO from '@/components/SEO';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageTimeline, SystemPageCTA } from '@/components/system/SystemPageLayout';

export default function AntiFraud() {
  const whatWeWatchFor = [
    {
      icon: FileText,
      title: 'Identity Verification Failures',
      description: 'Repeated failed KYC / KYB checks and identity inconsistencies that indicate potential fraud or impersonation.'
    },
    {
      icon: AlertTriangle,
      title: 'Unusual Payment Patterns',
      description: 'High-risk routing of funds and unusual payment behavior that deviates from normal trade patterns.'
    },
    {
      icon: Shield,
      title: 'Sanctions & Compliance',
      description: 'Shipping routes and counterparties flagged by international sanctions lists and compliance databases.'
    },
    {
      icon: Users,
      title: 'Abnormal Communication Patterns',
      description: 'Abnormal RFQ and messaging patterns indicating potential scams, phishing, or fraudulent activity.'
    }
  ];

  const howScreeningWorksSteps = [
    {
      number: 1,
      title: 'Signal Detection',
      description: 'Automated systems continuously monitor transactions, communications, and user behavior for risk signals.',
      icon: Eye
    },
    {
      number: 2,
      title: 'Risk Assessment',
      description: 'Suspicious activity is flagged and reviewed by Afrikoni\'s risk team using multiple data sources.',
      icon: AlertTriangle
    },
    {
      number: 3,
      title: 'Investigation & Action',
      description: 'Verified cases trigger appropriate actions: account suspension, transaction blocking, or law enforcement reporting.',
      icon: Shield
    }
  ];

  const yourRole = [
    {
      icon: CheckCircle,
      title: 'Keep Communication Inside Afrikoni',
      description: 'All trade-related communication should happen through Afrikoni\'s platform. This ensures full protection and monitoring.'
    },
    {
      icon: CheckCircle,
      title: 'Use Escrow Payments',
      description: 'Always use Afrikoni\'s escrow system for payments. Direct bank transfers outside the platform are not protected.'
    },
    {
      icon: CheckCircle,
      title: 'Report Suspicious Activity',
      description: 'If you notice anything suspicious, report it immediately through the platform or contact support.'
    }
  ];

  return (
    <>
      <SEO
        title="Anti-Fraud & Risk Monitoring | Afrikoni Shield"
        description="Learn how Afrikoni Shield monitors fraud, sanctions, and high-risk behavior across African B2B trade, protecting both buyers and suppliers."
        url="/anti-fraud"
      />
      
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <SystemPageHero
          eyebrow="Risk Monitoring"
          eyebrowIcon={Shield}
          title="Anti-Fraud & Risk Monitoring"
          subtitle="Afrikoni Shield continuously screens counterparties, transactions, and trade patterns to detect fraud, impersonation, and sanction risks across African B2B trade."
          primaryCTA={{ label: 'Report Suspicious Case', to: '/contact' }}
        />

        {/* What We Watch For */}
        <SystemPageSection
          title="What We Watch For"
          subtitle="Comprehensive monitoring across multiple risk dimensions"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {whatWeWatchFor.map((item, idx) => {
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
        </SystemPageSection>

        {/* How Screening Works */}
        <SystemPageSection
          title="How Screening Works"
          subtitle="A systematic approach to detecting and preventing fraud"
        >
          <SystemPageTimeline steps={howScreeningWorksSteps} />
        </SystemPageSection>

        {/* Your Role */}
        <SystemPageSection
          title="Your Role in Fraud Prevention"
          subtitle="Simple steps to maximize your protection"
        >
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {yourRole.map((item, idx) => {
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
        </SystemPageSection>

        {/* Important Notice */}
        <SystemPageSection>
          <div className="bg-afrikoni-cream rounded-os-sm border-2 border-os-accent/40 p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-os-accent/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-os-accent" />
              </div>
              <div>
                <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-3">
                  Protection Works Best When You Stay Inside Afrikoni
                </h3>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  Anti-fraud monitoring and protection are most effective when all communication and payments stay within the Afrikoni platform. Moving conversations or payments outside the platform reduces our ability to detect and prevent fraud.
                </p>
              </div>
            </div>
          </div>
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="See Something Suspicious?"
          description="Report suspicious activity immediately to help protect the entire Afrikoni community"
          ctaLabel="Report Suspicious Case"
          ctaTo="/contact"
          note="All reports are confidential and reviewed by our security team."
        />
      </div>
    </>
  );
}
