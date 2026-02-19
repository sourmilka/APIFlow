import { Activity, Shield, Clock, Zap, Globe } from 'lucide-react';

export default function StatsBar({ apis, url, duration }) {
  const methods = {};
  let authCount = 0;
  let graphqlCount = 0;
  let avgResponseTime = 0;
  let totalTime = 0;
  let timeCount = 0;

  apis.forEach((a) => {
    methods[a.method] = (methods[a.method] || 0) + 1;
    if (a.authentication) authCount++;
    if (a.graphql) graphqlCount++;
    if (a.response?.responseTime) {
      totalTime += a.response.responseTime;
      timeCount++;
    }
  });
  if (timeCount) avgResponseTime = Math.round(totalTime / timeCount);

  let hostname = url;
  try { hostname = new URL(url).hostname; } catch {}

  const stats = [
    { icon: Globe, label: hostname, value: null, color: 'text-foreground' },
    { icon: Activity, label: 'Endpoints', value: apis.length, color: 'text-emerald-400' },
    { icon: Shield, label: 'Authenticated', value: authCount, color: 'text-amber-400' },
    { icon: Zap, label: 'GraphQL', value: graphqlCount, color: 'text-purple-400' },
    { icon: Clock, label: 'Avg Response', value: avgResponseTime ? `${avgResponseTime}ms` : '-', color: 'text-blue-400' },
  ];
  if (duration) {
    stats.push({ icon: Clock, label: 'Scan Time', value: `${(duration / 1000).toFixed(1)}s`, color: 'text-muted-foreground' });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card/30 overflow-x-auto">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0">
          <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
          <span className="text-[11px] text-muted-foreground">{s.label}</span>
          {s.value !== null && (
            <span className={`text-[11px] font-semibold ${s.color}`}>{s.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
