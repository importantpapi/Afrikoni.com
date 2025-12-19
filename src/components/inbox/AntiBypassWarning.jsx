/**
 * Anti-Bypass Warning Component
 * 
 * Shows warning when users try to share contacts or bypass platform
 * Educates, doesn't block
 */

import React, { useState } from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AntiBypassWarning({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <Card className="border-amber-300 bg-amber-50/50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1 text-sm">
              Stay Protected
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed mb-3">
              Deals outside Afrikoni are not protected. Keep all trade communications on Afrikoni for:
            </p>
            <ul className="text-xs text-amber-800 space-y-1 mb-3 list-disc list-inside">
              <li>Payment protection</li>
              <li>Dispute resolution</li>
              <li>Trust score growth</li>
              <li>Legal documentation</li>
            </ul>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-800 font-medium">
                All trade happens securely on Afrikoni
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center text-amber-600 hover:text-amber-800"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

