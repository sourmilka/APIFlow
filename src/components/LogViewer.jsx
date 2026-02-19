import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal, Trash2, Filter } from 'lucide-react';
import { logger } from '@/utils/logger';

const LEVEL_COLORS = {
  debug: 'text-muted-foreground',
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
};

const LEVEL_BG = {
  debug: 'bg-muted/30',
  info: 'bg-blue-500/5',
  warn: 'bg-amber-500/5',
  error: 'bg-red-500/5',
};

export default function LogViewer({ serverLogs = [] }) {
  const [logs, setLogs] = useState(logger.getLogs());
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    return logger.subscribe(() => setLogs([...logger.getLogs()]));
  }, []);

  // Merge frontend and server logs
  const allLogs = [
    ...logs.map(l => ({ ...l, source: 'client' })),
    ...serverLogs.map(l => ({ ...l, id: l.time + Math.random(), source: 'server', timestamp: new Date().toISOString() }))
  ];

  const filtered = filter ? allLogs.filter(l => l.level === filter) : allLogs;
  const stats = logger.getStats();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">Debug Logs</span>
        <div className="flex-1" />

        {/* Level filter pills */}
        <div className="flex gap-1">
          {['debug', 'info', 'warn', 'error'].map(level => (
            <button
              key={level}
              onClick={() => setFilter(filter === level ? null : level)}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded border transition-colors ${
                filter === level ? 'bg-primary/15 text-primary border-primary/30' : `${LEVEL_COLORS[level]} border-transparent hover:bg-accent`
              }`}
            >
              {level} ({level === 'debug' ? stats.debug : level === 'info' ? stats.info : level === 'warn' ? stats.warn : stats.error})
            </button>
          ))}
        </div>

        <button onClick={() => logger.clear()} className="p-1 rounded hover:bg-muted" title="Clear logs">
          <Trash2 className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5 font-mono text-[11px]">
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-xs">No logs yet</div>
          )}
          {filtered.map(log => (
            <div key={log.id} className={`flex items-start gap-2 px-2 py-1 rounded ${LEVEL_BG[log.level] || ''}`}>
              <span className={`shrink-0 font-bold uppercase text-[9px] ${LEVEL_COLORS[log.level]}`}>
                [{log.level}]
              </span>
              {log.source === 'server' && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0">SRV</Badge>
              )}
              <span className="text-foreground/90 flex-1 break-all">
                {log.msg || log.message}
              </span>
              {log.data && (
                <span className="text-muted-foreground shrink-0 max-w-[200px] truncate" title={JSON.stringify(log.data)}>
                  {typeof log.data === 'string' ? log.data : JSON.stringify(log.data).substring(0, 80)}
                </span>
              )}
              <span className="text-muted-foreground/60 shrink-0 text-[9px]">
                {log.time !== undefined ? `${log.time}ms` : ''}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
