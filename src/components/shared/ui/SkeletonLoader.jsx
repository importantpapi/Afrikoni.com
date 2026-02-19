/**
 * Reusable skeleton loader for content that's loading
 */

import React from 'react';

/**
 * Base skeleton loader component
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Skeleton shape ('rectangular', 'circular', 'text')
 * @param {string|number} props.width - Width of skeleton
 * @param {string|number} props.height - Height of skeleton
 */
export const SkeletonLoader = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const baseClasses = 'opacity-50 bg-gray-200';

  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'h-4 rounded',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

/**
 * Product card skeleton
 */
export const ProductCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <SkeletonLoader className="w-full h-48 mb-4" />
      <SkeletonLoader variant="text" className="w-3/4 mb-2" />
      <SkeletonLoader variant="text" className="w-1/2 mb-4" />
      <SkeletonLoader className="w-full h-10" />
    </div>
  );
};

/**
 * Grid of product skeletons
 */
export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Table skeleton loader
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoader key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 border-b flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;

