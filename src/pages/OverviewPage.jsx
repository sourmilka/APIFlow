import { 
  TrendingUp, 
  Activity, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  Database,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

function OverviewPage({ apis = [], websockets = [] }) {
  // Calculate statistics
  const totalApis = apis.length;
  const successfulApis = apis.filter(api => 
    api.response?.status >= 200 && api.response?.status < 300
  ).length;
  const failedApis = apis.filter(api => 
    api.response?.status >= 400
  ).length;
  const successRate = totalApis > 0 ? (successfulApis / totalApis) * 100 : 0;
  
  const avgResponseTime = apis.length > 0
    ? Math.round(apis.reduce((sum, api) => sum + (api.response?.time || 0), 0) / apis.length)
    : 0;
  
  const totalDataTransferred = apis.reduce((sum, api) => 
    sum + (api.response?.size || 0), 0
  );
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  // Get method breakdown
  const methodCounts = apis.reduce((acc, api) => {
    acc[api.method] = (acc[api.method] || 0) + 1;
    return acc;
  }, {});

  // Recent activity (last 5 APIs)
  const recentActivity = apis.slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Overview Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time API monitoring and analytics
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total APIs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApis}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {successfulApis} successful, {failedApis} failed
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average request time
            </p>
          </CardContent>
        </Card>

        {/* Data Transferred */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Transfer</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalDataTransferred)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total transferred
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(methodCounts).map(([method, count]) => {
                const percentage = (count / totalApis) * 100;
                const colors = {
                  GET: 'bg-blue-500',
                  POST: 'bg-green-500',
                  PUT: 'bg-primary-500',
                  DELETE: 'bg-red-500',
                  PATCH: 'bg-purple-500',
                };
                
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {method}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{count} requests</span>
                      </div>
                      <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[method] || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((api, index) => {
                  const statusColor = 
                    api.response?.status >= 200 && api.response?.status < 300
                      ? 'text-green-500'
                      : api.response?.status >= 400
                        ? 'text-red-500'
                        : 'text-primary-600';
                  
                  return (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`mt-0.5 ${statusColor}`}>
                        {api.response?.status >= 200 && api.response?.status < 300 ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : api.response?.status >= 400 ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {api.method}
                          </Badge>
                          <span className={`text-xs font-medium ${statusColor}`}>
                            {api.response?.status || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm truncate font-mono">
                          {new URL(api.url).pathname}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {api.response?.time ? `${Math.round(api.response.time)}ms` : 'N/A'} • {new Date(api.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Connections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Connections</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              {websockets.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {websockets.length > 0 ? (
            <div className="space-y-2">
              {websockets.slice(0, 5).map((ws, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md border">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-mono truncate">{ws.url || ws.id}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No active WebSocket connections
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OverviewPage;
