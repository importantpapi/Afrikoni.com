/**
 * CALM AUTH LAYOUT (MOBILE)
 * Apple ID + Private Banking Standard
 * 
 * Calm, minimal, trustworthy
 * No dark gradients, no drama
 * Soft focus rings, gentle transitions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/ui/Logo';
import { cn } from '@/lib/utils';

export default function CalmAuthLayout({ 
  children, 
  title, 
  subtitle,
  showLogo = true,
  className 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-afrikoni-ivory/30 to-afrikoni-ivory/50 flex flex-col">
      {/* Top Safe Area */}
      <div className="h-safe bg-white" />

      {/* Content Container */}
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Logo (Optional) */}
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="mb-12"
          >
            <Logo type="horizontal" size="md" link={false} showTagline={false} />
          </motion.div>
        )}

        {/* Header Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="mb-8"
        >
          {title && (
            <h1 className="text-3xl font-bold text-afrikoni-deep mb-3 tracking-tight leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-base text-afrikoni-deep/60 leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={cn("flex-1", className)}
        >
          {children}
        </motion.div>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-safe bg-afrikoni-ivory/50" />
    </div>
  );
}

/**
 * PREMIUM AUTH INPUT
 * Soft, calm, luxury feel
 */
export function AuthInput({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error,
  ...props 
}) {
  return (
    <div className="mb-6">
      {label && (
        <label className="block text-sm font-semibold text-afrikoni-deep mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full px-5 py-4 rounded-2xl bg-white",
          "border-2 transition-all duration-200 ease-out",
          "text-base text-afrikoni-deep placeholder:text-afrikoni-deep/40",
          "focus:outline-none",
          error
            ? "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
            : "border-os-accent/20 focus:border-os-accent/40 focus:shadow-[0_0_0_4px_rgba(217,156,85,0.12)]"
        )}
        style={{ fontSize: '16px' }} // Prevents iOS zoom
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * PREMIUM AUTH BUTTON
 * Soft, confident, expensive feel
 */
export function AuthButton({ children, loading, variant = 'primary', ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      disabled={loading}
      className={cn(
        "w-full py-4 rounded-2xl font-semibold text-base",
        "transition-all duration-200 ease-out",
        "shadow-sm active:shadow-none",
        "touch-manipulation",
        variant === 'primary' && [
          "bg-os-accent text-white",
          "hover:bg-os-accent-dark",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        ],
        variant === 'secondary' && [
          "bg-white text-os-accent border-2 border-os-accent/30",
          "hover:border-os-accent/50",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        ]
      )}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Please wait...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}
