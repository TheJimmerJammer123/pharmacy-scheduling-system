// Performance utilities for the pharmacy scheduling system

/**
 * Debounce function to limit the rate of function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function results to avoid expensive recalculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func.apply(null, args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Lazy load images with intersection observer
 */
export function createImageLoader() {
  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  );

  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    unobserve: (img: HTMLImageElement) => imageObserver.unobserve(img),
    disconnect: () => imageObserver.disconnect()
  };
}

/**
 * Batch DOM updates to avoid layout thrashing
 */
export function batchDOMUpdates(callback: () => void) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 5000 });
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  }
}

/**
 * Measure component render performance
 */
export function measurePerformance(name: string, fn: () => void) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
}

/**
 * Create a performance observer for monitoring metrics
 */
export function createPerformanceObserver() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return null;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
      }
      
      if (entry.entryType === 'first-input') {
        console.log('FID:', (entry as PerformanceEventTiming).processingStart - entry.startTime);
      }
      
      if (entry.entryType === 'layout-shift') {
        console.log('CLS:', (entry as any).value);
      }
    }
  });

  // Observe different types of performance entries
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  } catch (e) {
    console.warn('Performance observer not fully supported');
  }

  return observer;
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  document.head.appendChild(link);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get device performance tier based on hardware capabilities
 */
export function getPerformanceTier(): 'low' | 'medium' | 'high' {
  if (typeof navigator === 'undefined') return 'medium';
  
  // Check for hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  
  // Check for memory (if available)
  const memory = (navigator as any).deviceMemory || 4;
  
  // Simple heuristic for performance tier
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  return 'low';
}

/**
 * Optimize images based on device capabilities
 */
export function getOptimalImageSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 800
): { width: number; height: number; quality: number } {
  const tier = getPerformanceTier();
  
  // Adjust quality based on performance tier
  const quality = tier === 'high' ? 90 : tier === 'medium' ? 75 : 60;
  
  // Calculate optimal dimensions
  const aspectRatio = originalHeight / originalWidth;
  const width = Math.min(originalWidth, maxWidth);
  const height = Math.round(width * aspectRatio);
  
  return { width, height, quality };
}