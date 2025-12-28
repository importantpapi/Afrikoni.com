import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Virtual scrolling component for large lists
 * Only renders visible items + buffer for smooth scrolling
 */
export default function VirtualList({
  items = [],
  itemHeight = 200,
  containerHeight = 600,
  overscan = 3, // Number of items to render outside viewport
  renderItem,
  className = '',
  gap = 0,
  getItemKey = null, // Optional function to get unique key from item
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  const totalHeight = safeItems.length * (itemHeight + gap) - gap;

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const end = Math.min(
      safeItems.length - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );
    return { start, end };
  }, [scrollTop, containerHeight, itemHeight, gap, safeItems.length, overscan]);

  const visibleItems = useMemo(() => {
    return safeItems.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [safeItems, visibleRange.start, visibleRange.end]);

  const offsetY = visibleRange.start * (itemHeight + gap);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Helper to get unique key for item
  const getKey = (item, index) => {
    if (getItemKey) {
      return getItemKey(item, index);
    }
    // Try common ID fields
    if (item?.id) return item.id;
    if (item?.key) return item.key;
    // Fallback to index (not ideal but works)
    return index;
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <motion.div
              key={getKey(item, index)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                height: itemHeight,
                marginBottom: gap,
              }}
            >
              {renderItem(item)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

