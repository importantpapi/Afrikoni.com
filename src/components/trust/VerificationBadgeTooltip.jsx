import React from 'react';
import { Shield, CheckCircle2, FileCheck, Building2, Award } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Verification Badge with detailed explainer
 * Makes "verified" mean something specific and builds trust
 */

const VERIFICATION_CRITERIA = [
  {
    icon: Building2,
    label: 'Business Registration',
    description: 'Government-issued business license verified'
  },
  {
    icon: FileCheck,
    label: 'Identity Verification',
    description: 'Company directors and ownership confirmed'
  },
  {
    icon: Shield,
    label: 'Compliance Check',
    description: 'Tax registration and regulatory compliance verified'
  },
  {
    icon: Award,
    label: 'Quality Standards',
    description: 'Product quality and certifications reviewed'
  }
];

export function VerificationBadgeTooltip({ 
  verified = false, 
  verificationStatus = 'unverified',
  companyName = 'This supplier',
  size = 'md',
  showLabel = true 
}) {
  if (!verified && verificationStatus !== 'verified') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium cursor-help">
              <Shield className="w-3.5 h-3.5" />
              {showLabel && <span>Verification in Progress</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs p-0">
            <div className="p-4">
              <p className="text-sm text-gray-700 font-medium mb-2">
                Verification Pending
              </p>
              <p className="text-xs text-gray-600">
                {companyName} is currently undergoing verification. 
                Afrikoni reviews business credentials before granting verified status.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-green-700 text-xs font-medium cursor-help hover:bg-green-100 transition-colors">
            <Shield className="w-3.5 h-3.5 fill-green-600" />
            {showLabel && <span>Verified Supplier</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md p-0">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900 font-semibold mb-1">
                  Afrikoni Verified Supplier
                </p>
                <p className="text-xs text-gray-600">
                  {companyName} has completed Afrikoni's verification process.
                </p>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">What was verified:</p>
              {VERIFICATION_CRITERIA.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 italic">
                Afrikoni manually reviews all suppliers. Verification is not a guarantee but indicates serious business credentials.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact badge for product cards and listings
 */
export function VerificationBadgeCompact({ verified = false, verificationStatus = 'unverified' }) {
  return (
    <VerificationBadgeTooltip 
      verified={verified} 
      verificationStatus={verificationStatus}
      showLabel={false}
      size="sm"
    />
  );
}

