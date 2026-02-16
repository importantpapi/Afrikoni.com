import React from 'react';
import { Badge } from '@/components/shared/ui/badge';
import { Sparkles, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shared/ui/tooltip";

/**
 * ✅ PHASE A: Recommended Badge
 * 
 * Shows "Recommended" badge for top-ranked suppliers
 * with tooltip explaining the criteria.
 * 
 * RULES:
 * - NO numeric scores shown
 * - NO tiers (A/B/C) visible to buyers
 * - Only displayed for top suppliers
 */
export default function RecommendedBadge({ type = 'recommended' }) {
  if (type === 'recommended') {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-gradient-to-r from-os-accent/90 to-os-accentLight text-afrikoni-deep border-os-accent shadow-os-md px-3 py-1.5 flex items-center gap-1.5 cursor-help">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-semibold">Recommended</span>
              <Info className="w-3 h-3 opacity-70" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className="max-w-xs bg-afrikoni-deep text-afrikoni-offwhite border-os-accent/30 shadow-os-lg"
          >
            <p className="text-os-sm leading-relaxed">
              Recommended based on verified trade history, relevance, and responsiveness.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
