import React from 'react';
import DashboardHome from '../DashboardHome';

// Hybrid-specific dashboard home.
// Thin wrapper around existing shared DashboardHome while we migrate logic.
export default function HybridHome() {
  return <DashboardHome currentRole="hybrid" />;
}


