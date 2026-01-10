/**
 * Supplier Header Card
 * 
 * Compact supplier info in conversation header
 * - Company name
 * - Verification badge
 * - Country
 * - Response time (if available)
 */

import React from 'react';
import { CheckCircle, MapPin, Clock, Building2 } from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';

export default function SupplierHeaderCard({ company }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-chestnut/20 border-2 border-afrikoni-gold/30 flex items-center justify-center">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.company_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Building2 className="w-5 h-5 text-afrikoni-gold" />
          )}
        </div>
        {company?.verification_status === 'verified' && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-afrikoni-chestnut text-base truncate">
            {company?.company_name || 'Unknown Company'}
          </h2>
          {company?.verification_status === 'verified' && (
            <Badge className="bg-green-50 text-green-700 border-green-300 text-[10px] px-1.5 py-0.5">
              <CheckCircle className="w-3 h-3 mr-0.5" />
              Verified
            </Badge>
          )}
        </div>
        {company?.country && (
          <div className="flex items-center gap-1 text-xs text-afrikoni-deep/60">
            <MapPin className="w-3 h-3" />
            <span>{company.country}</span>
          </div>
        )}
      </div>
    </div>
  );
}

