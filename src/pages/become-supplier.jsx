import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Globe2, Users } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';

export default function BecomeSupplier() {
  return (
    <>
      <SEO
        title="Become a Verified Supplier | Afrikoni B2B Marketplace"
        description="Join Afrikoni as a verified African supplier and access serious buyers across 54 countries with escrow protection, logistics support, and Afrikoni Shield™ compliance."
        url="/become-supplier"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <header className="mb-8 md:mb-10 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-afrikoni-gold uppercase mb-3">
              Supplier Onboarding
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
              Become a Verified Afrikoni Supplier
            </h1>
            <p className="text-afrikoni-deep/80 max-w-3xl mx-auto">
              List your products once and reach serious business buyers across Africa and the world.
              Afrikoni handles verification, buyer trust, and cross-border complexity so you can
              focus on delivering quality.
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl border border-afrikoni-gold/20 p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-6 h-6 text-afrikoni-gold" />
                <h2 className="font-semibold text-afrikoni-chestnut">
                  What you get as a verified supplier
                </h2>
              </div>
              <ul className="list-disc list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
                <li>Verified supplier badge visible on your profile and product listings.</li>
                <li>Access to RFQs from vetted buyers across 54 African and global markets.</li>
                <li>Escrow-protected payments with Afrikoni Trade Shield™.</li>
                <li>Logistics and inspection partners for key export corridors.</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-afrikoni-gold/20 p-6">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-6 h-6 text-afrikoni-gold" />
                <h2 className="font-semibold text-afrikoni-chestnut">
                  What we check before verification
                </h2>
              </div>
              <ul className="list-disc list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
                <li>Basic KYB / business registration documents.</li>
                <li>Identity of key shareholders or directors (where applicable).</li>
                <li>Product catalogue quality and export readiness.</li>
                <li>Sanctions and high-risk screening via Afrikoni Shield™.</li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-6 mb-10">
            <h2 className="font-semibold text-afrikoni-chestnut mb-3">How onboarding works</h2>
            <ol className="list-decimal list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
              <li>Create your Afrikoni account and basic company profile.</li>
              <li>Upload your documents for verification (KYB/KYC).</li>
              <li>List your first products with photos, specs, and minimum order quantities.</li>
              <li>Our team reviews and activates your verified supplier badge.</li>
              <li>Start receiving inquiries and RFQs from verified buyers.</li>
            </ol>
          </section>

          <section className="flex flex-col md:flex-row items-center justify-between gap-6 bg-afrikoni-chestnut rounded-2xl px-6 py-6 md:px-8 md:py-7">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Users className="w-7 h-7 text-afrikoni-gold" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-afrikoni-cream mb-1">
                  Ready to join as a supplier?
                </h3>
                <p className="text-sm text-afrikoni-cream/80">
                  It takes a few minutes to create your account. You can start with a basic profile
                  and complete verification when you&apos;re ready.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button className="w-full bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight rounded-full font-semibold">
                  Start Supplier Signup
                </Button>
              </Link>
              <Link to="/supplier-hub" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full border-afrikoni-gold/60 text-afrikoni-cream hover:bg-afrikoni-gold/10 rounded-full"
                >
                  Learn more in Supplier Hub
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}


