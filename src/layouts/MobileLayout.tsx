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
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

interface MobileLayoutProps {
  children: React.ReactNode;
  user?: any;
  userRole?: 'buyer' | 'seller' | 'hybrid' | 'logistics';
}

export default function MobileLayout({ children, user, userRole = 'buyer' }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only apply mobile layout on mobile viewports
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="mobile-layout min-h-screen bg-afrikoni-offwhite">
      {/* Mobile Header - Sticky, 56px height, z-30 */}
      <MobileHeader user={user} />

      {/* Main Content - Safe padding for header and bottom nav */}
      <main className="mobile-page-content pt-4 pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Fixed, 72px height, z-50 */}
      <MobileBottomNav user={user} userRole={userRole} />
    </div>
  );
}

