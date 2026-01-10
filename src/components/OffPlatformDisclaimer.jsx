/**
 * Off-Platform Transaction Disclaimer Component
 * Warns users about doing business outside the Afrikoni platform
 */

import React from 'react';
import { AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { motion } from 'framer-motion';

export default function OffPlatformDisclaimer({ variant = 'default', className = '' }) {
  const variants = {
    default: 'border-amber-300 bg-amber-50/50 text-amber-800',
    warning: 'border-red-300 bg-red-50/50 text-red-800',
    info: 'border-blue-300 bg-blue-50/50 text-blue-800',
    compact: 'border-afrikoni-gold/30 bg-afrikoni-gold/5 text-afrikoni-deep'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={`border-2 ${variants[variant] || variants.default}`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-sm md:text-base">
                  Important: Off-Platform Transaction Warning
                </h4>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Protection Policy
                </Badge>
              </div>
              <div className="text-xs md:text-sm space-y-2">
                <p>
                  <strong>Afrikoni's protection and escrow services only apply to transactions completed through our platform.</strong>
                </p>
                <p>
                  If you conduct business outside of Afrikoni (e.g., direct payments, external communication channels, or off-platform agreements), 
                  you do so at your own risk. Afrikoni is <strong>not responsible</strong> for:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Payment disputes or fraud outside our platform</li>
                  <li>Product quality issues not documented through Afrikoni</li>
                  <li>Shipping or delivery problems not tracked in our system</li>
                  <li>Any financial losses from off-platform transactions</li>
                  <li>Disputes that cannot be verified through our platform records</li>
                </ul>
                <p className="pt-2 border-t border-current/20">
                  <strong>To stay protected:</strong> Always use Afrikoni's messaging system, escrow payments, and order management tools. 
                  Report any attempts to move transactions off-platform to our support team immediately.
                </p>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-current/20">
                  <a
                    href="/order-protection"
                    className="text-xs font-semibold hover:underline flex items-center gap-1"
                  >
                    Learn more about our protection policies
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Compact version for inline use
 */
export function OffPlatformDisclaimerCompact({ className = '' }) {
  return (
    <div className={`text-xs text-afrikoni-deep/70 bg-afrikoni-cream/30 border border-afrikoni-gold/20 rounded p-2 ${className}`}>
      <div className="flex items-start gap-2">
        <Shield className="w-3 h-3 flex-shrink-0 mt-0.5 text-afrikoni-deep/60" />
        <div>
          <strong className="text-afrikoni-deep">Platform Protection:</strong> Afrikoni's escrow and protection services apply only to transactions completed through our platform. 
          Use our messaging system and order management tools to ensure full protection.
        </div>
      </div>
    </div>
  );
}

