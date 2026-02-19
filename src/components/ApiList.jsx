import { useState, useMemo } from 'react';
import { Copy, ExternalLink, Lock, ChevronRight, Zap, Star, AlertCircle, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { METHOD_COLORS, statusClass } from '@/constants/brand';

function truncateUrl(url, max = 70) {
  if (url.length <= max) return url;
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    if (path.length > max - 20) return u.hostname + path.substring(0, max - 20) + '...';
    return url.substring(0, max) + '...';
  } catch { return url.substring(0, max) + '...'; }
}

function SizeBar({ size }) {
  if (!size || size === 'unknown') return null;
  const bytes = parseInt(size);
  if (isNaN(bytes) || bytes === 0) return null;
  const kb = bytes / 1024;
  const width = Math.min(Math.max(kb / 100 * 100, 5), 100); // 0-100KB maps to 5-100%
  const color = kb > 500 ? 'bg-red-500/60' : kb > 100 ? 'bg-amber-500/60' : 'bg-emerald-500/60';
  return (
    <div className="w-10 h-1.5 bg-muted/30 rounded-full overflow-hidden shrink-0" title={`${kb >= 1 ? kb.toFixed(1) + ' KB' : bytes + ' B'}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function ApiList({ apis, selectedId, onSelect, onCopy, pinnedIds = [], onPin, groupByHost }) {
  // Duplicate detection
  const duplicates = useMemo(() => {
    const counts = {};
    apis.forEach(a => {
      try {
        const key = new URL(a.url).pathname;
        counts[key] = (counts[key] || 0) + 1;
      } catch {}
    });
    return counts;
  }, [apis]);

  if (!apis.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
        No endpoints match your filters.
      </div>
    );
  }

  // Group by host if toggled
  if (groupByHost) {
    const groups = {};
    apis.forEach(api => {
      const host = api.hostname || (() => { try { return new URL(api.url).hostname; } catch { return 'unknown'; } })();
      if (!groups[host]) groups[host] = [];
      groups[host].push(api);
    });

    return (
      <ScrollArea className="flex-1">
        {Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([host, hostApis]) => (
          <div key={host}>
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5 bg-muted/50 border-b border-border backdrop-blur-sm">
              <Globe className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-medium text-foreground">{host}</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0">{hostApis.length}</Badge>
            </div>
            <div className="divide-y divide-border">
              {hostApis.map(api => renderApiRow(api, selectedId, onSelect, onCopy, pinnedIds, onPin, duplicates))}
            </div>
          </div>
        ))}
      </ScrollArea>
    );
  }

  // Sort: pinned first
  const sorted = pinnedIds.length > 0
    ? [...apis].sort((a, b) => {
        const aP = pinnedIds.includes(a.id) ? 0 : 1;
        const bP = pinnedIds.includes(b.id) ? 0 : 1;
        return aP - bP;
      })
    : apis;

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {sorted.map((api) => renderApiRow(api, selectedId, onSelect, onCopy, pinnedIds, onPin, duplicates))}
      </div>
    </ScrollArea>
  );
}

function renderApiRow(api, selectedId, onSelect, onCopy, pinnedIds, onPin, duplicates) {
  const isSelected = selectedId === api.id;
  const isPinned = pinnedIds.includes(api.id);
  const status = api.response?.status;
  let dupCount = 0;
  try { dupCount = duplicates[new URL(api.url).pathname]; } catch {}

  return (
    <button
      key={api.id}
      onClick={() => onSelect(api.id)}
      className={`w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 group ${
        isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : isPinned ? 'bg-amber-500/5 border-l-2 border-l-amber-500/40' : 'border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Pin */}
        {onPin && (
          <button
            onClick={(e) => { e.stopPropagation(); onPin(api.id); }}
            className={`shrink-0 p-0.5 rounded transition-colors ${isPinned ? 'text-amber-400' : 'text-transparent group-hover:text-muted-foreground/40 hover:text-amber-400'}`}
            title={isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Star className={`w-3 h-3 ${isPinned ? 'fill-amber-400' : ''}`} />
          </button>
        )}

        {/* Method badge */}
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${METHOD_COLORS[api.method] || 'method-get'}`}>
          {api.method}
        </span>

        {/* URL */}
        <span className="text-xs font-mono truncate flex-1 text-foreground/80">
          {truncateUrl(api.url)}
        </span>

        {/* Duplicate badge */}
        {dupCount > 1 && (
          <Badge variant="secondary" className="text-[9px] px-1 py-0 text-orange-400 border-orange-500/30 gap-0.5">
            <AlertCircle className="w-2 h-2" /> ×{dupCount}
          </Badge>
        )}

        {/* Icons */}
        {api.authentication && (
          <Lock className="w-3 h-3 text-amber-400 shrink-0" title="Authenticated" />
        )}
        {api.graphql && (
          <Zap className="w-3 h-3 text-purple-400 shrink-0" title="GraphQL" />
        )}

        {/* Size bar */}
        <SizeBar size={api.response?.size} />

        {/* Status */}
        {status && (
          <span className={`text-[11px] font-semibold shrink-0 ${statusClass(status)}`}>
            {status}
          </span>
        )}

        {/* Response time */}
        {api.response?.responseTime && (
          <span className={`text-[10px] shrink-0 ${api.response.responseTime > 1000 ? 'text-amber-400 font-semibold' : 'text-muted-foreground'}`}>
            {api.response.responseTime}ms
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(api.url); }}
            className="p-1 rounded hover:bg-muted"
            title="Copy URL"
          >
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
          <a
            href={api.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-muted"
            title="Open in browser"
          >
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>

        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${isSelected ? 'rotate-90' : ''}`} />
      </div>

      {/* Explanation snippet + inline preview */}
      <div className="pl-7 mt-1">
        {api.explanations?.[0] && (
          <p className="text-[11px] text-muted-foreground truncate">{api.explanations[0]}</p>
        )}
        {api.response?.data && typeof api.response.data === 'object' && (
          <p className="text-[10px] text-foreground/40 font-mono truncate mt-0.5">
            {JSON.stringify(api.response.data).substring(0, 80)}...
          </p>
        )}
      </div>
    </button>
  );
}
