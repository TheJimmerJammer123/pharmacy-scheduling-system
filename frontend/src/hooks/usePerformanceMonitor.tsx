import { useState, useEffect, useCallback, useRef } from 'react';

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
  slowRenderThreshold: 16, // 16ms (60fps)
  memoryCheckInterval: 30000, // 30 seconds
  metricsRetention: 100, // Keep last 100 measurements
  slowInteractionThreshold: 100, // 100ms
  largePayloadThreshold: 1024 * 1024, // 1MB
};

interface PerformanceMetrics {
  renderTimes: number[];
  memoryUsage: number[];
  slowRenders: number;
  totalRenders: number;
  interactionDelays: number[];
  networkRequests: NetworkMetric[];
  vitals: WebVitalMetrics;
}

interface NetworkMetric {
  url: string;
  method: string;
  duration: number;
  size: number;
  timestamp: number;
  status: number;
}

interface WebVitalMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

interface PerformanceAlert {
  type: 'slow_render' | 'memory_leak' | 'slow_interaction' | 'large_payload';
  message: string;
  timestamp: number;
  data?: any;
}

/**
 * Custom hook for monitoring React application performance
 */
export const usePerformanceMonitor = (componentName?: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTimes: [],
    memoryUsage: [],
    slowRenders: 0,
    totalRenders: 0,
    interactionDelays: [],
    networkRequests: [],
    vitals: {}
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const renderStartTime = useRef<number>(0);
  const observer = useRef<PerformanceObserver | null>(null);

  // Track component render performance
  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    if (renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    
    setMetrics(prev => {
      const newRenderTimes = [...prev.renderTimes, renderTime].slice(-PERFORMANCE_CONFIG.metricsRetention);
      const newSlowRenders = renderTime > PERFORMANCE_CONFIG.slowRenderThreshold ? 
        prev.slowRenders + 1 : prev.slowRenders;

      // Alert for slow renders
      if (renderTime > PERFORMANCE_CONFIG.slowRenderThreshold) {
        addAlert({
          type: 'slow_render',
          message: `Slow render detected: ${renderTime.toFixed(2)}ms in ${componentName || 'component'}`,
          timestamp: Date.now(),
          data: { renderTime, componentName, threshold: PERFORMANCE_CONFIG.slowRenderThreshold }
        });
      }

      return {
        ...prev,
        renderTimes: newRenderTimes,
        slowRenders: newSlowRenders,
        totalRenders: prev.totalRenders + 1
      };
    });

    renderStartTime.current = 0;
  }, [componentName]);

  // Add performance alert
  const addAlert = useCallback((alert: PerformanceAlert) => {
    setAlerts(prev => [...prev.slice(-19), alert]); // Keep last 20 alerts
    console.warn('Performance Alert:', alert);
  }, []);

  // Track user interaction delays
  const trackInteraction = useCallback((interactionName: string, startTime: number) => {
    const delay = performance.now() - startTime;

    setMetrics(prev => {
      const newDelays = [...prev.interactionDelays, delay].slice(-PERFORMANCE_CONFIG.metricsRetention);

      if (delay > PERFORMANCE_CONFIG.slowInteractionThreshold) {
        addAlert({
          type: 'slow_interaction',
          message: `Slow interaction detected: ${interactionName} took ${delay.toFixed(2)}ms`,
          timestamp: Date.now(),
          data: { delay, interactionName, threshold: PERFORMANCE_CONFIG.slowInteractionThreshold }
        });
      }

      return {
        ...prev,
        interactionDelays: newDelays
      };
    });
  }, [addAlert]);

  // Track network request performance
  const trackNetworkRequest = useCallback((
    url: string, 
    method: string, 
    duration: number, 
    size: number, 
    status: number
  ) => {
    const networkMetric: NetworkMetric = {
      url,
      method,
      duration,
      size,
      timestamp: Date.now(),
      status
    };

    setMetrics(prev => {
      const newRequests = [...prev.networkRequests, networkMetric].slice(-PERFORMANCE_CONFIG.metricsRetention);

      // Alert for large payloads
      if (size > PERFORMANCE_CONFIG.largePayloadThreshold) {
        addAlert({
          type: 'large_payload',
          message: `Large payload detected: ${(size / 1024 / 1024).toFixed(2)}MB from ${url}`,
          timestamp: Date.now(),
          data: { url, size, sizeFormatted: formatBytes(size) }
        });
      }

      return {
        ...prev,
        networkRequests: newRequests
      };
    });
  }, [addAlert]);

  // Monitor memory usage
  const monitorMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;

      setMetrics(prev => {
        const newMemoryUsage = [...prev.memoryUsage, memoryUsage].slice(-PERFORMANCE_CONFIG.metricsRetention);

        // Detect potential memory leak
        if (newMemoryUsage.length >= 10) {
          const recentAverage = newMemoryUsage.slice(-10).reduce((a, b) => a + b, 0) / 10;
          const olderAverage = newMemoryUsage.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
          
          if (recentAverage > olderAverage + 0.1 && recentAverage > 0.8) { // 10% increase and above 80%
            addAlert({
              type: 'memory_leak',
              message: `Potential memory leak detected: ${(recentAverage * 100).toFixed(1)}% usage`,
              timestamp: Date.now(),
              data: { 
                currentUsage: recentAverage, 
                previousUsage: olderAverage,
                usedMB: (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2),
                totalMB: (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)
              }
            });
          }
        }

        return {
          ...prev,
          memoryUsage: newMemoryUsage
        };
      });
    }
  }, [addAlert]);

  // Setup Web Vitals monitoring
  const setupWebVitalsMonitoring = useCallback(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        setMetrics(prev => ({
          ...prev,
          vitals: { ...prev.vitals, lcp: lastEntry.startTime }
        }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          
          setMetrics(prev => ({
            ...prev,
            vitals: { ...prev.vitals, fid }
          }));
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        setMetrics(prev => ({
          ...prev,
          vitals: { ...prev.vitals, cls: clsValue }
        }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      observer.current = lcpObserver; // Store reference for cleanup

    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }
  }, []);

  // Calculate performance statistics
  const getPerformanceStats = useCallback(() => {
    const avgRenderTime = metrics.renderTimes.length > 0 ? 
      metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length : 0;

    const p95RenderTime = metrics.renderTimes.length > 0 ? 
      metrics.renderTimes.sort((a, b) => a - b)[Math.floor(metrics.renderTimes.length * 0.95)] : 0;

    const avgInteractionDelay = metrics.interactionDelays.length > 0 ?
      metrics.interactionDelays.reduce((a, b) => a + b, 0) / metrics.interactionDelays.length : 0;

    const slowRenderRate = metrics.totalRenders > 0 ? 
      (metrics.slowRenders / metrics.totalRenders) * 100 : 0;

    const avgNetworkDuration = metrics.networkRequests.length > 0 ?
      metrics.networkRequests.reduce((sum, req) => sum + req.duration, 0) / metrics.networkRequests.length : 0;

    return {
      renderPerformance: {
        avgRenderTime: Math.round(avgRenderTime * 100) / 100,
        p95RenderTime: Math.round(p95RenderTime * 100) / 100,
        slowRenderRate: Math.round(slowRenderRate * 100) / 100,
        totalRenders: metrics.totalRenders,
        slowRenders: metrics.slowRenders
      },
      interactionPerformance: {
        avgDelay: Math.round(avgInteractionDelay * 100) / 100,
        totalInteractions: metrics.interactionDelays.length
      },
      networkPerformance: {
        avgDuration: Math.round(avgNetworkDuration),
        totalRequests: metrics.networkRequests.length,
        totalDataTransfer: formatBytes(
          metrics.networkRequests.reduce((sum, req) => sum + req.size, 0)
        )
      },
      webVitals: {
        lcp: metrics.vitals.lcp ? Math.round(metrics.vitals.lcp) : undefined,
        fid: metrics.vitals.fid ? Math.round(metrics.vitals.fid * 100) / 100 : undefined,
        cls: metrics.vitals.cls ? Math.round(metrics.vitals.cls * 10000) / 10000 : undefined
      },
      memoryUsage: metrics.memoryUsage.length > 0 ? {
        current: Math.round(metrics.memoryUsage[metrics.memoryUsage.length - 1] * 100),
        avg: Math.round((metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length) * 100),
        trend: getMemoryTrend()
      } : undefined
    };
  }, [metrics]);

  // Get memory usage trend
  const getMemoryTrend = useCallback(() => {
    if (metrics.memoryUsage.length < 5) return 'stable';
    
    const recent = metrics.memoryUsage.slice(-5);
    const older = metrics.memoryUsage.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 0.05) return 'increasing';
    if (diff < -0.05) return 'decreasing';
    return 'stable';
  }, [metrics.memoryUsage]);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Initialize monitoring
  useEffect(() => {
    setupWebVitalsMonitoring();

    // Start memory monitoring
    const memoryInterval = setInterval(monitorMemoryUsage, PERFORMANCE_CONFIG.memoryCheckInterval);

    return () => {
      clearInterval(memoryInterval);
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [setupWebVitalsMonitoring, monitorMemoryUsage]);

  return {
    // Measurement functions
    startRenderMeasurement,
    endRenderMeasurement,
    trackInteraction,
    trackNetworkRequest,
    
    // Data
    metrics,
    alerts,
    stats: getPerformanceStats(),
    
    // Utilities
    clearAlerts: () => setAlerts([]),
    resetMetrics: () => setMetrics({
      renderTimes: [],
      memoryUsage: [],
      slowRenders: 0,
      totalRenders: 0,
      interactionDelays: [],
      networkRequests: [],
      vitals: {}
    })
  };
};

/**
 * HOC for automatic render performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  return (props: P) => {
    const { startRenderMeasurement, endRenderMeasurement } = usePerformanceMonitor(componentName);

    useEffect(() => {
      startRenderMeasurement();
    });

    useEffect(() => {
      endRenderMeasurement();
    });

    return <Component {...props} />;
  };
};

export default usePerformanceMonitor;
