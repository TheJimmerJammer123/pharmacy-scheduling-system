import { useState, useEffect, useMemo } from 'react';

interface UseVirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  overscan?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

export function useVirtualization({
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 5
}: UseVirtualizationOptions) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      itemCount - 1
    );

    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(itemCount - 1, endIndex + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight
      });
    }
    
    return items;
  }, [visibleRange, itemHeight]);

  // Total height for scrollbar
  const totalSize = itemCount * itemHeight;

  // Handle scroll
  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return {
    virtualItems,
    totalSize,
    handleScroll,
    visibleRange
  };
}