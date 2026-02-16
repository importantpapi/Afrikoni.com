/**
 * MOBILE LAYOUT (LUXURY OS-GRADE)
 * Apple iOS + Hermès Standard
 * 
 * Unified mobile experience with:
 * - Single cohesive header (no overlaps)
 * - Premium bottom nav
 * - Proper spacing
 * - Calm interactions
 */

import React from 'react';
import UnifiedMobileHeader from '@/components/mobile/UnifiedMobileHeader';
import PremiumBottomNav from '@/components/mobile/PremiumBottomNav';
import WhatsAppButton from '@/components/shared/ui/WhatsAppButton';
import CookieBanner from '@/components/shared/ui/CookieBanner';
import { useLocation } from 'react-router-dom';

export default function MobileLayout({ children, user }) {
  const location = useLocation();
  
  // Pages where we hide the bottom nav (e.g., full-screen flows)
  const hideBottomNav = [
    '/login',
    '/signup',
    '/forgot-password',
    '/auth-callback',
  ].some(path => location.pathname.startsWith(path));

  // Pages with transparent header (e.g., homepage hero)
  const transparentHeader = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-afrikoni-ivory/20 to-afrikoni-ivory/40 overflow-x-hidden">
      {/* Unified Header (no overlap bugs) */}
      <UnifiedMobileHeader user={user} transparent={transparentHeader} />

      {/* Main Content */}
      <main className="relative pb-[88px]">
        {children}
      </main>

      {/* Bottom Navigation (hidden on auth pages) */}
      {!hideBottomNav && <PremiumBottomNav user={user} />}

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
