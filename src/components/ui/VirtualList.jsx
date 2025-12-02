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
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight = items.length * (itemHeight + gap) - gap;

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );
    return { start, end };
  }, [scrollTop, containerHeight, itemHeight, gap, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange.start, visibleRange.end]);

  const offsetY = visibleRange.start * (itemHeight + gap);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
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
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                height: itemHeight,
                marginBottom: gap,
              }}
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

