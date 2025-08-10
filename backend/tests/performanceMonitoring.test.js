const request = require('supertest');
const express = require('express');
const {
  performanceMonitoringMiddleware,
  trackDatabasePerformance,
  getPerformanceReport,
  resetMetrics,
  PERFORMANCE_CONFIG
} = require('../middleware/performanceMonitoring');

// Mock logger
jest.mock('../middleware/errorHandler', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
  }
}));

describe('Performance Monitoring Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(performanceMonitoringMiddleware);
    resetMetrics();
  });

  describe('Request Performance Tracking', () => {
    it('should track request duration and status', async () => {
      app.get('/test', (req, res) => {
        // Simulate some processing time
        setTimeout(() => {
          res.json({ message: 'test' });
        }, 10);
      });

      await request(app)
        .get('/test')
        .expect(200);

      const report = getPerformanceReport();
      
      expect(report.requests.total).toBe(1);
      expect(report.requests.avgDuration).toBeGreaterThan(0);
      expect(report.requests.errorRequests).toBe(0);
    });

    it('should track error requests', async () => {
      app.get('/error', (req, res) => {
        res.status(500).json({ error: 'test error' });
      });

      await request(app)
        .get('/error')
        .expect(500);

      const report = getPerformanceReport();
      
      expect(report.requests.total).toBe(1);
      expect(report.requests.errorRequests).toBe(1);
      expect(report.requests.errorRate).toBe('100.00%');
    });

    it('should track slow requests', async () => {
      app.get('/slow', (req, res) => {
        setTimeout(() => {
          res.json({ message: 'slow response' });
        }, PERFORMANCE_CONFIG.slowRequestThreshold + 100);
      });

      await request(app)
        .get('/slow')
        .expect(200);

      const report = getPerformanceReport();
      
      expect(report.requests.total).toBe(1);
      expect(report.requests.slowRequests).toBe(1);
    });

    it('should track requests by endpoint', async () => {
      app.get('/endpoint1', (req, res) => res.json({ endpoint: 1 }));
      app.get('/endpoint2', (req, res) => res.json({ endpoint: 2 }));

      await request(app).get('/endpoint1').expect(200);
      await request(app).get('/endpoint1').expect(200);
      await request(app).get('/endpoint2').expect(200);

      const report = getPerformanceReport();
      
      expect(report.requests.total).toBe(3);
      expect(report.topEndpoints).toHaveLength(2);
      
      const endpoint1 = report.topEndpoints.find(e => e.endpoint.includes('endpoint1'));
      const endpoint2 = report.topEndpoints.find(e => e.endpoint.includes('endpoint2'));
      
      expect(endpoint1.count).toBe(2);
      expect(endpoint2.count).toBe(1);
    });
  });

  describe('Database Performance Tracking', () => {
    it('should track database query performance', () => {
      const query = 'SELECT * FROM users WHERE id = $1';
      const duration = 50;

      trackDatabasePerformance(query, duration);

      const report = getPerformanceReport();
      
      expect(report.database.totalQueries).toBe(1);
      expect(report.database.avgQueryTime).toBe(50);
      expect(report.database.slowQueries).toBe(0);
    });

    it('should detect slow queries', () => {
      const query = 'SELECT * FROM large_table';
      const slowDuration = PERFORMANCE_CONFIG.slowQueryThreshold + 500;

      trackDatabasePerformance(query, slowDuration);

      const report = getPerformanceReport();
      
      expect(report.database.totalQueries).toBe(1);
      expect(report.database.slowQueries).toBe(1);
      expect(report.database.slowQueryRate).toBe('100.00%');
    });

    it('should truncate long queries in reports', () => {
      const longQuery = 'SELECT ' + 'column, '.repeat(100) + 'id FROM table';
      const duration = 25;

      trackDatabasePerformance(longQuery, duration);

      const report = getPerformanceReport();
      expect(report.database.totalQueries).toBe(1);
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', async () => {
      // Add some test data
      app.get('/api/test', (req, res) => res.json({ test: true }));
      
      await request(app).get('/api/test').expect(200);
      await request(app).get('/api/test').expect(200);
      
      trackDatabasePerformance('SELECT * FROM test', 25);
      trackDatabasePerformance('SELECT * FROM test', 75);

      const report = getPerformanceReport();

      // Check report structure
      expect(report).toHaveProperty('uptime');
      expect(report).toHaveProperty('uptimeFormatted');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('requests');
      expect(report).toHaveProperty('database');
      expect(report).toHaveProperty('memory');
      expect(report).toHaveProperty('topEndpoints');
      expect(report).toHaveProperty('healthScore');

      // Check request metrics
      expect(report.requests.total).toBe(2);
      expect(report.requests.avgDuration).toBeGreaterThan(0);
      expect(report.requests.errorRate).toBe('0%');

      // Check database metrics
      expect(report.database.totalQueries).toBe(2);
      expect(report.database.avgQueryTime).toBe(50);

      // Check health score
      expect(report.healthScore).toBeGreaterThan(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });

    it('should calculate health score correctly', async () => {
      // Simulate good performance
      app.get('/healthy', (req, res) => res.json({ status: 'ok' }));
      
      for (let i = 0; i < 10; i++) {
        await request(app).get('/healthy').expect(200);
      }

      const goodReport = getPerformanceReport();
      expect(goodReport.healthScore).toBeGreaterThan(90);

      // Reset and simulate poor performance
      resetMetrics();
      
      app.get('/unhealthy', (req, res) => {
        if (Math.random() > 0.5) {
          res.status(500).json({ error: 'random error' });
        } else {
          setTimeout(() => {
            res.json({ status: 'slow' });
          }, PERFORMANCE_CONFIG.slowRequestThreshold + 100);
        }
      });

      for (let i = 0; i < 10; i++) {
        await request(app).get('/unhealthy');
      }

      const poorReport = getPerformanceReport();
      expect(poorReport.healthScore).toBeLessThan(90);
    });
  });

  describe('Metrics Reset', () => {
    it('should reset all performance metrics', async () => {
      // Generate some data
      app.get('/test', (req, res) => res.json({ test: true }));
      
      await request(app).get('/test').expect(200);
      trackDatabasePerformance('SELECT * FROM test', 25);

      let report = getPerformanceReport();
      expect(report.requests.total).toBe(1);
      expect(report.database.totalQueries).toBe(1);

      // Reset metrics
      resetMetrics();

      report = getPerformanceReport();
      expect(report.requests.total).toBe(0);
      expect(report.database.totalQueries).toBe(0);
      expect(report.topEndpoints).toHaveLength(0);
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should track memory usage in report', () => {
      const report = getPerformanceReport();
      
      expect(report.memory).toHaveProperty('heapUsed');
      expect(report.memory).toHaveProperty('heapTotal');
      expect(report.memory).toHaveProperty('usagePercent');
      expect(report.memory).toHaveProperty('external');
      expect(report.memory).toHaveProperty('rss');
      
      expect(report.memory.heapUsed).toMatch(/\d+MB/);
      expect(report.memory.usagePercent).toMatch(/\d+\.\d+%/);
    });
  });

  describe('Performance Configuration', () => {
    it('should have correct default configuration', () => {
      expect(PERFORMANCE_CONFIG).toHaveProperty('slowQueryThreshold');
      expect(PERFORMANCE_CONFIG).toHaveProperty('slowRequestThreshold');
      expect(PERFORMANCE_CONFIG).toHaveProperty('memoryAlertThreshold');
      expect(PERFORMANCE_CONFIG).toHaveProperty('alertCooldown');
      
      expect(PERFORMANCE_CONFIG.slowQueryThreshold).toBe(1000);
      expect(PERFORMANCE_CONFIG.slowRequestThreshold).toBe(2000);
      expect(PERFORMANCE_CONFIG.memoryAlertThreshold).toBe(0.9);
    });
  });
});