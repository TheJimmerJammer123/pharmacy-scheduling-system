import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasNextPage,
  fetchNextPage,
  threshold = 1.0,
  rootMargin = '0px'
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const elementRef = useRef<HTMLElement>();

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetching) return;
      
      if (observerRef.current) observerRef.current.disconnect();
      
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetching) {
            setIsFetching(true);
            fetchNextPage();
          }
        },
        {
          threshold,
          rootMargin
        }
      );
      
      if (node) {
        observerRef.current.observe(node);
        elementRef.current = node;
      }
    },
    [hasNextPage, fetchNextPage, isFetching, threshold, rootMargin]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFetching(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isFetching]);

  return {
    lastElementRef,
    isFetching
  };
}

// Hook for manual scroll detection
export function useScrollToBottom(callback: () => void, threshold = 100) {
  const scrollElementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
      
      if (isNearBottom) {
        callback();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);

  return scrollElementRef;
}