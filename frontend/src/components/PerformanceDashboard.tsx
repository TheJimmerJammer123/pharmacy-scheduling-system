import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe,
  MemoryStick,
  MonitorSpeaker,
  RefreshCw,
  TrendingUp,
  Zap
} from 'lucide-react';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';

interface BackendMetrics {
  uptime: number;
  uptimeFormatted: string;
  requests: {
    total: number;
    avgDuration: number;
    slowRequests: number;
    errorRequests: number;
    slowRequestRate: string;
    errorRate: string;
    requestsPerMinute: number;
  };
  database: {
    totalQueries: number;
    avgQueryTime: number;
    slowQueries: number;
    slowQueryRate: string;
  };
  memory: {
    heapUsed: string;
    heapTotal: string;
    usagePercent: string;
    external: string;
    rss: string;
  };
  healthScore: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    avgDuration: number;
    maxDuration: number;
  }>;
  recentAlerts: Array<{
    type: string;
    timestamp: number;
    data: any;
  }>;
}

const PerformanceDashboard: React.FC = () => {
  const [backendMetrics, setBackendMetrics] = useState<BackendMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const {
    stats: frontendStats,
    alerts: frontendAlerts,
    clearAlerts,
    resetMetrics
  } = usePerformanceMonitor('PerformanceDashboard');

  // Fetch backend performance metrics
  const fetchBackendMetrics = async () => {
    try {
      const response = await fetch('/api/performance/report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch backend metrics:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    fetchBackendMetrics();
    const interval = setInterval(fetchBackendMetrics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Get health score color and status
  const getHealthStatus = (score: number) => {
    if (score >= 90) return { color: 'bg-green-500', status: 'Excellent', icon: CheckCircle };
    if (score >= 75) return { color: 'bg-blue-500', status: 'Good', icon: Activity };
    if (score >= 50) return { color: 'bg-yellow-500', status: 'Fair', icon: AlertTriangle };
    return { color: 'bg-red-500', status: 'Poor', icon: AlertTriangle };
  };

  // Get Web Vitals status
  const getVitalsStatus = (metric: string, value?: number) => {
    if (!value) return { status: 'Unknown', color: 'bg-gray-400' };
    
    switch (metric) {
      case 'lcp':
        if (value <= 2500) return { status: 'Good', color: 'bg-green-500' };
        if (value <= 4000) return { status: 'Needs Improvement', color: 'bg-yellow-500' };
        return { status: 'Poor', color: 'bg-red-500' };
      
      case 'fid':
        if (value <= 100) return { status: 'Good', color: 'bg-green-500' };
        if (value <= 300) return { status: 'Needs Improvement', color: 'bg-yellow-500' };
        return { status: 'Poor', color: 'bg-red-500' };
      
      case 'cls':
        if (value <= 0.1) return { status: 'Good', color: 'bg-green-500' };
        if (value <= 0.25) return { status: 'Needs Improvement', color: 'bg-yellow-500' };
        return { status: 'Poor', color: 'bg-red-500' };
      
      default:
        return { status: 'Unknown', color: 'bg-gray-400' };
    }
  };

  // Format time ago
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const healthStatus = backendMetrics ? getHealthStatus(backendMetrics.healthScore) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system performance and health metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBackendMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* System Health Overview */}
      {backendMetrics && healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorSpeaker className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${healthStatus.color}`} />
                <span className="font-medium">Health Score: {backendMetrics.healthScore}/100</span>
                <Badge variant="outline">{healthStatus.status}</Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Uptime: {backendMetrics.uptimeFormatted}
              </div>
            </div>
            
            <Progress value={backendMetrics.healthScore} className="w-full" />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="backend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backend">Backend Performance</TabsTrigger>
          <TabsTrigger value="frontend">Frontend Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
        </TabsList>

        {/* Backend Performance Tab */}
        <TabsContent value="backend" className="space-y-6">
          {backendMetrics && (
            <>
              {/* Backend Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Request Performance */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Request Performance</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Requests:</span>
                        <span className="font-medium">{backendMetrics.requests.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Duration:</span>
                        <span className="font-medium">{backendMetrics.requests.avgDuration}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Requests/min:</span>
                        <span className="font-medium">{backendMetrics.requests.requestsPerMinute}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Error Rate:</span>
                        <Badge 
                          variant={parseFloat(backendMetrics.requests.errorRate) > 5 ? 'destructive' : 'default'}
                        >
                          {backendMetrics.requests.errorRate}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Database Performance */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Database Performance</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Queries:</span>
                        <span className="font-medium">{backendMetrics.database.totalQueries.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Query Time:</span>
                        <span className="font-medium">{backendMetrics.database.avgQueryTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Slow Queries:</span>
                        <span className="font-medium">{backendMetrics.database.slowQueries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Slow Rate:</span>
                        <Badge 
                          variant={parseFloat(backendMetrics.database.slowQueryRate) > 10 ? 'destructive' : 'default'}
                        >
                          {backendMetrics.database.slowQueryRate}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Memory Usage */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Heap Used:</span>
                        <span className="font-medium">{backendMetrics.memory.heapUsed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Heap Total:</span>
                        <span className="font-medium">{backendMetrics.memory.heapTotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Usage:</span>
                        <Badge 
                          variant={parseFloat(backendMetrics.memory.usagePercent) > 80 ? 'destructive' : 'default'}
                        >
                          {backendMetrics.memory.usagePercent}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">RSS:</span>
                        <span className="font-medium">{backendMetrics.memory.rss}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Endpoints</CardTitle>
                  <CardDescription>Most frequently used API endpoints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {backendMetrics.topEndpoints.slice(0, 5).map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{endpoint.endpoint}</p>
                          <p className="text-sm text-muted-foreground">
                            {endpoint.count} requests • Avg: {endpoint.avgDuration}ms
                          </p>
                        </div>
                        <Badge variant="outline">
                          Max: {endpoint.maxDuration}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Frontend Performance Tab */}
        <TabsContent value="frontend" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Render Performance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Render Performance</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Render Time:</span>
                    <span className="font-medium">{frontendStats.renderPerformance.avgRenderTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">95th Percentile:</span>
                    <span className="font-medium">{frontendStats.renderPerformance.p95RenderTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Slow Renders:</span>
                    <span className="font-medium">{frontendStats.renderPerformance.slowRenders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Slow Rate:</span>
                    <Badge 
                      variant={frontendStats.renderPerformance.slowRenderRate > 10 ? 'destructive' : 'default'}
                    >
                      {frontendStats.renderPerformance.slowRenderRate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Web Vitals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Web Vitals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LCP:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {frontendStats.webVitals.lcp ? `${frontendStats.webVitals.lcp}ms` : 'N/A'}
                      </span>
                      {frontendStats.webVitals.lcp && (
                        <div className={`w-2 h-2 rounded-full ${getVitalsStatus('lcp', frontendStats.webVitals.lcp).color}`} />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">FID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {frontendStats.webVitals.fid ? `${frontendStats.webVitals.fid}ms` : 'N/A'}
                      </span>
                      {frontendStats.webVitals.fid && (
                        <div className={`w-2 h-2 rounded-full ${getVitalsStatus('fid', frontendStats.webVitals.fid).color}`} />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CLS:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {frontendStats.webVitals.cls ? frontendStats.webVitals.cls.toFixed(3) : 'N/A'}
                      </span>
                      {frontendStats.webVitals.cls && (
                        <div className={`w-2 h-2 rounded-full ${getVitalsStatus('cls', frontendStats.webVitals.cls).color}`} />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Browser Memory</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {frontendStats.memoryUsage ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current Usage:</span>
                      <span className="font-medium">{frontendStats.memoryUsage.current}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average:</span>
                      <span className="font-medium">{frontendStats.memoryUsage.avg}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Trend:</span>
                      <Badge 
                        variant={
                          frontendStats.memoryUsage.trend === 'increasing' ? 'destructive' : 
                          frontendStats.memoryUsage.trend === 'decreasing' ? 'default' : 'outline'
                        }
                      >
                        {frontendStats.memoryUsage.trend}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Memory API not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Performance Alerts</h3>
            <Button variant="outline" size="sm" onClick={clearAlerts}>
              Clear Alerts
            </Button>
          </div>

          {/* Frontend Alerts */}
          {frontendAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Frontend Alerts ({frontendAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {frontendAlerts.map((alert, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex justify-between">
                        <span>{alert.message}</span>
                        <span className="text-sm text-muted-foreground">
                          {timeAgo(alert.timestamp)}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Backend Alerts */}
          {backendMetrics?.recentAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Backend Alerts ({backendMetrics.recentAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backendMetrics.recentAlerts.slice(0, 10).map((alert, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex justify-between">
                        <span>{alert.type.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-muted-foreground">
                          {timeAgo(alert.timestamp)}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {frontendAlerts.length === 0 && (!backendMetrics?.recentAlerts.length || backendMetrics.recentAlerts.length === 0) && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">System is performing well!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;