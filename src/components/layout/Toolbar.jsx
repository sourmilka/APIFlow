import { Search, RotateCcw, Keyboard, Radio, Activity, BarChart3, Shield, Terminal, SortAsc, SortDesc, ClipboardList, Layers, Share2, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ExportMenu from '@/components/ExportMenu';

export default function Toolbar({
  searchQuery, onSearchChange, totalApis, filterMethod, onFilterMethod,
  onExport, onRescan, onShowShortcuts, session,
  activeTab, onTabChange, wsCount, sseCount,
  sortBy, onSortChange, filterStatus, onFilterStatus,
  onShowAnalytics, onShowSecurity, onShowLogs,
  onCopyAll, groupByHost, onToggleGroupByHost,
  onShowWaterfall, onShowCookies, onShareSession,
}) {
  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const statusFilters = ['ALL', '2xx', '3xx', '4xx', '5xx'];

  return (
    <div className="flex flex-col border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Tab bar — APIs / WebSockets / SSE */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/50">
        <button
          onClick={() => onTabChange?.('apis')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            (!activeTab || activeTab === 'apis') ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-accent border border-transparent'
          }`}
        >
          <Activity className="w-3 h-3" />
          APIs
          <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">{totalApis}</Badge>
        </button>

        {wsCount > 0 && (
          <button
            onClick={() => onTabChange?.('websockets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'websockets' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:bg-accent border border-transparent'
            }`}
          >
            <Radio className="w-3 h-3" />
            WebSockets
            <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">{wsCount}</Badge>
          </button>
        )}

        {sseCount > 0 && (
          <button
            onClick={() => onTabChange?.('sse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'sse' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'text-muted-foreground hover:bg-accent border border-transparent'
            }`}
          >
            SSE
            <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">{sseCount}</Badge>
          </button>
        )}

        <div className="flex-1" />

        {/* Utility buttons */}
        <button
          onClick={onShowAnalytics}
          className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors`}
          title="Analytics"
        >
          <BarChart3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onShowWaterfall}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Request Waterfall"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onShowSecurity}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Security Analysis"
        >
          <Shield className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onShowCookies}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Page Cookies"
        >
          <Cookie className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onShowLogs}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Debug Logs"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={onShareSession}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Share Session"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter bar */}
      {(!activeTab || activeTab === 'apis') && (
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter endpoints..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          {/* Method filter pills */}
          <div className="flex items-center gap-0.5">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => onFilterMethod(m === 'ALL' ? '' : m)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                  (m === 'ALL' && !filterMethod) || filterMethod === m
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'text-muted-foreground border-transparent hover:bg-accent'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-0.5">
            {statusFilters.map(s => (
              <button
                key={s}
                onClick={() => onFilterStatus?.(s === 'ALL' ? '' : s)}
                className={`px-1.5 py-1 text-[10px] font-medium rounded border transition-colors ${
                  (s === 'ALL' && !filterStatus) || filterStatus === s
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'text-muted-foreground border-transparent hover:bg-accent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => {
              const sorts = ['', 'time-asc', 'time-desc', 'url', 'status'];
              const idx = sorts.indexOf(sortBy || '');
              onSortChange?.(sorts[(idx + 1) % sorts.length]);
            }}
            className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
            title={`Sort: ${sortBy || 'default'}`}
          >
            {sortBy?.includes('desc') ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />}
            {sortBy ? sortBy.replace('-', ' ') : 'Sort'}
          </button>

          <div className="flex-1" />

          {/* Extra actions */}
          <button
            onClick={onToggleGroupByHost}
            className={`flex items-center gap-1 px-1.5 py-1 text-[10px] rounded border transition-colors ${
              groupByHost ? 'bg-primary/15 text-primary border-primary/30' : 'text-muted-foreground border-transparent hover:bg-accent'
            }`}
            title="Group by Host"
          >
            <Layers className="w-3 h-3" />
            Group
          </button>
          <button
            onClick={onCopyAll}
            className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
            title="Copy all endpoint URLs"
          >
            <ClipboardList className="w-3 h-3" />
            Copy All
          </button>

          {/* Actions */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRescan} title="Rescan (Ctrl+R)">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <ExportMenu session={session} onExport={onExport} />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onShowShortcuts} title="Shortcuts">
            <Keyboard className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
