const { logger } = require('./errorHandler');

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
  slowQueryThreshold: 1000, // 1 second
  slowRequestThreshold: 2000, // 2 seconds
  memoryAlertThreshold: 0.9, // 90% memory usage
  cpuAlertThreshold: 0.8, // 80% CPU usage
  alertCooldown: 5 * 60 * 1000, // 5 minutes between similar alerts
  metricsRetentionPeriod: 24 * 60 * 60 * 1000 // 24 hours
};

// Performance metrics storage
const performanceMetrics = {
  requests: {
    totalCount: 0,
    totalDuration: 0,
    slowRequests: 0,
    errorRequests: 0,
    requestsByEndpoint: new Map(),
    recentRequests: []
  },
  database: {
    queryCount: 0,
    totalQueryTime: 0,
    slowQueries: 0,
    recentQueries: []
  },
  system: {
    startTime: Date.now(),
    alertHistory: new Map(),
    lastHealthCheck: Date.now()
  }
};

// Performance alert tracking
const alertTracker = new Map();

/**
 * Enhanced request performance monitoring middleware
 */
const performanceMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  const startCpu = process.cpuUsage();

  // Generate unique request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.performanceId = requestId;

  // Hook into response finish event
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(startCpu);

    // Calculate resource usage
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    const cpuUsage = (endCpu.user + endCpu.system) / 1000; // Convert to milliseconds

    // Create performance record
    const performanceRecord = {
      requestId,
      timestamp: startTime,
      duration,
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      memoryUsage: {
        heap: endMemory.heapUsed,
        delta: memoryDelta
      },
      cpuUsage,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id || null
    };

    // Update metrics
    updateRequestMetrics(performanceRecord);

    // Log performance data
    logPerformanceData(performanceRecord);

    // Check for performance issues
    checkPerformanceAlerts(performanceRecord);
  });

  next();
};

/**
 * Update request performance metrics
 */
const updateRequestMetrics = (record) => {
  const { requests } = performanceMetrics;

  // Update overall statistics
  requests.totalCount++;
  requests.totalDuration += record.duration;

  // Track slow requests
  if (record.duration > PERFORMANCE_CONFIG.slowRequestThreshold) {
    requests.slowRequests++;
  }

  // Track error requests
  if (record.statusCode >= 400) {
    requests.errorRequests++;
  }

  // Track by endpoint
  const endpointKey = `${record.method} ${record.endpoint}`;
  const endpointData = requests.requestsByEndpoint.get(endpointKey) || {
    count: 0,
    totalDuration: 0,
    maxDuration: 0,
    minDuration: Infinity
  };

  endpointData.count++;
  endpointData.totalDuration += record.duration;
  endpointData.maxDuration = Math.max(endpointData.maxDuration, record.duration);
  endpointData.minDuration = Math.min(endpointData.minDuration, record.duration);
  endpointData.avgDuration = endpointData.totalDuration / endpointData.count;

  requests.requestsByEndpoint.set(endpointKey, endpointData);

  // Store recent requests (keep last 1000)
  requests.recentRequests.push(record);
  if (requests.recentRequests.length > 1000) {
    requests.recentRequests.shift();
  }
};

/**
 * Enhanced database performance monitoring
 */
const trackDatabasePerformance = (query, duration, error = null, metadata = {}) => {
  const { database } = performanceMetrics;

  const record = {
    timestamp: Date.now(),
    query: query.length > 200 ? query.substring(0, 200) + '...' : query,
    duration,
    error: error ? error.message : null,
    ...metadata
  };

  // Update metrics
  database.queryCount++;
  database.totalQueryTime += duration;

  if (duration > PERFORMANCE_CONFIG.slowQueryThreshold) {
    database.slowQueries++;
    
    logger.warn('Slow database query detected', {
      query: record.query,
      duration: `${duration}ms`,
      threshold: `${PERFORMANCE_CONFIG.slowQueryThreshold}ms`
    });
  }

  // Store recent queries (keep last 500)
  database.recentQueries.push(record);
  if (database.recentQueries.length > 500) {
    database.recentQueries.shift();
  }

  // Log database errors
  if (error) {
    logger.error('Database query error', {
      query: record.query,
      error: error.message,
      duration: `${duration}ms`
    });
  }
};

/**
 * Log performance data based on severity
 */
const logPerformanceData = (record) => {
  const logData = {
    requestId: record.requestId,
    endpoint: record.endpoint,
    method: record.method,
    duration: `${record.duration}ms`,
    statusCode: record.statusCode,
    memoryDelta: `${Math.round(record.memoryUsage.delta / 1024)}KB`,
    cpuUsage: `${record.cpuUsage}ms`,
    ip: record.ip
  };

  if (record.duration > PERFORMANCE_CONFIG.slowRequestThreshold) {
    logger.warn('Slow request detected', {
      ...logData,
      threshold: `${PERFORMANCE_CONFIG.slowRequestThreshold}ms`
    });
  } else if (record.statusCode >= 500) {
    logger.error('Server error request', logData);
  } else if (record.statusCode >= 400) {
    logger.warn('Client error request', logData);
  } else {
    logger.debug('Request completed', logData);
  }
};

/**
 * Check for performance alerts and system issues
 */
const checkPerformanceAlerts = (record) => {
  const now = Date.now();

  // Memory usage alert
  const memoryUsage = process.memoryUsage();
  const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
  
  if (memoryPercent > PERFORMANCE_CONFIG.memoryAlertThreshold) {
    sendAlert('high_memory_usage', {
      usage: `${(memoryPercent * 100).toFixed(2)}%`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    });
  }

  // Slow request pattern alert
  const recentSlowRequests = performanceMetrics.requests.recentRequests
    .filter(req => req.timestamp > now - 60000) // Last minute
    .filter(req => req.duration > PERFORMANCE_CONFIG.slowRequestThreshold);

  if (recentSlowRequests.length > 5) {
    sendAlert('high_slow_request_rate', {
      count: recentSlowRequests.length,
      timeWindow: '1 minute',
      threshold: PERFORMANCE_CONFIG.slowRequestThreshold
    });
  }

  // Error rate alert
  const recentRequests = performanceMetrics.requests.recentRequests
    .filter(req => req.timestamp > now - 300000); // Last 5 minutes

  const errorRate = recentRequests.length > 0 ? 
    recentRequests.filter(req => req.statusCode >= 500).length / recentRequests.length : 0;

  if (errorRate > 0.1 && recentRequests.length > 10) { // 10% error rate with min 10 requests
    sendAlert('high_error_rate', {
      errorRate: `${(errorRate * 100).toFixed(2)}%`,
      totalRequests: recentRequests.length,
      timeWindow: '5 minutes'
    });
  }
};

/**
 * Send performance alert with cooldown
 */
const sendAlert = (alertType, data) => {
  const now = Date.now();
  const lastAlert = alertTracker.get(alertType);

  // Check cooldown period
  if (lastAlert && now - lastAlert < PERFORMANCE_CONFIG.alertCooldown) {
    return; // Skip alert due to cooldown
  }

  // Update alert tracker
  alertTracker.set(alertType, now);

  // Log alert
  logger.error(`Performance Alert: ${alertType}`, {
    alertType,
    data,
    timestamp: new Date().toISOString()
  });

  // Store alert history
  const alertHistory = performanceMetrics.system.alertHistory.get(alertType) || [];
  alertHistory.push({
    timestamp: now,
    data
  });

  // Keep only recent alerts (last 24 hours)
  const cutoffTime = now - PERFORMANCE_CONFIG.metricsRetentionPeriod;
  performanceMetrics.system.alertHistory.set(
    alertType,
    alertHistory.filter(alert => alert.timestamp > cutoffTime)
  );
};

/**
 * Get comprehensive performance report
 */
const getPerformanceReport = () => {
  const { requests, database, system } = performanceMetrics;
  const uptime = Date.now() - system.startTime;
  const memoryUsage = process.memoryUsage();

  return {
    uptime: uptime,
    uptimeFormatted: formatDuration(uptime),
    timestamp: new Date().toISOString(),
    
    requests: {
      total: requests.totalCount,
      avgDuration: requests.totalCount > 0 ? 
        Math.max(1, Math.round(requests.totalDuration / requests.totalCount)) : 0,
      slowRequests: requests.slowRequests,
      errorRequests: requests.errorRequests,
      slowRequestRate: requests.totalCount > 0 ? 
        (requests.slowRequests === 0 ? '0%' : ((requests.slowRequests / requests.totalCount) * 100).toFixed(2) + '%') : '0%',
      errorRate: requests.totalCount > 0 ? 
        (requests.errorRequests === 0 ? '0%' : ((requests.errorRequests / requests.totalCount) * 100).toFixed(2) + '%') : '0%',
      requestsPerMinute: uptime > 0 ? 
        Math.round((requests.totalCount / uptime) * 60000) : 0
    },

    database: {
      totalQueries: database.queryCount,
      avgQueryTime: database.queryCount > 0 ? 
        Math.round(database.totalQueryTime / database.queryCount) : 0,
      slowQueries: database.slowQueries,
      slowQueryRate: database.queryCount > 0 ? 
        ((database.slowQueries / database.queryCount) * 100).toFixed(2) + '%' : '0%'
    },

    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      usagePercent: `${((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)}%`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    },

    topEndpoints: getTopEndpoints(),
    recentAlerts: getRecentAlerts(),
    healthScore: calculateHealthScore()
  };
};

/**
 * Get top performing/problematic endpoints
 */
const getTopEndpoints = () => {
  const endpoints = Array.from(performanceMetrics.requests.requestsByEndpoint.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      ...data
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return endpoints;
};

/**
 * Get recent performance alerts
 */
const getRecentAlerts = () => {
  const alerts = [];
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours

  performanceMetrics.system.alertHistory.forEach((alertList, alertType) => {
    alertList
      .filter(alert => alert.timestamp > cutoffTime)
      .forEach(alert => {
        alerts.push({
          type: alertType,
          timestamp: alert.timestamp,
          data: alert.data
        });
      });
  });

  return alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
};

/**
 * Calculate overall system health score (0-100)
 */
const calculateHealthScore = () => {
  let score = 100;
  const { requests, database } = performanceMetrics;
  
  // Deduct points for high error rates
  const errorRate = requests.totalCount > 0 ? 
    (requests.errorRequests / requests.totalCount) : 0;
  score -= errorRate * 500; // Max 50 points deduction for 10% error rate

  // Deduct points for slow requests
  const slowRate = requests.totalCount > 0 ? 
    (requests.slowRequests / requests.totalCount) : 0;
  score -= slowRate * 300; // Max 30 points deduction for 10% slow rate

  // Deduct points for slow queries
  const slowQueryRate = database.queryCount > 0 ? 
    (database.slowQueries / database.queryCount) : 0;
  score -= slowQueryRate * 200; // Max 20 points deduction for 10% slow queries

  // Memory usage penalty
  const memoryUsage = process.memoryUsage();
  const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
  if (memoryPercent > 0.8) {
    score -= (memoryPercent - 0.8) * 100; // Up to 20 points for high memory
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Format duration in human readable format
 */
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Reset metrics (useful for testing or periodic cleanup)
 */
const resetMetrics = () => {
  performanceMetrics.requests = {
    totalCount: 0,
    totalDuration: 0,
    slowRequests: 0,
    errorRequests: 0,
    requestsByEndpoint: new Map(),
    recentRequests: []
  };

  performanceMetrics.database = {
    queryCount: 0,
    totalQueryTime: 0,
    slowQueries: 0,
    recentQueries: []
  };

  performanceMetrics.system = {
    startTime: Date.now(),
    alertHistory: new Map(),
    lastHealthCheck: Date.now()
  };

  alertTracker.clear();
  
  logger.info('Performance metrics reset');
};

/**
 * Periodic metrics cleanup to prevent memory leaks
 */
const startMetricsCleanup = () => {
  const intervalMs = process.env.NODE_ENV === 'test' ? 2000 : 60 * 60 * 1000;
  const timer = setInterval(() => {
    const now = Date.now();
    const cutoffTime = now - PERFORMANCE_CONFIG.metricsRetentionPeriod;

    // Clean old requests
    performanceMetrics.requests.recentRequests = 
      performanceMetrics.requests.recentRequests.filter(req => req.timestamp > cutoffTime);

    // Clean old queries
    performanceMetrics.database.recentQueries = 
      performanceMetrics.database.recentQueries.filter(query => query.timestamp > cutoffTime);

    // Clean old alerts
    performanceMetrics.system.alertHistory.forEach((alertList, alertType) => {
      const filteredAlerts = alertList.filter(alert => alert.timestamp > cutoffTime);
      if (filteredAlerts.length > 0) {
        performanceMetrics.system.alertHistory.set(alertType, filteredAlerts);
      } else {
        performanceMetrics.system.alertHistory.delete(alertType);
      }
    });

    logger.debug('Performance metrics cleanup completed');
  }, intervalMs);
  timer.unref?.();
};

module.exports = {
  performanceMonitoringMiddleware,
  trackDatabasePerformance,
  getPerformanceReport,
  resetMetrics,
  startMetricsCleanup,
  PERFORMANCE_CONFIG
};