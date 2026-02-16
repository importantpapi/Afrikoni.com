import React from 'react';
import { getRoleDisplayName, getRoleBadgeColor } from '@/utils/roles';

/**
 * Display a user's role as a colored badge
 * 
 * @param {Object} props
 * @param {string|null} props.role - User role
 * @param {string} props.size - Badge size ('sm', 'md', 'lg')
 */
export const RoleBadge = ({ role, size = 'md' }) => {
  if (!role) return null;

  const displayName = getRoleDisplayName(role);
  const colorClass = getRoleBadgeColor(role);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-os-xs',
    md: 'px-2.5 py-0.5 text-os-xs',
    lg: 'px-3 py-1 text-os-sm',
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium text-white ${colorClass} ${sizeClasses[size]}`}
    >
      {displayName}
    </span>
  );
};

export default RoleBadge;

