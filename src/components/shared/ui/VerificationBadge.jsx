import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, Clock, Award } from 'lucide-react';

/**
 * VerificationBadge - Compact inline verification indicator
 *
 * Shows verification status with appropriate icon and color.
 * Designed for product cards, supplier profiles, and list items.
 *
 * Usage:
 *   <VerificationBadge status="VERIFIED" />
 *   <VerificationBadge status="PENDING" size="sm" />
 *   <VerificationBadge status="VERIFIED" showLabel />
 */

const STATUS_CONFIG = {
  VERIFIED: {
    icon: ShieldCheck,
    label: 'Verified',
    color: 'text-afrikoni-green',
    bg: 'bg-afrikoni-green/10',
    border: 'border-afrikoni-green/30',
    dot: 'bg-afrikoni-green',
  },
  PENDING: {
    icon: Clock,
    label: 'Pending',
    color: 'text-os-accent',
    bg: 'bg-os-accent/10',
    border: 'border-os-accent/30',
    dot: 'bg-os-accent',
  },
  REJECTED: {
    icon: ShieldAlert,
    label: 'Unverified',
    color: 'text-afrikoni-red',
    bg: 'bg-afrikoni-red/10',
    border: 'border-afrikoni-red/30',
    dot: 'bg-afrikoni-red',
  },
  unverified: {
    icon: Shield,
    label: 'Not Verified',
    color: 'text-gray-400',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
};

const SIZES = {
  xs: { icon: 'w-3 h-3', text: 'text-os-xs', badge: 'px-1.5 py-0.5 gap-1', dot: 'w-1.5 h-1.5' },
  sm: { icon: 'w-3.5 h-3.5', text: 'text-os-xs', badge: 'px-2 py-0.5 gap-1', dot: 'w-2 h-2' },
  md: { icon: 'w-4 h-4', text: 'text-os-sm', badge: 'px-2.5 py-1 gap-1.5', dot: 'w-2 h-2' },
};

export default function VerificationBadge({
  status = 'unverified',
  size = 'sm',
  showLabel = false,
  variant = 'badge', // 'badge' | 'dot' | 'icon'
  className = '',
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unverified;
  const sizeConfig = SIZES[size] || SIZES.sm;
  const Icon = config.icon;

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`} title={config.label}>
        <span className={`inline-block rounded-full ${sizeConfig.dot} ${config.dot}`} />
        {showLabel && <span className={`${sizeConfig.text} font-medium ${config.color}`}>{config.label}</span>}
      </span>
    );
  }

  if (variant === 'icon') {
    return (
      <span className={`inline-flex ${config.color} ${className}`} title={config.label}>
        <Icon className={sizeConfig.icon} />
      </span>
    );
  }

  // Default: badge variant
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.border} ${config.color} ${sizeConfig.badge} ${sizeConfig.text} ${className}`}
      title={config.label}
    >
      <Icon className={sizeConfig.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

/**
 * TrustScoreBadge - Displays numerical trust score with visual indicator
 */
export function TrustScoreBadge({ score = 0, size = 'sm', className = '' }) {
  const level = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

  const levelConfig = {
    high: { color: 'text-afrikoni-green', bg: 'bg-afrikoni-green/10', border: 'border-afrikoni-green/30', label: 'Excellent' },
    medium: { color: 'text-os-accent', bg: 'bg-os-accent/10', border: 'border-os-accent/30', label: 'Good' },
    low: { color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-200', label: 'New' },
  };

  const config = levelConfig[level];
  const sizeConfig = SIZES[size] || SIZES.sm;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.border} ${config.color} ${sizeConfig.badge} ${sizeConfig.text} ${className}`}
      title={`Trust Score: ${score}/100 - ${config.label}`}
    >
      <Award className={sizeConfig.icon} />
      <span className="font-bold">{score}</span>
    </span>
  );
}
