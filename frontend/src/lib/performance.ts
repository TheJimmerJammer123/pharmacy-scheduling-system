// Performance monitoring utilities
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track component render time
  trackRender(componentName: string, startTime: number) {
    const renderTime = performance.now() - startTime;
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }
    this.metrics.get(componentName)!.push(renderTime);

    // Log slow renders
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }

  // Track API call performance
  trackApiCall(endpoint: string, startTime: number) {
    const duration = performance.now() - startTime;
    if (!this.metrics.has(`api_${endpoint}`)) {
      this.metrics.set(`api_${endpoint}`, []);
    }
    this.metrics.get(`api_${endpoint}`)!.push(duration);

    // Log slow API calls
    if (duration > 1000) { // 1 second threshold
      console.warn(`Slow API call detected for ${endpoint}: ${duration.toFixed(2)}ms`);
    }
  }

  // Get performance metrics
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [key, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        result[key] = { avg, min, max, count: values.length };
      }
    }
    
    return result;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Monitor bundle size
  trackBundleSize() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('resource');
      const jsFiles = entries.filter(entry => entry.name.includes('.js'));
      
      jsFiles.forEach(file => {
        console.log(`Bundle loaded: ${file.name} (${(file.duration / 1000).toFixed(2)}s)`);
      });
    }
  }

  // Monitor memory usage
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      
      if (usedMB > 100) { // 100MB threshold
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`);
      }
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// React performance hook
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();
  
  return () => {
    performanceMonitor.trackRender(componentName, startTime);
  };
}

// API performance wrapper
export function withApiPerformanceTracking<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      performanceMonitor.trackApiCall(endpoint, startTime);
      return result;
    } catch (error) {
      performanceMonitor.trackApiCall(endpoint, startTime);
      throw error;
    }
  };
}