import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/shared/ui/card';
import SEO from '@/components/SEO';
import { Button } from '@/components/shared/ui/button';

export default function HowToSourceVerifiedAfricanSuppliers() {
  return (
    <>
      <SEO
        title="How to Source Verified African Suppliers | Afrikoni Insights"
        description="A step-by-step guide to sourcing from verified African suppliers using Afrikoni Shield™, escrow payments, and RFQs."
        url="/resources/how-to-source-verified-african-suppliers"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-12">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <div>
            <p className="text-os-xs uppercase tracking-wide text-os-accent mb-2">
              Afrikoni Insights · Buyers
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              How to Source Verified African Suppliers
            </h1>
            <p className="text-os-sm text-afrikoni-deep/70">6 min read · Powered by Afrikoni Shield™</p>
          </div>

          <Card className="border-os-accent/20 bg-white">
            <CardContent className="p-6 prose prose-sm md:prose-base max-w-none">
              <p>
                Sourcing from Africa should feel as safe and professional as buying from any global marketplace.
                Afrikoni Shield™ was built to give buyers confidence by combining KYC/KYB checks, anti‑corruption
                monitoring, and escrow‑protected payments.
              </p>

              <h2>1. Start from the marketplace or Buyer Hub</h2>
              <p>
                Begin on the{' '}
                <Link to="/marketplace" className="text-os-accent underline">
                  marketplace
                </Link>{' '}
                or{' '}
                <Link to="/buyer-hub" className="text-os-accent underline">
                  Buyer Hub
                </Link>
                . Use category filters, country filters, and search to narrow down the products and suppliers that match
                your sourcing brief.
              </p>

              <h2>2. Look for verification and trust signals</h2>
              <p>
                Verified suppliers are clearly labelled in Afrikoni with trust badges. These suppliers have passed:
              </p>
              <ul>
                <li>Business registration (KYB) checks</li>
                <li>Identity (KYC) verification for key principals</li>
                <li>Bank account and payment verification</li>
              </ul>

              <h2>3. Use RFQs to get multiple offers</h2>
              <p>
                Instead of messaging one supplier at a time, post a{' '}
                <Link to="/rfq/create" className="text-os-accent underline">
                  Request for Quotation (RFQ)
                </Link>{' '}
                with your volume, specs, and delivery requirements. Verified suppliers can respond with their offers,
                helping you compare price, terms, and lead times side by side.
              </p>

              <h2>4. Protect every order with escrow</h2>
              <p>
                When you place an order, Afrikoni Shield™ holds funds in escrow until delivery is confirmed. This
                reduces the risk of advance‑payment fraud and ensures both buyer and supplier have aligned incentives.
              </p>

              <h2>5. Track risk and logistics in one place</h2>
              <p>
                Behind the scenes, Afrikoni Shield™ monitors shipments, route risks, and compliance alerts. If an issue
                arises, our crisis and risk dashboards surface it early so the team can intervene.
              </p>

              <h2>Next steps</h2>
              <p>
                Create your free buyer account and start sourcing from verified African suppliers in a few minutes.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/signup">
                  <Button className="bg-os-accent text-afrikoni-chestnut hover:bg-os-accentLight">
                    Create Buyer Account
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button variant="outline" className="border-os-accent text-os-accent hover:bg-os-accent/10">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


