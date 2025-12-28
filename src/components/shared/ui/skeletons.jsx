import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';

/**
 * Generic skeleton loader
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton-loading bg-afrikoni-cream rounded ${className}`}
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
    <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold mx-auto mb-4" />
        <p className="text-afrikoni-deep/70">Loading...</p>
      </div>
    </div>
  );
}

