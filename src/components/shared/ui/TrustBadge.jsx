import React from 'react';
import { Shield, Lock, CheckCircle, Award, Info } from 'lucide-react';
import { Badge } from './badge';
import { Tooltip } from './tooltip';

const badgeConfig = {
  'buyer-protection': {
    icon: Shield,
    label: 'Buyer Protection',
    description: 'Your funds are held in escrow until you confirm delivery. Full refund if product doesn\'t match description.',
    color: 'bg-green-100 text-green-700 border-green-300',
    iconColor: 'text-green-600'
  },
  'escrow-payment': {
    icon: Lock,
    label: 'Safe Escrow Payments',
    description: 'All payments are processed through our secure escrow system. Funds are released only after delivery confirmation.',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    iconColor: 'text-blue-600'
  },
  'verified-supplier': {
    icon: CheckCircle,
    label: 'Verified Supplier',
    description: 'This supplier has been verified with business documents, tax certificates, and identity verification.',
    color: 'bg-os-accent/20 text-afrikoni-chestnut border-os-accent',
    iconColor: 'text-os-accent'
  },
  'trust-score': {
    icon: Award,
    label: 'Afrikoni Trust Score',
    description: 'Trust score based on verification status, transaction history, and customer reviews.',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    iconColor: 'text-purple-600'
  }
};

export default function TrustBadge({ 
  type, 
  score = null, 
  showTooltip = true,
  className = '',
  size = 'default' // 'sm' | 'default' | 'lg'
}) {
  const config = badgeConfig[type];
  
  if (!config) {
    console.warn(`Unknown trust badge type: ${type}`);
    return null;
  }

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-os-xs px-2 py-0.5 gap-1',
    default: 'text-os-sm px-3 py-1 gap-1.5',
    lg: 'text-os-base px-4 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const badgeContent = (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses[size]} ${className} flex items-center border font-medium cursor-help`}
    >
      <Icon className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0`} />
      <span>{config.label}</span>
      {score !== null && type === 'trust-score' && (
        <span className="font-bold ml-1">{score}/100</span>
      )}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  const tooltipContent = (
    <div className="max-w-xs">
      <p className="font-semibold mb-1">{config.label}</p>
      <p className="text-os-xs">{config.description}</p>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      {badgeContent}
    </Tooltip>
  );
}

