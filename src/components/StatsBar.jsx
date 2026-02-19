import { Activity, Shield, Clock, Zap, Globe, Radio, Podcast, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StatsBar({ apis, webSockets, sse, url, duration, pageInfo }) {
  const methods = {};
  const statusGroups = {};
  let authCount = 0;
  let graphqlCount = 0;
  let avgResponseTime = 0;
  let totalTime = 0;
  let timeCount = 0;

  (apis || []).forEach((a) => {
    methods[a.method] = (methods[a.method] || 0) + 1;
    if (a.authentication) authCount++;
    if (a.graphql) graphqlCount++;
    if (a.response?.responseTime) {
      totalTime += a.response.responseTime;
      timeCount++;
    }
    if (a.response?.status) {
      const group = `${Math.floor(a.response.status / 100)}xx`;
      statusGroups[group] = (statusGroups[group] || 0) + 1;
    }
  });
  if (timeCount) avgResponseTime = Math.round(totalTime / timeCount);

  let hostname = url;
  try { hostname = new URL(url).hostname; } catch {}
  const wsCount = webSockets?.length || 0;
  const sseCount = sse?.length || 0;

  const stats = [
    { icon: Globe, label: hostname, value: null, color: 'text-foreground', title: pageInfo?.title || url },
    { icon: Activity, label: 'APIs', value: apis?.length || 0, color: 'text-emerald-400' },
    { icon: Shield, label: 'Auth', value: authCount, color: 'text-amber-400' },
    { icon: Zap, label: 'GraphQL', value: graphqlCount, color: 'text-purple-400' },
  ];

  if (wsCount > 0) stats.push({ icon: Radio, label: 'WebSockets', value: wsCount, color: 'text-cyan-400' });
  if (sseCount > 0) stats.push({ icon: Podcast, label: 'SSE', value: sseCount, color: 'text-violet-400' });

  stats.push({ icon: Clock, label: 'Avg', value: avgResponseTime ? `${avgResponseTime}ms` : '-', color: 'text-blue-400' });

  if (duration) {
    stats.push({ icon: Clock, label: 'Scan', value: `${(duration / 1000).toFixed(1)}s`, color: 'text-muted-foreground' });
  }

  // Status distribution badges
  const statusBadges = Object.entries(statusGroups).sort();

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/30 overflow-x-auto">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0" title={s.title || ''}>
          <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
          <span className="text-[11px] text-muted-foreground">{s.label}</span>
          {s.value !== null && (
            <span className={`text-[11px] font-semibold ${s.color}`}>{s.value}</span>
          )}
        </div>
      ))}

      {/* Status distribution mini badges */}
      {statusBadges.length > 0 && (
        <>
          <div className="w-px h-4 bg-border mx-1" />
          {statusBadges.map(([group, count]) => (
            <Badge key={group} variant="secondary" className={`text-[10px] shrink-0 ${
              group === '2xx' ? 'text-emerald-400 border-emerald-500/20' :
              group === '3xx' ? 'text-blue-400 border-blue-500/20' :
              group === '4xx' ? 'text-amber-400 border-amber-500/20' :
              'text-red-400 border-red-500/20'
            }`}>
              {group}: {count}
            </Badge>
          ))}
        </>
      )}
    </div>
  );
}
