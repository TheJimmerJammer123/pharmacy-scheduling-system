# 📊 Performance Monitoring Guide - Pharmacy Scheduling System

This document outlines the comprehensive performance monitoring system implemented across the Pharmacy Scheduling System, covering both backend and frontend performance tracking.

## 📋 **Table of Contents**

- [Overview](#overview)
- [Backend Performance Monitoring](#backend-performance-monitoring)
- [Frontend Performance Monitoring](#frontend-performance-monitoring)
- [Performance Dashboard](#performance-dashboard)
- [Alerts and Thresholds](#alerts-and-thresholds)
- [Metrics Collection](#metrics-collection)
- [Troubleshooting](#troubleshooting)

---

## 🎯 **Overview**

Our performance monitoring system provides:
- **Real-time Metrics**: Live performance data collection
- **Health Scoring**: Automated system health assessment
- **Alerting System**: Proactive issue detection and notification
- **Historical Tracking**: Performance trends and analysis
- **Multi-layer Monitoring**: Backend, frontend, database, and network performance

### Key Components
- Backend Performance Middleware
- Frontend Performance Hooks
- Performance Dashboard UI
- Automated Alert System
- Health Check Endpoints

---

## ⚙️ **Backend Performance Monitoring**

### Performance Middleware
**File**: `backend/middleware/performanceMonitoring.js`

```javascript
app.use(performanceMonitoringMiddleware);
```

**Tracks**:
- Request duration and response times
- Memory usage per request
- CPU usage metrics
- Endpoint performance statistics
- Error rates and slow requests
- Database query performance

### Database Performance Tracking
```javascript
const { trackDatabasePerformance } = require('./middleware/performanceMonitoring');

// Track query performance
const start = Date.now();
const result = await db.query('SELECT * FROM contacts');
const duration = Date.now() - start;

trackDatabasePerformance('SELECT contacts', duration, null, { 
  rowCount: result.rows.length 
});
```

### API Endpoints

#### GET `/api/performance/report`
**Authentication**: Admin required  
**Description**: Comprehensive performance report

**Response**:
```json
{
  "uptime": 3600000,
  "uptimeFormatted": "1h 0m 0s",
  "requests": {
    "total": 1500,
    "avgDuration": 45,
    "slowRequests": 12,
    "errorRequests": 8,
    "slowRequestRate": "0.80%",
    "errorRate": "0.53%",
    "requestsPerMinute": 25
  },
  "database": {
    "totalQueries": 850,
    "avgQueryTime": 25,
    "slowQueries": 3,
    "slowQueryRate": "0.35%"
  },
  "memory": {
    "heapUsed": "125MB",
    "heapTotal": "256MB",
    "usagePercent": "48.83%",
    "external": "15MB",
    "rss": "180MB"
  },
  "healthScore": 94,
  "topEndpoints": [
    {
      "endpoint": "GET /api/contacts",
      "count": 245,
      "avgDuration": 35,
      "maxDuration": 150
    }
  ],
  "recentAlerts": []
}
```

### Performance Configuration
```javascript
const PERFORMANCE_CONFIG = {
  slowQueryThreshold: 1000,      // 1 second
  slowRequestThreshold: 2000,    // 2 seconds  
  memoryAlertThreshold: 0.9,     // 90% memory usage
  cpuAlertThreshold: 0.8,        // 80% CPU usage
  alertCooldown: 300000,         // 5 minutes between alerts
  metricsRetentionPeriod: 86400000 // 24 hours
};
```

---

## 🎨 **Frontend Performance Monitoring**

### Performance Hook
**File**: `frontend/src/hooks/usePerformanceMonitor.ts`

```tsx
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const MyComponent = () => {
  const { 
    startRenderMeasurement, 
    endRenderMeasurement,
    trackInteraction,
    stats,
    alerts
  } = usePerformanceMonitor('MyComponent');

  useEffect(() => {
    startRenderMeasurement();
  });

  useEffect(() => {
    endRenderMeasurement();
  });

  const handleClick = () => {
    const startTime = performance.now();
    
    // Perform action
    someExpensiveOperation();
    
    trackInteraction('button_click', startTime);
  };

  return <button onClick={handleClick}>Action</button>;
};
```

### Auto-monitoring HOC
```tsx
import { withPerformanceMonitoring } from '../hooks/usePerformanceMonitor';

const MyComponent = ({ data }) => {
  return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
};

export default withPerformanceMonitoring(MyComponent, 'DataList');
```

### Web Vitals Tracking
The system automatically tracks:
- **LCP (Largest Contentful Paint)**: Visual loading performance
- **FID (First Input Delay)**: Interactivity responsiveness
- **CLS (Cumulative Layout Shift)**: Visual stability

### Network Request Monitoring
```tsx
const trackNetworkRequest = (url, method, duration, size, status) => {
  // Automatically tracks:
  // - Request duration
  // - Response size
  // - Success/error rates
  // - Large payload detection
};
```

---

## 📱 **Performance Dashboard**

### Accessing the Dashboard
**URL**: `/performance` (Admin only)  
**Component**: `frontend/src/components/PerformanceDashboard.tsx`

### Dashboard Features

#### System Health Overview
- Overall health score (0-100)
- System uptime
- Visual health indicators
- Real-time status updates

#### Backend Performance Tab
- **Request Metrics**: Total requests, average duration, error rates
- **Database Performance**: Query statistics, slow query detection
- **Memory Usage**: Heap usage, memory trends
- **Top Endpoints**: Most used API endpoints with performance data

#### Frontend Performance Tab
- **Render Performance**: Component render times, slow render detection
- **Web Vitals**: LCP, FID, CLS scores with color-coded status
- **Browser Memory**: JavaScript heap usage and trends
- **Interaction Performance**: User interaction response times

#### Alerts Tab
- **Frontend Alerts**: Slow renders, memory leaks, interaction delays
- **Backend Alerts**: High error rates, memory issues, slow queries
- **Alert History**: Recent performance issues with timestamps

### Usage Examples

```tsx
// Access performance data in any component
const Dashboard = () => {
  const performanceData = usePerformanceMonitor();
  
  return (
    <div>
      <h2>App Performance</h2>
      <p>Avg Render Time: {performanceData.stats.renderPerformance.avgRenderTime}ms</p>
      <p>Memory Usage: {performanceData.stats.memoryUsage?.current}%</p>
    </div>
  );
};
```

---

## 🚨 **Alerts and Thresholds**

### Backend Alert Thresholds

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Request Duration | 1000ms | 2000ms |
| Database Query | 500ms | 1000ms |
| Memory Usage | 80% | 90% |
| Error Rate | 5% | 10% |
| CPU Usage | 70% | 80% |

### Frontend Alert Thresholds

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Render Time | 16ms (60fps) | 33ms (30fps) |
| Interaction Delay | 50ms | 100ms |
| Memory Growth | 10% increase | 20% increase |
| Payload Size | 500KB | 1MB |

### Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Alert Management
- **Cooldown Periods**: Prevents alert spam (5-minute default)
- **Alert History**: 24-hour retention of alert data
- **Severity Levels**: Info, Warning, Error, Critical
- **Auto-resolution**: Alerts automatically clear when conditions improve

---

## 📈 **Metrics Collection**

### Backend Metrics Storage
```javascript
const metrics = {
  requests: {
    totalCount: 0,
    totalDuration: 0,
    slowRequests: 0,
    errorRequests: 0,
    requestsByEndpoint: new Map(),
    recentRequests: [] // Last 1000 requests
  },
  database: {
    queryCount: 0,
    totalQueryTime: 0,
    slowQueries: 0,
    recentQueries: [] // Last 500 queries
  },
  system: {
    startTime: Date.now(),
    alertHistory: new Map(),
    lastHealthCheck: Date.now()
  }
};
```

### Frontend Metrics Storage
```typescript
interface PerformanceMetrics {
  renderTimes: number[];           // Last 100 render measurements
  memoryUsage: number[];           // Last 100 memory measurements
  slowRenders: number;             // Count of slow renders
  totalRenders: number;            // Total render count
  interactionDelays: number[];     // Last 100 interaction delays
  networkRequests: NetworkMetric[]; // Last 100 network requests
  vitals: WebVitalMetrics;         // Latest Web Vitals
}
```

### Health Score Calculation
```javascript
const calculateHealthScore = () => {
  let score = 100;
  
  // Deductions:
  // - Error rate: up to 50 points (10% error rate = 50 points off)
  // - Slow requests: up to 30 points (10% slow rate = 30 points off)  
  // - Slow queries: up to 20 points (10% slow rate = 20 points off)
  // - High memory: up to 20 points (above 80% usage)
  
  return Math.max(0, Math.min(100, Math.round(score)));
};
```

### Automatic Cleanup
- **Memory Management**: Automatic cleanup every hour
- **Retention Policy**: 24-hour data retention
- **Storage Limits**: Maximum 1000 recent requests, 500 queries
- **Alert Cleanup**: Removes old alerts automatically

---

## 🛠️ **Usage Guide**

### Setup Performance Monitoring

#### Backend Integration
```javascript
// server.js
const { 
  performanceMonitoringMiddleware,
  getPerformanceReport,
  startMetricsCleanup 
} = require('./middleware/performanceMonitoring');

app.use(performanceMonitoringMiddleware);

// Add performance report endpoint
app.get('/api/performance/report', authenticateUser, requireAdmin, (req, res) => {
  res.json(getPerformanceReport());
});

// Start automatic cleanup
startMetricsCleanup();
```

#### Frontend Integration
```tsx
// App.tsx
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';

const App = () => {
  const { stats, alerts } = usePerformanceMonitor('App');
  
  // Monitor app-level performance
  useEffect(() => {
    console.log('App performance:', stats);
  }, [stats]);

  return <Router>...</Router>;
};
```

### Manual Performance Tracking

#### Backend Database Queries
```javascript
const { trackDatabasePerformance } = require('./middleware/performanceMonitoring');

const executeQuery = async (query, params) => {
  const start = Date.now();
  
  try {
    const result = await db.query(query, params);
    const duration = Date.now() - start;
    
    trackDatabasePerformance(query, duration, null, {
      rowCount: result.rows.length,
      paramCount: params?.length || 0
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    trackDatabasePerformance(query, duration, error);
    throw error;
  }
};
```

#### Frontend Component Performance
```tsx
const ExpensiveComponent = ({ data }) => {
  const { startRenderMeasurement, endRenderMeasurement } = usePerformanceMonitor();
  
  // Manual render tracking
  useEffect(() => {
    startRenderMeasurement();
    
    // Expensive computation here
    const result = processLargeDataset(data);
    
    endRenderMeasurement();
  }, [data]);
  
  return <div>{/* render result */}</div>;
};
```

### Performance Testing
```javascript
// backend/tests/performanceMonitoring.test.js
describe('Performance Monitoring', () => {
  it('should track slow requests', async () => {
    // Test slow request detection
    const response = await request(app)
      .get('/slow-endpoint')
      .expect(200);
      
    const report = getPerformanceReport();
    expect(report.requests.slowRequests).toBeGreaterThan(0);
  });
});
```

---

## 🔧 **Troubleshooting**

### Common Performance Issues

#### High Memory Usage
```bash
# Check backend memory usage
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/performance/report | jq '.memory'

# Monitor frontend memory
# Open browser DevTools → Performance tab → Memory
```

**Solutions**:
- Review database connection pooling
- Check for memory leaks in event listeners
- Optimize large data structures
- Implement data pagination

#### Slow Database Queries
```sql
-- Enable query logging in PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

**Solutions**:
- Add database indexes
- Optimize query structure
- Implement query caching
- Use connection pooling

#### Slow Frontend Renders
```tsx
// Use React DevTools Profiler
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  if (actualDuration > 16) {
    console.warn(`Slow render: ${id} took ${actualDuration}ms`);
  }
};

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

**Solutions**:
- Implement React.memo for expensive components
- Use useMemo for expensive calculations
- Implement virtualization for large lists
- Optimize re-render triggers

### Performance Debugging

#### Backend Performance Issues
```bash
# Check current performance metrics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/performance/report | \
  jq '.requests, .database, .healthScore'

# Monitor real-time logs
tail -f backend/logs/combined.log | grep "Slow\|Error"

# Check system resources
docker compose exec backend top
docker compose exec backend ps aux --sort=-%cpu
```

#### Frontend Performance Issues
```javascript
// Performance measurement
const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
  return result;
};

// Memory usage tracking
const logMemoryUsage = () => {
  if (performance.memory) {
    console.log('Memory:', {
      used: `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)}MB`
    });
  }
};
```

### Alert Investigation

#### Backend Alerts
```bash
# Check recent alerts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/performance/report | \
  jq '.recentAlerts'

# Check application logs for context
docker compose logs --tail=100 backend | grep -E "(ERROR|WARN)"

# Monitor system resources
docker compose exec backend vmstat 1 5
docker compose exec backend iostat 1 5
```

#### Frontend Alerts
```javascript
// Check browser performance
console.log('Navigation Timing:', performance.getEntriesByType('navigation'));
console.log('Resource Timing:', performance.getEntriesByType('resource'));
console.log('Paint Timing:', performance.getEntriesByType('paint'));

// Check for memory leaks
const checkMemoryLeaks = () => {
  if (!performance.memory) return;
  
  const usage = performance.memory.usedJSHeapSize;
  console.log(`Memory usage: ${Math.round(usage / 1024 / 1024)}MB`);
  
  setTimeout(checkMemoryLeaks, 5000);
};
```

---

## 📚 **Best Practices**

### Performance Monitoring Strategy
1. **Establish Baselines**: Record normal performance metrics
2. **Set Appropriate Thresholds**: Balance sensitivity vs noise
3. **Monitor Trends**: Look for gradual degradation
4. **Investigate Alerts**: Don't ignore performance warnings
5. **Regular Reviews**: Weekly performance review sessions

### Optimization Guidelines
1. **Database Optimization**: Index frequently queried columns
2. **API Optimization**: Implement caching and pagination
3. **Frontend Optimization**: Code splitting and lazy loading
4. **Resource Management**: Proper cleanup of listeners and timers
5. **Monitoring Coverage**: Monitor all critical user paths

---

**Real-time performance insights for a responsive system! 📊⚡**