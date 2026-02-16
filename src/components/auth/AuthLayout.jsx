/**
 * AuthLayout - Institutional-grade authentication layout
 * Hermès × Apple 2026 Design Standard
 * Used for: Login, Signup, Password Reset, Email Verification, etc.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/ui/Logo';

export default function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLink
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F8F6F0] to-[#F5F2EA] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Subtle depth - calm, not dramatic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,169,55,0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,169,55,0.02),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] z-10"
      >
        <div className="bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)] p-12 border border-black/[0.08]">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-10">
              <Logo type="symbol" size="md" />
            </div>
            {title && (
              <h1 className="text-[26px] font-semibold text-gray-900 mb-3 tracking-[-0.02em] leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          {children}

          {/* Footer Link */}
          {footerText && (
            <div className="text-center text-sm text-gray-600 mt-10 pt-8 border-t border-gray-100">
              <p>{footerText}</p>
            </div>
          )}
        </div>

        {/* Legal Footer */}
        <p className="mt-10 text-center text-[13px] text-gray-400 leading-relaxed">
          © 2026 Afrikoni · <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a> · <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a> · <a href="/security" className="hover:text-gray-600 transition-colors">Security</a>
        </p>
      </motion.div>
    </div>
  );
}
