import React from 'react';
import DashboardHome from '../DashboardHome';

// Seller-specific dashboard home.
// Thin wrapper around existing shared DashboardHome while we migrate logic.
export default function SellerHome() {
  return <DashboardHome currentRole="seller" />;
}


