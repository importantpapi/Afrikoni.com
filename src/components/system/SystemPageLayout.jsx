/**
 * SystemPageLayout - Reusable template for Afrikoni system pages
 * Provides consistent structure: Hero → Sections → CTA Footer
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Hero Section Component
 */
export function SystemPageHero({ 
  eyebrow, 
  title, 
  subtitle, 
  primaryCTA, 
  secondaryCTA,
  eyebrowIcon: EyebrowIcon 
}) {
  return (
    <div className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {eyebrow && (
            <Badge className="bg-afrikoni-gold/20 text-afrikoni-goldLight border-afrikoni-gold/30 mb-6 inline-flex items-center gap-2">
              {EyebrowIcon && <EyebrowIcon className="w-4 h-4" />}
              {eyebrow}
            </Badge>
          )}
          <h1 className="text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em] text-afrikoni-gold mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-body font-normal leading-[1.6] text-white/95 max-w-3xl mx-auto mb-8">
              {subtitle}
            </p>
          )}
          {(primaryCTA || secondaryCTA) && (
            <div className="flex flex-wrap justify-center gap-4">
              {primaryCTA && (
                <Link to={primaryCTA.to || '#'} onClick={primaryCTA.onClick}>
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white">
                    {primaryCTA.label}
                  </Button>
                </Link>
              )}
              {secondaryCTA && (
                <Link to={secondaryCTA.to || '#'} onClick={secondaryCTA.onClick}>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    {secondaryCTA.label}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Section Wrapper Component
 */
export function SystemPageSection({ 
  title, 
  subtitle, 
  children, 
  className = '',
  maxWidth = 'max-w-7xl'
}) {
  return (
    <section className={`py-12 md:py-16 bg-afrikoni-offwhite ${className}`}>
      <div className={`${maxWidth} mx-auto px-4`}>
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {title && (
              <h2 className="text-h2-mobile md:text-h2 font-semibold leading-[1.2] text-afrikoni-gold mb-6">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}

/**
 * Institutional Card Component
 */
export function SystemPageCard({ 
  icon: Icon, 
  title, 
  children, 
  className = '',
  iconBg = 'bg-afrikoni-gold/20',
  iconColor = 'text-afrikoni-gold'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`bg-afrikoni-cream rounded-xl border border-afrikoni-gold/30 p-6 hover:shadow-lg transition-shadow ${className}`}
    >
      {Icon && (
        <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      )}
      {title && (
        <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-3">
          {title}
        </h3>
      )}
      <div className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Timeline/Steps Component
 */
export function SystemPageTimeline({ steps, className = '' }) {
  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {steps.map((step, idx) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="relative"
          >
            {/* Vertical line connector (hidden on last item) */}
            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute top-12 left-12 w-full h-0.5 bg-afrikoni-gold/20 -z-10" />
            )}
            <div className="bg-afrikoni-cream rounded-xl border border-afrikoni-gold/30 p-6 h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-afrikoni-gold text-white flex items-center justify-center font-bold text-lg">
                  {step.number || idx + 1}
                </div>
                {Icon && (
                  <div className="w-10 h-10 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                )}
              </div>
              <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-2">
                {step.title}
              </h3>
              <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                {step.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * CTA Footer Strip Component
 */
export function SystemPageCTA({ 
  title, 
  description, 
  ctaLabel, 
  ctaTo, 
  note,
  onClick 
}) {
  return (
    <div className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {title && (
            <h2 className="text-h2-mobile md:text-h2 font-semibold leading-[1.2] text-white mb-4">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-body font-normal leading-[1.6] text-white/95 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          {ctaLabel && (
            <Link to={ctaTo || '#'} onClick={onClick}>
              <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white">
                {ctaLabel}
              </Button>
            </Link>
          )}
          {note && (
            <p className="text-meta font-medium text-white/80 mt-6">
              {note}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Main Layout Wrapper
 */
export default function SystemPageLayout({ 
  seo,
  hero,
  sections = [],
  cta,
  children 
}) {
  return (
    <>
      {seo}
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        {hero && <SystemPageHero {...hero} />}
        
        {/* Custom Content or Sections */}
        {children || sections.map((section, idx) => (
          <SystemPageSection key={idx} {...section} />
        ))}
        
        {/* CTA Footer */}
        {cta && <SystemPageCTA {...cta} />}
      </div>
    </>
  );
}

