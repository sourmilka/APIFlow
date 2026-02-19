import { History, Plus, Globe, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BRAND } from '@/constants/brand';

export default function Sidebar({ sessions, activeSessionId, collapsed, onToggle, onSelect, onNew, onDelete }) {
  return (
    <aside className={`h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ${collapsed ? 'w-[52px]' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border min-h-[52px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">{BRAND.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{BRAND.version}</span>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onToggle}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* New Scan button */}
      <div className="p-2">
        <Button
          className={`w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground ${collapsed ? 'px-0 justify-center' : ''}`}
          size="sm"
          onClick={onNew}
        >
          <Plus className="w-4 h-4" />
          {!collapsed && 'New Scan'}
        </Button>
      </div>

      <Separator />

      {/* Session list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <History className="w-3 h-3" />
              History ({sessions.length})
            </div>
          )}
          {sessions.length === 0 && !collapsed && (
            <div className="px-2 py-4 text-xs text-muted-foreground text-center">
              No scans yet. Click "New Scan" to start.
            </div>
          )}
          {sessions.map((s) => (
            <button
              key={s.sessionId}
              onClick={() => onSelect(s.sessionId)}
              className={`w-full text-left rounded-md transition-colors group ${
                activeSessionId === s.sessionId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent text-foreground'
              } ${collapsed ? 'p-2 flex justify-center' : 'px-2 py-1.5'}`}
              title={s.url}
            >
              {collapsed ? (
                <Globe className="w-4 h-4" />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">
                      {(() => { try { return new URL(s.url).hostname; } catch { return s.url; } })()}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(s.timestamp).toLocaleDateString()}
                      <span className="ml-auto font-medium">{s.totalApis} APIs</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(s.sessionId); }}
                    className="opacity-0 group-hover:opacity-100 ml-1 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-2 border-t border-border">
          <div className="text-[10px] text-muted-foreground text-center">
            {BRAND.name} {BRAND.version}
          </div>
        </div>
      )}
    </aside>
  );
}
