import React from 'react';
import { motion } from 'framer-motion';
import { getStatusLabel, getStatusVariant } from '@/constants/status';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Card, CardContent } from './card';

export function DataTable({ columns, data, onRowClick, className }) {
  // Mobile: Show cards, Desktop: Show table
  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, rowIdx) => (
          <motion.div
            key={rowIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIdx * 0.05 }}
            onClick={() => onRowClick?.(row)}
            className={cn(
              'cursor-pointer active:scale-[0.95] md:active:scale-[0.98] transition-transform touch-manipulation',
              onRowClick && 'cursor-pointer'
            )}
          >
            <Card className="border-afrikoni-gold/20 shadow-sm hover:shadow-md transition-shadow active:shadow-lg">
              <CardContent className="p-4 md:p-5 space-y-3">
                {columns.map((column, colIdx) => {
                  // Skip columns that are actions or less important on mobile
                  if (column.hideOnMobile) return null;
                  
                  const value = column.render 
                    ? column.render(row[column.accessor], row) 
                    : row[column.accessor];
                  
                  // Don't render empty values
                  if (!value && value !== 0) return null;
                  
                  return (
                    <div key={colIdx} className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide">
                        {column.header}
                      </span>
                      <span className="text-sm text-afrikoni-chestnut font-medium">
                        {value}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className={cn('hidden md:block rounded-xl border border-afrikoni-gold/20 bg-afrikoni-offwhite shadow-afrikoni overflow-hidden', className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20">
              <tr>
                {columns.map((column, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-semibold text-afrikoni-deep uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-afrikoni-gold/20">
              {data.map((row, rowIdx) => (
                <motion.tr
                  key={rowIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIdx * 0.05 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'hover:bg-afrikoni-offwhite transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((column, colIdx) => (
                    <td key={colIdx} className="px-4 py-3 text-sm text-afrikoni-chestnut">
                      {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function StatusChip({ status, variant, type = 'order' }) {
  // Use centralized status helpers
  const label = getStatusLabel(status, type);
  const statusVariant = variant || getStatusVariant(status, type);

  return (
    <Badge variant={statusVariant} className="text-xs">
      {label}
    </Badge>
  );
}

