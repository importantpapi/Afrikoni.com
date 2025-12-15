import React from 'react';
import DashboardHome from '../DashboardHome';

// Buyer-specific dashboard home.
// Thin wrapper around existing shared DashboardHome while we migrate logic.
export default function BuyerHome() {
  return <DashboardHome currentRole="buyer" />;
}


