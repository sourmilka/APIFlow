import { TrendingUp, Activity, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function Statistics({ apis }) {
  if (!apis || apis.length === 0) return null;

  // Calculate stats
  const total = apis.length;
  const successCount = apis.filter(api => 
    api.response?.status >= 200 && api.response?.status < 300
  ).length;
  const failedCount = apis.filter(api => 
    api.response?.status >= 400
  ).length;
  const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : 0;
  
  const avgTime = apis.length > 0
    ? Math.round(apis.reduce((sum, api) => sum + (api.response?.time || 0), 0) / apis.length)
    : 0;

  const totalSize = apis.reduce((sum, api) => sum + (api.response?.size || 0), 0);
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  // Method breakdown
  const methods = apis.reduce((acc, api) => {
    acc[api.method] = (acc[api.method] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {/* Total APIs */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase">Total</span>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{total}</div>
        <div className="flex gap-1.5 mt-2">
          {Object.entries(methods).map(([method, count]) => (
            <Badge key={method} variant="outline" className="text-xs px-1.5">
              {method} {count}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Success Rate */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase">Success</span>
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-primary">{successRate}%</div>
        <div className="text-xs text-muted-foreground mt-2">
          {successCount} passed • {failedCount} failed
        </div>
      </Card>

      {/* Avg Response Time */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase">Avg Time</span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{avgTime}ms</div>
        <div className="text-xs text-muted-foreground mt-2">
          Per request
        </div>
      </Card>

      {/* Data Transfer */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase">Data</span>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
        <div className="text-xs text-muted-foreground mt-2">
          Total transferred
        </div>
      </Card>
    </div>
  );
}

export default Statistics;
