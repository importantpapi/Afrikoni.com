import React from 'react';
import { Button } from '../button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable Pagination Footer Component
 */
export const PaginationFooter = React.memo(function PaginationFooter({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
  showInfo = true,
  totalCount = 0,
  pageSize = 20
}) {
  // Safety checks
  if (!totalPages || totalPages <= 1) return null;

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Calculate display range
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers (show max 7 pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn('flex items-center justify-between mt-8', className)}>
      {showInfo && totalCount > 0 && (
        <div className="text-os-sm text-afrikoni-deep/70">
          Showing {start}-{end} of {totalCount}
        </div>
      )}
      
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={!hasPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        {pageNumbers.map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-afrikoni-deep/50">
                ...
              </span>
            );
          }
          
          const isActive = page === currentPage;
          return (
            <Button
              key={page}
              variant={isActive ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onPageChange?.(page)}
              className={cn(
                'min-w-[2.5rem]',
                isActive && 'bg-os-accent text-afrikoni-chestnut'
              )}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </Button>
          );
        })}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

PaginationFooter.displayName = 'PaginationFooter';

