import React from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import SEO from '@/components/SEO';

export default function KycKybAndAmlForAfricanB2BTrade() {
  return (
    <>
      <SEO
        title="KYC, KYB & AML for African B2B Trade | Afrikoni Insights"
        description="Learn how KYC, KYB and AML controls work in African B2B trade and how Afrikoni Shield™ automates compliance across 54 countries."
        url="/resources/kyc-kyb-and-aml-for-african-b2b-trade"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-12">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <div>
            <p className="text-os-xs uppercase tracking-wide text-os-accent mb-2">
              Afrikoni Insights · Compliance
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              KYC, KYB &amp; AML for African B2B Trade
            </h1>
            <p className="text-os-sm text-afrikoni-deep/70">7 min read · Powered by Afrikoni Shield™</p>
          </div>

          <Card className="border-os-accent/20 bg-white">
            <CardContent className="p-6 prose prose-sm md:prose-base max-w-none">
              <p>
                Compliance is not a nice‑to‑have in African B2B trade — it is the foundation for trust with banks,
                regulators and global partners. Afrikoni Shield™ embeds KYC (Know Your Customer), KYB (Know Your
                Business) and AML (Anti‑Money Laundering) controls into every onboarding and transaction.
              </p>

              <h2>Why KYC &amp; KYB matter</h2>
              <p>
                KYC and KYB checks ensure that the people and companies using the platform are who they say they are,
                and that they are allowed to trade. This includes:
              </p>
              <ul>
                <li>Validating identity documents and corporate documents</li>
                <li>Checking beneficial ownership</li>
                <li>Screening against sanctions and watch lists</li>
              </ul>

              <h2>AML in an African context</h2>
              <p>
                AML controls in Africa must deal with cross‑border payments, correspondent banking restrictions and
                evolving regulations. Afrikoni Shield™ standardises this across 54 countries with:
              </p>
              <ul>
                <li>Sanctions and PEP screening for every new onboarded entity</li>
                <li>Continuous monitoring for suspicious transaction patterns</li>
                <li>Immutable audit logs for regulator‑ready evidence</li>
              </ul>

              <h2>How Afrikoni Shield™ helps</h2>
              <p>Afrikoni Shield™ automates most of the heavy lifting so compliance teams can focus on edge cases:</p>
              <ul>
                <li>Centralised rules for KYC / KYB across all jurisdictions</li>
                <li>Workflow for manual review and escalation</li>
                <li>Integration with payment providers and banks for holistic risk views</li>
              </ul>

              <h2>For compliance and risk teams</h2>
              <p>
                If you are a compliance, legal or risk stakeholder evaluating Afrikoni, our team can provide mappings
                against your internal policies and regulatory frameworks.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


