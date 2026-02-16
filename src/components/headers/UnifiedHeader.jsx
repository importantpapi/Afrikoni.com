/**
 * UnifiedHeader - Consistent header across Marketplace and Dashboard pages
 * 
 * Provides:
 * - Consistent logo/home button position
 * - Page title or breadcrumb
 * - User profile icon (consistent position)
 * - Language selector
 * - Notifications/messages icon
 * - Context-specific elements (search for marketplace, Create RFQ for dashboard)
 * 
 * Design specs:
 * - Unified brown gradient background
 * - Consistent top padding/safe area
 * - Same icon sizes and spacing (44x44px minimum touch targets)
 * - Sticky header on scroll
 * - Smooth transitions
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, MessageSquare, Plus, Globe, Home, ChevronRight } from 'lucide-react';
import { Input } from '@/components/shared/ui/input';
import { Button } from '@/components/shared/ui/button';
import { Logo } from '@/components/shared/ui/Logo';
import NotificationBell from '@/components/notificationbell';
import { useTranslation } from 'react-i18next';

export default function UnifiedHeader({
  // Context-specific props
  showSearch = false,
  showCreateRFQ = false,
  showFilters = false,
  onFiltersClick,
  onSearchChange,
  searchPlaceholder,
  // User props
  user,
  userAvatar,
  // Navigation props
  onMenuToggle,
  // Page context
  pageTitle,
  breadcrumbs = [],
  // Custom actions
  customActions,
}) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isMarketplace = location.pathname.startsWith('/marketplace') || location.pathname === '/';

  // Determine background based on context
  const headerBgClass = isDashboard 
    ? 'bg-gradient-to-r from-afrikoni-chestnut/95 via-afrikoni-brown-800/95 to-afrikoni-chestnut/95'
    : 'bg-gradient-to-r from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-chestnut';

  return (
    <header
      className={`
        sticky top-0 z-[100]
        w-full
        ${headerBgClass}
        border-b border-os-accent/30
        shadow-os-md
        transition-all duration-300
        safe-area-top
      `}
    >
      <div className="flex items-center h-14 md:h-16 lg:h-20 px-3 md:px-6 lg:px-8 w-full max-w-[1920px] mx-auto gap-2 md:gap-4">
        {/* LEFT SECTION: Logo/Home + Breadcrumbs/Title */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          {/* Logo/Home Button - Mobile optimized */}
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg hover:bg-os-accent/20 md:hover:bg-os-accent/10 active:scale-95 md:active:scale-100 transition-all touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
            aria-label="Home"
          >
            <Logo type="icon" size="sm" />
          </Link>

          {/* Breadcrumbs or Page Title */}
          {breadcrumbs.length > 0 ? (
            <nav className="hidden md:flex items-center gap-2 text-os-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <ChevronRight className="w-4 h-4 text-os-accent/60" />
                  )}
                  {crumb.href ? (
                    <Link
                      to={crumb.href}
                      className="text-afrikoni-cream/90 hover:text-os-accent transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-os-accent font-semibold">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          ) : pageTitle ? (
            <h1 className="hidden md:block text-os-lg md:text-os-xl font-bold text-os-accent">
              {pageTitle}
            </h1>
          ) : null}
        </div>

        {/* CENTER SECTION: Context-specific content */}
        <div className="flex-1 flex items-center justify-center px-4">
          {showSearch && (
            <div className="relative w-full max-w-2xl">
              <Search className="w-4 h-4 text-os-accent/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="search"
                placeholder={searchPlaceholder || t('search_placeholder') || 'Search products, suppliers, RFQs...'}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 pr-4 h-11 w-full border-os-accent/30 bg-white/95 focus:border-os-accent focus:ring-2 focus:ring-os-accent/20 shadow-sm transition-all text-os-sm rounded-lg"
              />
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Actions + User */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* Custom Actions */}
          {customActions}

          {/* Filters Button (Marketplace) */}
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFiltersClick}
              className="hidden md:flex items-center gap-2 border-os-accent/40 bg-white/90 hover:bg-white text-afrikoni-chestnut h-11 px-4"
            >
              <Menu className="w-4 h-4" />
              <span className="text-os-sm font-medium">{t('marketplace.filters') || 'Filters'}</span>
            </Button>
          )}

          {/* Create RFQ Button (Dashboard) */}
          {showCreateRFQ && (
            <Button
              onClick={() => window.location.href = '/dashboard/rfqs/new'}
              className="hidden md:flex items-center gap-2 bg-os-accent hover:bg-os-accent/90 text-afrikoni-chestnut font-semibold shadow-md rounded-lg px-4 md:px-6 h-11 transition-all hover:shadow-os-md whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="text-os-sm">{t('dashboard.createRFQ') || 'Create RFQ'}</span>
            </Button>
          )}

          {/* Language Selector - Mobile optimized */}
          <div className="relative group">
            <button
              className="flex items-center justify-center w-10 h-10 md:w-10 md:h-10 rounded-lg hover:bg-os-accent/20 md:hover:bg-os-accent/10 active:scale-95 md:active:scale-100 text-afrikoni-cream transition-all touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
              aria-label="Change language"
            >
              <Globe className="w-5 h-5" />
            </button>
            {/* Language dropdown would go here */}
          </div>

          {/* Messages - Mobile optimized */}
          <Link
            to="/messages"
            className="relative flex items-center justify-center w-10 h-10 md:w-10 md:h-10 rounded-lg hover:bg-os-accent/20 md:hover:bg-os-accent/10 active:scale-95 md:active:scale-100 text-afrikoni-cream transition-all touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
            {/* Badge would go here if there are unread messages */}
          </Link>

          {/* Notifications */}
          <div className="flex items-center">
            <NotificationBell />
          </div>

          {/* Menu Toggle (Mobile) */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-os-accent/20 text-afrikoni-cream transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* User Avatar - Mobile optimized */}
          {userAvatar || (
            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center justify-center w-10 h-10 md:w-10 md:h-10 rounded-full bg-os-accent/20 hover:bg-os-accent/30 md:hover:bg-os-accent/20 active:scale-95 md:active:scale-100 border-2 border-os-accent/40 transition-all touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
              aria-label={user ? 'Dashboard' : 'Login'}
            >
              {user ? (
                <span className="text-os-accent font-semibold text-os-sm">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              ) : (
                <span className="text-os-accent text-os-xs">Login</span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

