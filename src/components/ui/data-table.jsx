import React from 'react';
import { motion } from 'framer-motion';
import { getStatusLabel, getStatusVariant } from '@/constants/status';
import { cn } from '@/lib/utils';
import { Badge } from './badge';

export function DataTable({ columns, data, onRowClick, className }) {
  return (
    <div className={cn('rounded-xl border border-afrikoni-gold/20 bg-afrikoni-offwhite shadow-afrikoni overflow-hidden', className)}>
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

