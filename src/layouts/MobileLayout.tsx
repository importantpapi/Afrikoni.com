/**
 * MOBILE LAYOUT (LUXURY OS-GRADE)
 * Apple iOS + Hermès Standard
 * 
 * Unified mobile experience with:
 * - Single cohesive header (supports wizard flows)
 * - Premium unified bottom nav
 * - Proper safe-area spacing
 * - Role-aware navigation
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import UnifiedMobileHeader from '@/components/mobile/UnifiedMobileHeader';
import UnifiedMobileBottomNav from '@/components/mobile/UnifiedMobileBottomNav';
import WhatsAppButton from '@/components/shared/ui/WhatsAppButton';
import CookieBanner from '@/components/shared/ui/CookieBanner';

interface MobileLayoutProps {
  children: React.ReactNode;
  user?: any;
  userRole?: 'buyer' | 'seller' | 'hybrid' | 'logistics';
}

export default function MobileLayout({
  children,
  user,
  userRole = 'buyer'
}: MobileLayoutProps) {
  const location = useLocation();

  // Detect specialized flows for the header
  const isRFQWizard = location.pathname.includes('/rfq/create-mobile');
  const isInbox = location.pathname.includes('/inbox-mobile');

  // Pages where we hide the bottom nav
  const hideBottomNav = [
    '/login',
    '/signup',
    '/forgot-password',
    '/auth-callback',
  ].some(path => location.pathname.includes(path));

  // Premium Header Logic
  const headerProps = {
    user,
    transparent: location.pathname === '/',
    title: isRFQWizard ? 'Sourcing Request' : isInbox ? 'Messages' : undefined,
    showClose: isRFQWizard,
    onClose: isRFQWizard ? () => window.history.back() : undefined
  };

  return (
    <div className="mobile-layout min-h-screen bg-gradient-to-b from-white via-afrikoni-ivory/20 to-afrikoni-ivory/40">
      {/* Unified Premium Header */}
      <UnifiedMobileHeader {...headerProps} />

      {/* Main Content Area */}
      {/* pb-32 ensures content clears the PremiumBottomNav + safe area footer */}
      <main className={isRFQWizard ? "pb-36" : "pb-32"}>
        {children}
      </main>

      {/* Unified Role-Aware Bottom Navigation */}
      {!hideBottomNav && (
        <UnifiedMobileBottomNav user={user} userRole={userRole} />
      )}

      {/* Persistent Utilities */}
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
}

