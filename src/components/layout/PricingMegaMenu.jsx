import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Package,
  Calculator,
  MapPin,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';

export default function PricingMegaMenu({ isOpen, onClose, triggerRef }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when clicking outside (works for both mouse and touch)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    // Support both mouse and touch events
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  const handleNavigate = (path) => {
    try {
      navigate(path);
      onClose();
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: use window.location for query params
      if (path.startsWith('/pricing')) {
        window.location.href = path;
      } else {
        navigate(path);
      }
      onClose();
    }
  };

  // Left Column - Pricing & Fees
  const reviewSections = [
    {
      title: 'Seller Plans',
      description: 'Choose how you sell on Afrikoni',
      icon: Package,
      items: [
        { name: 'Free Plan', description: 'Start selling with basic features', path: '/pricing?plan=free' },
        { name: 'Verified Seller', description: 'Enhanced visibility & trust', path: '/pricing?plan=verified' },
        { name: 'Enterprise Seller', description: 'Full platform access & support', path: '/pricing?plan=enterprise' }
      ]
    },
    {
      title: 'Transaction Fees',
      description: 'Commission per successful deal',
      icon: DollarSign,
      items: [
        { name: 'RFQ-based commission', description: 'Fee on RFQ-facilitated deals', path: '/pricing?type=rfq' },
        { name: 'Deal-based commission', description: 'Success fee on completed trades', path: '/pricing?type=deal' }
      ]
    },
    {
      title: 'Logistics & Trade Services',
      description: 'Optional Afrikoni-managed services',
      icon: TrendingUp,
      items: [
        { name: 'Logistics coordination', description: 'End-to-end shipping support', path: '/pricing?service=logistics' },
        { name: 'Supplier verification', description: 'KYC & business verification', path: '/pricing?service=verification' },
        { name: 'Trade assistance', description: 'Dedicated trade coordination', path: '/pricing?service=assistance' }
      ]
    },
    {
      title: 'Other Costs',
      description: 'Optional platform services',
      icon: Sparkles,
      items: [
        { name: 'Featured listings', description: 'Boost product visibility', path: '/pricing?feature=featured' },
        { name: 'Premium visibility', description: 'Priority placement & promotion', path: '/pricing?feature=premium' }
      ]
    }
  ];

  // Right Column - Estimate earnings & costs
  const estimateSections = [
    {
      title: 'Revenue Calculator',
      description: 'Estimate your earnings per trade',
      icon: Calculator,
      highlighted: true,
      badge: 'Most used',
      path: '/pricing?calculator=true',
      cta: 'Open calculator'
    },
    {
      title: 'Cost Estimator',
      description: 'Compare self-managed vs Afrikoni-assisted trade',
      icon: MapPin,
      path: '/pricing?estimator=true',
      cta: 'Get estimate'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={onClose}
            />
          )}

          {/* Mega Menu - Amazon-style: centered under navbar, fully visible */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`
              fixed
              left-0
              right-0
              w-full
              bg-white
              shadow-lg
              border-t-0
              border-x-0
              border-b
              border-afrikoni-gold/20
              mt-0
              z-50
              overflow-y-auto
              ${isMobile 
                ? 'top-[56px] sm:top-[64px] max-h-[calc(100vh-56px)] sm:max-h-[calc(100vh-64px)] rounded-t-xl rounded-b-none border-t border-x border-b' 
                : 'top-[64px] sm:top-[80px] max-h-[calc(100vh-80px)] rounded-b-xl'
              }
            `}
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* Inner container matching navbar width */}
            <div className="max-w-[1440px] mx-auto w-full">
              {/* Header with clear divider - Amazon style */}
              <div className="border-b-2 border-afrikoni-gold/20 bg-afrikoni-offwhite/30">
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-5 lg:pt-6 pb-4 lg:pb-5">
                  <h2 className="text-xl lg:text-2xl font-bold text-afrikoni-chestnut">Pricing & Plans</h2>
                  <button
                    onClick={onClose}
                    className="p-2 sm:p-1.5 rounded-lg hover:bg-afrikoni-gold/10 active:bg-afrikoni-gold/20 text-afrikoni-deep/60 hover:text-afrikoni-deep transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-white">
              {/* Desktop: 2-column layout */}
              <div className="hidden lg:grid lg:grid-cols-2 gap-8 lg:gap-10">
                {/* Left Column - Pricing & Fees */}
                <div className="min-w-0">
                  <h3 className="text-base lg:text-lg font-bold text-afrikoni-chestnut mb-5 lg:mb-6">
                    Pricing & Plans
                  </h3>
                  <div className="space-y-5 lg:space-y-6">
                    {reviewSections.map((section, idx) => {
                      const Icon = section.icon;
                      return (
                        <div key={idx} className="mb-5 lg:mb-6 last:mb-0">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-afrikoni-gold/15 to-afrikoni-gold/5 text-afrikoni-gold flex-shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-afrikoni-chestnut mb-1.5 text-base">
                                {section.title}
                              </h4>
                              <p className="text-xs text-afrikoni-deep/65 leading-relaxed mb-2">
                                {section.description}
                              </p>
                            </div>
                          </div>
                          <ul className="ml-14 space-y-2.5">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                <button
                                  onClick={() => handleNavigate(item.path)}
                                  className="text-left w-full text-sm text-afrikoni-deep hover:text-afrikoni-gold active:text-afrikoni-gold transition-all group py-2 px-3 rounded-lg hover:bg-afrikoni-gold/5 active:bg-afrikoni-gold/10 -ml-3 touch-manipulation"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium group-hover:underline text-afrikoni-chestnut">
                                      {item.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-afrikoni-deep/55 mt-1 leading-relaxed">
                                    {item.description}
                                  </p>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column - Calculator (Amazon-style card) */}
                <div className="min-w-0">
                  <h3 className="text-base lg:text-lg font-bold text-afrikoni-chestnut mb-5 lg:mb-6">
                    Estimate revenue & costs
                  </h3>
                  <div className="space-y-4">
                    {estimateSections.map((section, idx) => {
                      const Icon = section.icon;
                      return (
                        <div
                          key={idx}
                          className={`
                            bg-afrikoni-gold/5 rounded-xl p-5 shadow-sm border border-afrikoni-gold/20
                            transition-all cursor-pointer group touch-manipulation
                            ${section.highlighted 
                              ? 'bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-gold/5 to-afrikoni-cream/10 border-afrikoni-gold/40 shadow-md hover:shadow-lg active:shadow-md' 
                              : 'hover:bg-afrikoni-gold/10 hover:border-afrikoni-gold/30 active:bg-afrikoni-gold/15'
                            }
                          `}
                          onClick={() => handleNavigate(section.path)}
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`
                              p-3 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110
                              ${section.highlighted 
                                ? 'bg-gradient-to-br from-afrikoni-gold to-afrikoni-goldDark text-white shadow-lg' 
                                : 'bg-afrikoni-gold/10 text-afrikoni-gold'
                              }
                            `}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-afrikoni-chestnut text-base">
                                  {section.title}
                                </h4>
                                {section.badge && (
                                  <span className="text-xs bg-afrikoni-gold text-white px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                                    {section.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-afrikoni-deep/70 leading-relaxed">
                                {section.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={section.highlighted ? 'default' : 'outline'}
                            size="sm"
                            className={`w-full mt-4 text-sm h-10 touch-manipulation min-h-[44px] ${section.highlighted ? 'bg-afrikoni-gold hover:bg-afrikoni-goldDark active:bg-afrikoni-goldDark text-white' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(section.path);
                            }}
                          >
                            {section.cta}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile: Accordion layout */}
              <div className="lg:hidden space-y-4">
                
                {/* Review sections for mobile */}
                <div className="space-y-4">
                  {reviewSections.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                      <div key={idx} className="border border-afrikoni-gold/20 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-afrikoni-gold/10 text-afrikoni-gold">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-afrikoni-chestnut mb-1">
                              {section.title}
                            </h4>
                            <p className="text-xs text-afrikoni-deep/70">
                              {section.description}
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-2 ml-0 sm:ml-11">
                          {section.items.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                <button
                                  onClick={() => handleNavigate(item.path)}
                                  className="text-left w-full text-sm text-afrikoni-deep hover:text-afrikoni-gold active:text-afrikoni-gold transition-colors touch-manipulation py-2 px-2 rounded-lg active:bg-afrikoni-gold/5"
                                >
                                  <span className="font-medium block">{item.name}</span>
                                  <p className="text-xs text-afrikoni-deep/60 mt-0.5">
                                    {item.description}
                                  </p>
                                </button>
                              </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Estimate sections for mobile */}
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-afrikoni-chestnut mb-3">
                    Estimate revenue & costs
                  </h4>
                  {estimateSections.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                      <Card
                        key={idx}
                        className={`
                          border-afrikoni-gold/20 cursor-pointer
                          ${section.highlighted ? 'bg-gradient-to-br from-afrikoni-gold/5 to-afrikoni-cream/10' : ''}
                        `}
                        onClick={() => handleNavigate(section.path)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`
                              p-2 rounded-lg
                              ${section.highlighted ? 'bg-afrikoni-gold text-white' : 'bg-afrikoni-gold/10 text-afrikoni-gold'}
                            `}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-afrikoni-chestnut">
                                  {section.title}
                                </h4>
                                {section.badge && (
                                  <Badge className="bg-afrikoni-gold text-white text-xs">
                                    {section.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-afrikoni-deep/70">
                                {section.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={section.highlighted ? 'default' : 'outline'}
                            size="sm"
                            className="w-full touch-manipulation min-h-[44px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(section.path);
                            }}
                          >
                            {section.cta}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

