import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';

/**
 * Generic skeleton loader
 */
export function Skeleton({ className = '', variant = 'cream', ...props }) {
  const variants = {
    cream: 'bg-afrikoni-cream/10',
    gold: 'bg-afrikoni-gold/5',
    dark: 'bg-white/5',
    blue: 'bg-blue-500/10'
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
    <div className="rounded-xl border border-afrikoni-gold/20 bg-afrikoni-offwhite shadow-afrikoni overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20">
            <tr>
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-afrikoni-gold/20">
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
        <Card key={idx} className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
          <CardContent className="p-5 md:p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
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
        <Card key={idx} className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
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
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08090A]">
      <div className="text-center relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 relative z-10" />
        <p className="text-gray-400 text-sm font-medium tracking-tight relative z-10">Initializing OS...</p>
      </div>
    </div>
  );
}

/**
 * Full Dashboard Shell Skeleton
 * Mimics OSShell layout for smooth boot
 */
export function DashboardSkeleton() {
  return (
    <div className="h-screen w-full bg-[#08090A] overflow-hidden flex flex-col">
      {/* System Layer Mock */}
      <div className="h-[56px] w-full border-b border-white/5 bg-black/40 px-6 flex items-center justify-between">
        <Skeleton variant="dark" className="h-4 w-48" />
        <Skeleton variant="dark" className="h-6 w-32 rounded-full" />
      </div>

      {/* Identity Layer Mock */}
      <div className="h-[48px] w-full border-b border-white/5 bg-black/20 px-6 flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton variant="dark" className="h-6 w-32" />
          <Skeleton variant="dark" className="h-6 w-24" />
        </div>
        <div className="flex gap-3">
          <Skeleton variant="dark" className="h-8 w-8 rounded-full" />
          <Skeleton variant="dark" className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mock */}
        <div className="w-[240px] border-r border-white/5 bg-black/10 p-6 hidden md:block">
          <div className="space-y-6">
            <Skeleton variant="dark" className="h-8 w-full" />
            <div className="space-y-3">
              <Skeleton variant="dark" className="h-10 w-full" />
              <Skeleton variant="dark" className="h-10 w-full" />
              <Skeleton variant="dark" className="h-10 w-full" />
              <Skeleton variant="dark" className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Content Surface Mock */}
        <div className="flex-1 p-8 overflow-hidden space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton variant="dark" className="h-8 w-64" />
              <Skeleton variant="dark" className="h-12 w-[400px]" />
            </div>
            <Skeleton variant="blue" className="h-12 w-48 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton variant="dark" className="h-32 w-full rounded-2xl" />
            <Skeleton variant="dark" className="h-32 w-full rounded-2xl" />
            <Skeleton variant="dark" className="h-32 w-full rounded-2xl" />
            <Skeleton variant="dark" className="h-32 w-full rounded-2xl" />
          </div>

          <Skeleton variant="dark" className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

