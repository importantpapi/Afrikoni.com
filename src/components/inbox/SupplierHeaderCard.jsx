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
import { CheckCircle, MapPin, Clock, Building } from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';

export default function SupplierHeaderCard({ company }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br border-2 flex items-center justify-center">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.company_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Building className="w-5 h-5" />
          )}
        </div>
        {company?.verification_status === 'verified' && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center">
            <CheckCircle className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-os-base truncate">
            {company?.company_name || 'Unknown Company'}
          </h2>
          {company?.verification_status === 'verified' && (
            <Badge className="text-os-xs px-1.5 py-0.5">
              <CheckCircle className="w-3 h-3 mr-0.5" />
              Verified
            </Badge>
          )}
        </div>
        {company?.country && (
          <div className="flex items-center gap-1 text-os-xs">
            <MapPin className="w-3 h-3" />
            <span>{company.country}</span>
          </div>
        )}
      </div>
    </div>
  );
}

