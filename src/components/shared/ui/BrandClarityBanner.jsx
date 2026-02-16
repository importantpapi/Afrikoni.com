/**
 * Brand Clarity Banner
 * 
 * One sentence everywhere:
 * "Afrikoni uses WhatsApp for notifications. All trade happens securely on Afrikoni."
 * 
 * Protects with users, partners, investors, regulators
 */

import React from 'react';
import { Shield, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function BrandClarityBanner({ variant = 'default' }) {
  const message = 'Afrikoni uses WhatsApp for notifications. All trade happens securely on Afrikoni.';

  if (variant === 'compact') {
    return (
      <div className="bg-os-accent/5 border border-os-accent/20 rounded-lg px-3 py-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-os-accent flex-shrink-0" />
        <p className="text-os-xs text-afrikoni-deep/70 leading-relaxed">
          {message}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-os-accent/30 bg-gradient-to-br from-os-accent/5 to-afrikoni-cream/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-os-accent/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-os-accent" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-afrikoni-chestnut mb-1 text-os-sm">
              Secure Trading Platform
            </h3>
            <p className="text-os-sm text-afrikoni-deep/70 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

