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
      <div className="bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg px-3 py-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-afrikoni-gold flex-shrink-0" />
        <p className="text-xs text-afrikoni-deep/70 leading-relaxed">
          {message}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-afrikoni-cream/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-afrikoni-gold" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-afrikoni-chestnut mb-1 text-sm">
              Secure Trading Platform
            </h3>
            <p className="text-sm text-afrikoni-deep/70 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

