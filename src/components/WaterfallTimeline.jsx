import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle } from 'lucide-react';
import { METHOD_COLORS } from '@/constants/brand';

export default function WaterfallTimeline({ apis }) {
  if (!apis || apis.length === 0) return null;

  // Calculate time boundaries
  const timestamps = apis.map(a => new Date(a.timestamp).getTime()).filter(t => !isNaN(t));
  if (timestamps.length === 0) return <p className="text-xs text-muted-foreground p-4">No timing data available</p>;

  const minTime = Math.min(...timestamps);
  const maxEnd = Math.max(...apis.map(a => {
    const start = new Date(a.timestamp).getTime();
    return start + (a.response?.responseTime || 100);
  }));
  const totalDuration = maxEnd - minTime || 1;

  // Sort by timestamp
  const sorted = [...apis].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const methodBarColors = {
    GET: 'bg-emerald-500',
    POST: 'bg-blue-500',
    PUT: 'bg-amber-500',
    PATCH: 'bg-purple-500',
    DELETE: 'bg-red-500',
    OPTIONS: 'bg-gray-500',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">Request Waterfall</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">{apis.length} requests</Badge>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3">
        {Object.entries(methodBarColors).map(([method, color]) => {
          const count = sorted.filter(a => a.method === method).length;
          if (count === 0) return null;
          return (
            <div key={method} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-muted-foreground">{method} ({count})</span>
            </div>
          );
        })}
      </div>

      {/* Timeline scale */}
      <div className="flex items-center text-[9px] text-muted-foreground">
        <span>0ms</span>
        <div className="flex-1" />
        <span>{Math.round(totalDuration / 4)}ms</span>
        <div className="flex-1" />
        <span>{Math.round(totalDuration / 2)}ms</span>
        <div className="flex-1" />
        <span>{Math.round(totalDuration * 3 / 4)}ms</span>
        <div className="flex-1" />
        <span>{Math.round(totalDuration)}ms</span>
      </div>

      <ScrollArea className="max-h-96">
        <div className="space-y-0.5">
          {sorted.slice(0, 80).map((api, i) => {
            const start = new Date(api.timestamp).getTime() - minTime;
            const duration = api.response?.responseTime || 50;
            const leftPct = Math.max(0, (start / totalDuration) * 100);
            const widthPct = Math.max(0.5, (duration / totalDuration) * 100);
            const isSlow = duration > 1000;
            let pathname;
            try { pathname = new URL(api.url).pathname; } catch { pathname = api.url; }
            if (pathname.length > 40) pathname = pathname.substring(0, 40) + '...';

            return (
              <div key={api.id || i} className="flex items-center gap-2 group hover:bg-accent/30 rounded px-1 py-0.5 transition-colors">
                <span className={`text-[9px] font-bold px-1 py-0 rounded border shrink-0 ${METHOD_COLORS[api.method] || 'method-get'}`}>
                  {api.method}
                </span>
                <span className="text-[9px] font-mono text-foreground/60 truncate w-36 shrink-0" title={api.url}>
                  {pathname}
                </span>
                {/* Waterfall bar */}
                <div className="flex-1 h-4 bg-muted/20 rounded-sm relative overflow-hidden">
                  <div
                    className={`absolute top-0.5 bottom-0.5 rounded-sm transition-all ${methodBarColors[api.method] || 'bg-gray-500'} ${isSlow ? 'opacity-80' : 'opacity-60'}`}
                    style={{ left: `${leftPct}%`, width: `${Math.min(widthPct, 100 - leftPct)}%`, minWidth: '2px' }}
                  />
                </div>
                <span className={`text-[9px] shrink-0 w-12 text-right ${isSlow ? 'text-amber-400 font-semibold' : 'text-muted-foreground'}`}>
                  {duration}ms
                </span>
                {isSlow && <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border pt-2">
        <span>Total: {Math.round(totalDuration)}ms</span>
        <span>Avg: {Math.round(sorted.reduce((s, a) => s + (a.response?.responseTime || 0), 0) / sorted.length)}ms</span>
        <span>Slowest: {Math.max(...sorted.map(a => a.response?.responseTime || 0))}ms</span>
        {sorted.filter(a => (a.response?.responseTime || 0) > 1000).length > 0 && (
          <span className="text-amber-400">{sorted.filter(a => (a.response?.responseTime || 0) > 1000).length} slow (&gt;1s)</span>
        )}
      </div>
    </div>
  );
}
