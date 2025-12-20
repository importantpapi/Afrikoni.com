import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Package, MapPin, Clock, Award, Search, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageTimeline, SystemPageCTA } from '@/components/system/SystemPageLayout';

export default function InspectionServices() {
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView('Inspection Services');
  }, []);

  const services = [
    {
      icon: Search,
      title: 'Pre-Shipment Inspection',
      description: 'Comprehensive visual inspection, sampling, and conformity checks before goods are loaded for export. Verify quantity, quality, and packaging standards.',
      features: ['Visual inspection', 'Sampling', 'Conformity checks', 'Documentation review']
    },
    {
      icon: Package,
      title: 'Loading Supervision',
      description: 'Independent confirmation of container loading, sealing, and documentation capture for complete audit trails and compliance verification.',
      features: ['Container loading verification', 'Sealing confirmation', 'Documentation capture', 'Audit trail creation']
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'Detailed quality checks against specifications, standards, and buyer requirements to ensure goods meet agreed-upon standards.',
      features: ['Specification verification', 'Standard compliance', 'Quality testing', 'Defect identification']
    },
    {
      icon: FileText,
      title: 'Documentation & Reporting',
      description: 'Comprehensive inspection reports with photos, videos, and detailed documentation for buyer confidence and dispute prevention.',
      features: ['Photo documentation', 'Video evidence', 'Detailed reports', 'Compliance certificates']
    }
  ];

  const coverageAreas = [
    { region: 'West Africa', countries: ['Nigeria', 'Ghana', 'Côte d\'Ivoire', 'Senegal'], products: ['Cocoa', 'Coffee', 'Cashew', 'Textiles'] },
    { region: 'East Africa', countries: ['Kenya', 'Tanzania', 'Ethiopia', 'Uganda'], products: ['Coffee', 'Tea', 'Flowers', 'Manufactured goods'] },
    { region: 'Southern Africa', countries: ['South Africa', 'Zambia', 'Zimbabwe'], products: ['Minerals', 'Fruits', 'Manufactured goods'] },
    { region: 'North Africa', countries: ['Morocco', 'Egypt', 'Tunisia'], products: ['Textiles', 'Phosphates', 'Manufactured goods'] }
  ];

  const whenToUse = [
    {
      icon: Shield,
      title: 'High-Value Orders',
      description: 'Essential for orders exceeding $10,000 to verify quality and quantity before shipment.'
    },
    {
      icon: Package,
      title: 'New Suppliers',
      description: 'Recommended when working with new suppliers to build trust and verify capabilities.'
    },
    {
      icon: Award,
      title: 'Quality-Critical Goods',
      description: 'Ideal for products requiring specific standards, certifications, or quality specifications.'
    }
  ];

  const howItWorksSteps = [
    {
      number: 1,
      title: 'Request Inspection',
      description: 'Buyer or supplier requests inspection through Afrikoni platform. Specify inspection type and requirements.',
      icon: FileText
    },
    {
      number: 2,
      title: 'Inspector Assigned',
      description: 'Afrikoni assigns a verified inspection partner in the region. Inspector contacts you to schedule visit.',
      icon: Shield
    },
    {
      number: 3,
      title: 'On-Site Inspection',
      description: 'Inspector visits location, conducts checks, and documents findings with photos and detailed notes.',
      icon: Search
    },
    {
      number: 4,
      title: 'Report & Documentation',
      description: 'Comprehensive report with photos and evidence uploaded to platform. Buyer reviews and makes informed decision.',
      icon: FileText
    }
  ];

  return (
    <>
      <SEO
        title="Inspection Services | Afrikoni B2B Marketplace"
        description="Independent pre-shipment inspections, quality checks, and loading supervision for African exports. Reduce risk before goods leave the port."
        url="/inspection"
      />
      
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <SystemPageHero
          eyebrow="Quality Assurance"
          eyebrowIcon={Shield}
          title="Inspection Services"
          subtitle="Work with vetted inspection partners across key African ports and production hubs to confirm quantity, quality, and packaging before shipment. Reduce risk and build buyer confidence."
          primaryCTA={{ label: 'Request Inspection', to: '/contact' }}
          secondaryCTA={{ label: 'Find Verified Suppliers', to: '/suppliers' }}
        />

        {/* Our Inspection Services */}
        <SystemPageSection
          title="Our Inspection Services"
          subtitle="Comprehensive quality assurance services to protect your transactions"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <SystemPageCard
                  key={idx}
                  icon={Icon}
                  title={service.title}
                >
                  <p className="mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                        <span className="text-meta font-medium text-afrikoni-chestnut/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </SystemPageCard>
              );
            })}
          </div>
        </SystemPageSection>

        {/* When to Use Inspection */}
        <SystemPageSection
          title="When to Use Inspection"
          subtitle="Strategic use of inspection services to maximize protection and minimize risk"
        >
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {whenToUse.map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <SystemPageCard
                  key={idx}
                  icon={Icon}
                  title={useCase.title}
                >
                  {useCase.description}
                </SystemPageCard>
              );
            })}
          </div>
        </SystemPageSection>

        {/* Coverage Areas */}
        <SystemPageSection
          title="Where We Operate"
          subtitle="Initial coverage focuses on high-volume export corridors with expansion to additional markets over time"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {coverageAreas.map((area, idx) => (
              <SystemPageCard
                key={idx}
                icon={MapPin}
                title={area.region}
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-meta font-medium text-afrikoni-chestnut/70 mb-2">Countries:</p>
                    <div className="flex flex-wrap gap-2">
                      {area.countries.map((country, cIdx) => (
                        <Badge key={cIdx} variant="outline" className="text-xs border-afrikoni-gold/30">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-meta font-medium text-afrikoni-chestnut/70 mb-1">Products:</p>
                    <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80 text-sm">
                      {area.products.join(', ')}
                    </p>
                  </div>
                </div>
              </SystemPageCard>
            ))}
          </div>
        </SystemPageSection>

        {/* How Inspection Works */}
        <SystemPageSection
          title="How Inspection Works"
          subtitle="A simple 4-step process to protect your transactions"
        >
          <SystemPageTimeline steps={howItWorksSteps} />
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="Ready to Protect Your Transactions?"
          description="Request an inspection for your next order and trade with complete confidence"
          ctaLabel="Request Inspection"
          ctaTo="/contact"
        />
      </div>
    </>
  );
}
