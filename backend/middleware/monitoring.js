const { logger } = require('./errorHandler');

// Application metrics storage
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: new Map(),
    byMethod: new Map(),
    byStatusCode: new Map()
  },
  performance: {
    responseTimeHistory: [],
    maxResponseTime: 0,
    minResponseTime: Infinity,
    avgResponseTime: 0
  },
  database: {
    queries: 0,
    errors: 0,
    slowQueries: 0,
    connectionPoolSize: 0
  },
  sms: {
    sent: 0,
    failed: 0,
    deliveryUpdates: 0
  },
  auth: {
    logins: 0,
    failures: 0,
    registrations: 0,
    activeUsers: new Set()
  }
};

// Middleware to collect request metrics
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track request start
  metrics.requests.total++;
  
  // Track by endpoint
  const endpoint = req.route?.path || req.path;
  metrics.requests.byEndpoint.set(
    endpoint,
    (metrics.requests.byEndpoint.get(endpoint) || 0) + 1
  );
  
  // Track by method
  metrics.requests.byMethod.set(
    req.method,
    (metrics.requests.byMethod.get(req.method) || 0) + 1
  );
  
  // Hook into response finish event
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Track response time
    metrics.performance.responseTimeHistory.push(responseTime);
    
    // Keep only last 1000 response times
    if (metrics.performance.responseTimeHistory.length > 1000) {
      metrics.performance.responseTimeHistory.shift();
    }
    
    // Update response time stats
    metrics.performance.maxResponseTime = Math.max(
      metrics.performance.maxResponseTime, 
      responseTime
    );
    metrics.performance.minResponseTime = Math.min(
      metrics.performance.minResponseTime, 
      responseTime
    );
    metrics.performance.avgResponseTime = 
      metrics.performance.responseTimeHistory.reduce((a, b) => a + b, 0) / 
      metrics.performance.responseTimeHistory.length;
    
    // Track status codes
    const statusCode = res.statusCode;
    metrics.requests.byStatusCode.set(
      statusCode,
      (metrics.requests.byStatusCode.get(statusCode) || 0) + 1
    );
    
    // Track success/error
    if (statusCode >= 200 && statusCode < 300) {
      metrics.requests.success++;
    } else if (statusCode >= 400) {
      metrics.requests.errors++;
    }
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        endpoint,
        method: req.method,
        responseTime: `${responseTime}ms`,
        statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Log errors
    if (statusCode >= 500) {
      logger.error('Server error', {
        endpoint,
        method: req.method,
        statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  });
  
  next();
};

// Function to track database metrics
const trackDatabaseMetrics = (operation, duration, error = null) => {
  metrics.database.queries++;
  
  if (error) {
    metrics.database.errors++;
  }
  
  if (duration > 1000) { // Slow query threshold: 1 second
    metrics.database.slowQueries++;
    logger.warn('Slow database query detected', {
      operation,
      duration: `${duration}ms`
    });
  }
};

// Function to track SMS metrics
const trackSMSMetrics = (type, success = true) => {
  if (type === 'send') {
    if (success) {
      metrics.sms.sent++;
    } else {
      metrics.sms.failed++;
    }
  } else if (type === 'delivery') {
    metrics.sms.deliveryUpdates++;
  }
};

// Function to track authentication metrics
const trackAuthMetrics = (type, userId = null, success = true) => {
  switch (type) {
    case 'login':
      if (success) {
        metrics.auth.logins++;
        if (userId) {
          metrics.auth.activeUsers.add(userId);
        }
      } else {
        metrics.auth.failures++;
      }
      break;
    case 'register':
      metrics.auth.registrations++;
      break;
    case 'logout':
      if (userId) {
        metrics.auth.activeUsers.delete(userId);
      }
      break;
  }
};

// Health check endpoint data
const getHealthStatus = () => {
  const now = Date.now();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    cpu: {
      usage: process.cpuUsage()
    }
  };
};

// Metrics endpoint data
const getMetrics = () => {
  const uptime = process.uptime();
  
  return {
    uptime,
    timestamp: new Date().toISOString(),
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      errorRate: metrics.requests.total > 0 ? 
        (metrics.requests.errors / metrics.requests.total * 100).toFixed(2) + '%' : '0%',
      byEndpoint: Object.fromEntries(metrics.requests.byEndpoint),
      byMethod: Object.fromEntries(metrics.requests.byMethod),
      byStatusCode: Object.fromEntries(metrics.requests.byStatusCode)
    },
    performance: {
      avgResponseTime: Math.round(metrics.performance.avgResponseTime) || 0,
      maxResponseTime: metrics.performance.maxResponseTime === Infinity ? 0 : metrics.performance.maxResponseTime,
      minResponseTime: metrics.performance.minResponseTime === Infinity ? 0 : metrics.performance.minResponseTime,
      requestsPerMinute: uptime > 0 ? Math.round((metrics.requests.total / uptime) * 60) : 0
    },
    database: {
      totalQueries: metrics.database.queries,
      errors: metrics.database.errors,
      slowQueries: metrics.database.slowQueries,
      errorRate: metrics.database.queries > 0 ? 
        (metrics.database.errors / metrics.database.queries * 100).toFixed(2) + '%' : '0%'
    },
    sms: {
      sent: metrics.sms.sent,
      failed: metrics.sms.failed,
      deliveryUpdates: metrics.sms.deliveryUpdates,
      successRate: (metrics.sms.sent + metrics.sms.failed) > 0 ? 
        (metrics.sms.sent / (metrics.sms.sent + metrics.sms.failed) * 100).toFixed(2) + '%' : '0%'
    },
    auth: {
      totalLogins: metrics.auth.logins,
      failures: metrics.auth.failures,
      registrations: metrics.auth.registrations,
      activeUsers: metrics.auth.activeUsers.size,
      successRate: (metrics.auth.logins + metrics.auth.failures) > 0 ?
        (metrics.auth.logins / (metrics.auth.logins + metrics.auth.failures) * 100).toFixed(2) + '%' : '0%'
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
};

// System alerts based on metrics
const checkSystemAlerts = () => {
  const alerts = [];
  const errorRate = metrics.requests.total > 0 ? 
    (metrics.requests.errors / metrics.requests.total) * 100 : 0;
  
  // High error rate alert
  if (errorRate > 10) {
    alerts.push({
      type: 'error_rate',
      severity: 'high',
      message: `High error rate: ${errorRate.toFixed(2)}%`,
      threshold: '10%'
    });
  }
  
  // High response time alert
  if (metrics.performance.avgResponseTime > 2000) {
    alerts.push({
      type: 'response_time',
      severity: 'medium',
      message: `High average response time: ${metrics.performance.avgResponseTime}ms`,
      threshold: '2000ms'
    });
  }
  
  // Memory usage alert
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  if (memoryUsagePercentage > 90) {
    alerts.push({
      type: 'memory',
      severity: 'high',
      message: `High memory usage: ${memoryUsagePercentage.toFixed(2)}%`,
      threshold: '90%'
    });
  }
  
  // Database error rate alert
  const dbErrorRate = metrics.database.queries > 0 ? 
    (metrics.database.errors / metrics.database.queries) * 100 : 0;
  
  if (dbErrorRate > 5) {
    alerts.push({
      type: 'database_errors',
      severity: 'high',
      message: `High database error rate: ${dbErrorRate.toFixed(2)}%`,
      threshold: '5%'
    });
  }
  
  return alerts;
};

// Performance monitoring function
const monitorPerformance = () => {
  setInterval(() => {
    const alerts = checkSystemAlerts();
    
    if (alerts.length > 0) {
      logger.warn('System alerts detected', { alerts });
    }
    
    // Log periodic metrics
    logger.info('Periodic metrics', {
      requests: {
        total: metrics.requests.total,
        errorRate: metrics.requests.total > 0 ? 
          ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%' : '0%'
      },
      performance: {
        avgResponseTime: Math.round(metrics.performance.avgResponseTime) || 0
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      }
    });
  }, 5 * 60 * 1000); // Every 5 minutes
};

module.exports = {
  metricsMiddleware,
  trackDatabaseMetrics,
  trackSMSMetrics,
  trackAuthMetrics,
  getHealthStatus,
  getMetrics,
  checkSystemAlerts,
  monitorPerformance
};