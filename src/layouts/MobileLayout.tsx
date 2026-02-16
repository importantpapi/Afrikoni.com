/**
 * Mobile Layout System
 * 
 * Unified mobile layout wrapper that provides:
 * - Mobile header (56px, sticky)
 * - Safe content padding (top: 16px, bottom: 96px)
 * - Bottom navigation (72px, fixed)
 * - Proper z-index layering
 * - Safe area support for notched devices
 * 
 * Only active on mobile viewports (max-width: 768px)
 */

import React, { useState, useEffect } from 'react';
import UnifiedMobileHeader from '@/components/mobile/UnifiedMobileHeader';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

interface MobileLayoutProps {
  children: React.ReactNode;
  user?: any;
  userRole?: 'buyer' | 'seller' | 'hybrid' | 'logistics';
}

export default function MobileLayout({ children, user, userRole = 'buyer' }: MobileLayoutProps) {
  // MobileLayout is only called when isMobile is true in parent Layout component
  // No need to check again here - just render the mobile layout
  return (
    <div className="mobile-layout min-h-screen bg-afrikoni-offwhite">
      {/* Mobile Header - Unified, no overlap */}
      <UnifiedMobileHeader user={user} transparent={false} />

      {/* Main Content - Safe padding for header and bottom nav */}
      <main className="mobile-page-content pt-4 pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Fixed, 72px height, z-50 */}
      <MobileBottomNav user={user} userRole={userRole} />
    </div>
  );
}

