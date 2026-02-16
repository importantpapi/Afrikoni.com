import React from 'react';
import { Lock, Shield, CheckCircle, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function TrustSection() {
  return (
    <div className="py-16 bg-afrikoni-offwhite">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
            Powered by <span className="text-os-accent">Afrikoni Shield™</span>
          </h2>
          <p className="text-os-base md:text-os-lg text-afrikoni-deep max-w-3xl mx-auto">
            Enterprise-grade trust and compliance for African B2B trade: verification, anti‑corruption,
            escrow payments, and logistics risk intelligence in one unified layer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-os-accent/30 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-os-accent" />
                <h3 className="font-semibold text-afrikoni-chestnut text-os-sm md:text-os-base">
                  Verified Suppliers &amp; Buyers
                </h3>
              </div>
              <p className="text-os-xs md:text-os-sm text-afrikoni-deep/80">
                KYC / KYB checks, document validation and ongoing monitoring across 54 African countries.
              </p>
            </CardContent>
          </Card>

          <Card className="border-os-accent/30 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-emerald-600" />
                <h3 className="font-semibold text-afrikoni-chestnut text-os-sm md:text-os-base">
                  Anti‑Corruption &amp; Compliance
                </h3>
              </div>
              <p className="text-os-xs md:text-os-sm text-afrikoni-deep/80">
                Zero‑bribe policy, PEP &amp; sanctions screening, immutable audit logs and whistleblower workflows.
              </p>
            </CardContent>
          </Card>

          <Card className="border-os-accent/30 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-6 h-6 text-os-accent" />
                <h3 className="font-semibold text-afrikoni-chestnut text-os-sm md:text-os-base">
                  Escrow‑Protected Payments
                </h3>
              </div>
              <p className="text-os-xs md:text-os-sm text-afrikoni-deep/80">
                Funds held in escrow and released only after confirmed delivery, with PCI‑grade security.
              </p>
            </CardContent>
          </Card>

          <Card className="border-os-accent/30 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <h3 className="font-semibold text-afrikoni-chestnut text-os-sm md:text-os-base">
                  Logistics &amp; Risk Intelligence
                </h3>
              </div>
              <p className="text-os-xs md:text-os-sm text-afrikoni-deep/80">
                Route risk, customs exceptions and incident monitoring – integrated with Afrikoni Crisis &amp; Risk dashboards.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
