import { Copy, ExternalLink, Lock, ChevronRight, Zap } from 'lucide-react';
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

export default function ApiList({ apis, selectedId, onSelect, onCopy }) {
  if (!apis.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
        No endpoints match your filters.
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {apis.map((api) => {
          const isSelected = selectedId === api.id;
          const status = api.response?.status;
          return (
            <button
              key={api.id}
              onClick={() => onSelect(api.id)}
              className={`w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 group ${
                isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Method badge */}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${METHOD_COLORS[api.method] || 'method-get'}`}>
                  {api.method}
                </span>

                {/* URL */}
                <span className="text-xs font-mono truncate flex-1 text-foreground/80">
                  {truncateUrl(api.url)}
                </span>

                {/* Icons */}
                {api.authentication && (
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" title="Authenticated" />
                )}
                {api.graphql && (
                  <Zap className="w-3 h-3 text-purple-400 shrink-0" title="GraphQL" />
                )}

                {/* Status */}
                {status && (
                  <span className={`text-[11px] font-semibold shrink-0 ${statusClass(status)}`}>
                    {status}
                  </span>
                )}

                {/* Response time */}
                {api.response?.responseTime && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
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

              {/* Explanation snippet */}
              {api.explanations?.[0] && (
                <p className="text-[11px] text-muted-foreground mt-1 truncate pl-11">{api.explanations[0]}</p>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
