import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-16 text-muted-foreground shrink-0 text-right">{label}</span>
      <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
        <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 font-medium text-right">{value}</span>
    </div>
  );
}

function PieSegment({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (total === 0) return null;
  let offset = 0;
  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const r = 20;
          const circ = 2 * Math.PI * r;
          const dash = (pct / 100) * circ;
          const off = (offset / 100) * circ;
          offset += pct;
          return (
            <circle key={i} cx="24" cy="24" r={r} fill="none" strokeWidth="6"
              className={seg.color} strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-off} transform="rotate(-90 24 24)" />
          );
        })}
      </svg>
      <div className="space-y-0.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]">
            <div className={`w-2 h-2 rounded-full ${seg.dotColor}`} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ analytics, apis }) {
  if (!analytics) return null;

  const methodColors = {
    GET: 'bg-emerald-500', POST: 'bg-blue-500', PUT: 'bg-amber-500',
    PATCH: 'bg-orange-500', DELETE: 'bg-red-500', OPTIONS: 'bg-purple-500'
  };

  const statusColors = {
    '2xx': 'bg-emerald-500', '3xx': 'bg-blue-500',
    '4xx': 'bg-amber-500', '5xx': 'bg-red-500'
  };

  const maxMethodCount = Math.max(...Object.values(analytics.methodDistribution || {}), 1);
  const maxStatusCount = Math.max(...Object.values(analytics.statusDistribution || {}), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">Scan Analytics</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'APIs', value: analytics.totalApis, color: 'text-emerald-400' },
          { label: 'WebSockets', value: analytics.totalWebSockets, color: 'text-cyan-400' },
          { label: 'SSE', value: analytics.totalSSE, color: 'text-purple-400' },
          { label: 'Auth', value: analytics.authenticatedCount, color: 'text-amber-400' },
          { label: 'GraphQL', value: analytics.graphqlCount, color: 'text-violet-400' },
          { label: 'Avg Time', value: analytics.avgResponseTime ? `${analytics.avgResponseTime}ms` : '-', color: 'text-blue-400' },
        ].map((item, i) => (
          <div key={i} className="bg-muted/20 rounded-lg p-2 text-center">
            <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
            <div className="text-[10px] text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Method distribution */}
      {Object.keys(analytics.methodDistribution || {}).length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Methods</div>
          <div className="space-y-1">
            {Object.entries(analytics.methodDistribution).map(([method, count]) => (
              <Bar key={method} label={method} value={count} max={maxMethodCount} color={methodColors[method] || 'bg-gray-500'} />
            ))}
          </div>
        </div>
      )}

      {/* Status distribution */}
      {Object.keys(analytics.statusDistribution || {}).length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Status Codes</div>
          <div className="space-y-1">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => (
              <Bar key={status} label={status} value={count} max={maxStatusCount} color={statusColors[status] || 'bg-gray-500'} />
            ))}
          </div>
        </div>
      )}

      {/* Category distribution */}
      {Object.keys(analytics.categoryDistribution || {}).length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Categories</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(analytics.categoryDistribution).map(([cat, count]) => (
              <Badge key={cat} variant="secondary" className="text-[10px]">{cat}: {count}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Host distribution */}
      {Object.keys(analytics.hostDistribution || {}).length > 1 && (
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Hosts</div>
          <div className="space-y-1">
            {Object.entries(analytics.hostDistribution).map(([host, count]) => (
              <div key={host} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-foreground/70 truncate flex-1">{host}</span>
                <Badge variant="secondary" className="text-[10px]">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slowest APIs */}
      {analytics.slowestApis?.length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-2">Slowest Endpoints</div>
          <div className="space-y-1">
            {analytics.slowestApis.map((api, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="text-red-400 font-medium shrink-0">{api.responseTime}ms</span>
                <span className="text-[10px] font-bold px-1 rounded border bg-muted/30 shrink-0">{api.method}</span>
                <span className="font-mono text-foreground/70 truncate">{api.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
