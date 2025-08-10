import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useVirtualization } from '@/hooks/useVirtualization';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

function VirtualListComponent<T>(
  {
    items,
    height,
    itemHeight,
    renderItem,
    className,
    overscan = 5
  }: VirtualListProps<T>,
  ref: React.Ref<HTMLDivElement>
) {
  const { virtualItems, totalSize, handleScroll } = useVirtualization({
    itemHeight,
    containerHeight: height,
    itemCount: items.length,
    overscan
  });

  return (
    <div
      ref={ref}
      className={cn('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map(({ index, start, size }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: start,
              height: size,
              width: '100%'
            }}
          >
            {renderItem(items[index], index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListComponent) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;