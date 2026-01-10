/**
 * Reliability Badge Component
 * Shows supplier reliability score with visual indicator
 */

import React from 'react';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shared/ui/tooltip';

export default function ReliabilityBadge({ 
  reliabilityScore, 
  size = 'default',
  showTooltip = true 
}) {
  if (reliabilityScore === null || reliabilityScore === undefined) {
    return null;
  }

  const score = Math.round(reliabilityScore);
  
  // Determine badge style based on score
  const getBadgeStyle = () => {
    if (score >= 80) {
      return {
        className: 'bg-green-100 text-green-700 border-green-300',
        icon: Shield,
        label: 'High Reliability'
      };
    } else if (score >= 60) {
      return {
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: TrendingUp,
        label: 'Good Reliability'
      };
    } else {
      return {
        className: 'bg-orange-100 text-orange-700 border-orange-300',
        icon: AlertTriangle,
        label: 'Needs Improvement'
      };
    }
  };

  const { className, icon: Icon, label } = getBadgeStyle();
  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';

  const badge = (
    <Badge className={`${className} ${textSize} flex items-center gap-1`}>
      <Icon className={iconSize} />
      <span>{score}</span>
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-semibold mb-1">{label}</div>
              <div>Reliability Score: {score}/100</div>
              <div className="text-xs text-gray-500 mt-1">
                Based on trust, completion rate, response time, and disputes
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

