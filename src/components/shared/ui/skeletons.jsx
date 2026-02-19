import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';

/**
 * Generic skeleton loader
 */
export function Skeleton({ className = '', variant = 'cream', ...props }) {
  const variants = {
    cream: 'bg-afrikoni-cream/10',
    gold: 'bg-os-accent/5',
    dark: 'bg-white/5',
    blue: 'bg-os-blue/10'
  };

  return (
    <div
      className={`skeleton-loading rounded ${variants[variant] || variants.cream} ${className}`}
      {...props}
    />
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="rounded-os-sm border border-os-accent/20 bg-afrikoni-offwhite shadow-os-gold overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-afrikoni-offwhite border-b border-os-accent/20">
            <tr>
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-os-accent/20">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Card skeleton
 */
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="border-os-accent/20 shadow-os-gold bg-afrikoni-offwhite">
          <CardContent className="p-5 md:p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Stat card skeleton
 */
export function StatCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="border-os-accent/20 shadow-os-gold bg-afrikoni-offwhite">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Page loader skeleton
 * Refined for Apple x Hermès aesthetic (Light, Clean, Institutional)
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-os-bg">
      <div className="text-center relative">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-os-accent mx-auto mb-6 relative z-10" />
        <p className="text-os-text-secondary text-os-sm font-medium tracking-wide relative z-10 animate-pulse">
          Securely connecting...
        </p>
      </div>
    </div>
  );
}

/**
 * Product Details Skeleton
 * Mimics the 2-column layout of the product page
 */
export function ProductDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-os-bg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        {/* Breadcrumb Mock */}
        <Skeleton variant="cream" className="h-4 w-64 mb-6" />

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Image Gallery (5 cols) */}
          <div className="lg:col-span-5">
            <Skeleton variant="cream" className="w-full aspect-square rounded-2xl mb-3" />
            <div className="flex gap-2 pb-1">
              <Skeleton variant="cream" className="w-16 h-16 rounded-xl shrink-0" />
              <Skeleton variant="cream" className="w-16 h-16 rounded-xl shrink-0" />
              <Skeleton variant="cream" className="w-16 h-16 rounded-xl shrink-0" />
            </div>
          </div>

          {/* Center: Product Info (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <div className="flex gap-2 mb-3">
                <Skeleton variant="cream" className="h-5 w-24 rounded-full" />
                <Skeleton variant="gold" className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton variant="cream" className="h-8 w-3/4 mb-3" />
              <Skeleton variant="cream" className="h-4 w-1/2" />
            </div>

            <Skeleton variant="cream" className="h-24 w-full rounded-xl" />

            <div className="grid grid-cols-2 gap-3">
              <Skeleton variant="cream" className="h-20 w-full rounded-xl" />
              <Skeleton variant="cream" className="h-20 w-full rounded-xl" />
              <Skeleton variant="cream" className="h-20 w-full rounded-xl" />
              <Skeleton variant="cream" className="h-20 w-full rounded-xl" />
            </div>
          </div>

          {/* Right: Actions (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <Skeleton variant="cream" className="h-64 w-full rounded-2xl" />
            <Skeleton variant="cream" className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full Dashboard Shell Skeleton
 * Mimics OSShell layout for smooth boot - Light Theme
 */
export function DashboardSkeleton() {
  return (
    <div className="h-screen w-full bg-os-bg overflow-hidden flex flex-col">
      {/* System Layer Mock */}
      <div className="h-[72px] w-full border-b border-os-stroke bg-white px-6 flex items-center justify-between">
        <Skeleton variant="cream" className="h-5 w-48" />
        <Skeleton variant="cream" className="h-8 w-32 rounded-full" />
      </div>

      {/* Identity Layer Mock */}
      <div className="h-[48px] w-full border-b border-os-stroke bg-white/50 px-6 flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton variant="cream" className="h-5 w-32" />
          <Skeleton variant="cream" className="h-5 w-24" />
        </div>
        <div className="flex gap-3">
          <Skeleton variant="gold" className="h-8 w-8 rounded-full" />
          <Skeleton variant="cream" className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mock */}
        <div className="w-[240px] border-r border-os-stroke bg-white p-6 hidden md:block">
          <div className="space-y-6">
            <Skeleton variant="cream" className="h-8 w-full" />
            <div className="space-y-3">
              <Skeleton variant="cream" className="h-10 w-full" />
              <Skeleton variant="cream" className="h-10 w-full" />
              <Skeleton variant="cream" className="h-10 w-full" />
              <Skeleton variant="cream" className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Content Surface Mock */}
        <div className="flex-1 p-8 overflow-hidden space-y-8 bg-os-bg">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton variant="cream" className="h-8 w-64" />
              <Skeleton variant="cream" className="h-12 w-[400px]" />
            </div>
            <Skeleton variant="gold" className="h-12 w-48 rounded-os-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton variant="cream" className="h-32 w-full rounded-os-md shadow-sm" />
            <Skeleton variant="cream" className="h-32 w-full rounded-os-md shadow-sm" />
            <Skeleton variant="cream" className="h-32 w-full rounded-os-md shadow-sm" />
            <Skeleton variant="cream" className="h-32 w-full rounded-os-md shadow-sm" />
          </div>

          <Skeleton variant="cream" className="h-[400px] w-full rounded-os-md shadow-sm" />
        </div>
      </div>
    </div>
  );
}

