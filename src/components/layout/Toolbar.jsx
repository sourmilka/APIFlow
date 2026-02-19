import { Search, Download, RotateCcw, Settings2, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Toolbar({
  searchQuery, onSearchChange, totalApis, filterMethod, onFilterMethod, onExport, onRescan, onShowShortcuts,
}) {
  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm">
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
      <div className="flex items-center gap-1">
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

      <div className="flex-1" />

      {/* Stats */}
      <Badge variant="secondary" className="text-[11px] gap-1">
        {totalApis} endpoint{totalApis !== 1 ? 's' : ''}
      </Badge>

      {/* Actions */}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRescan} title="Rescan (Ctrl+R)">
        <RotateCcw className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExport} title="Export JSON (Ctrl+E)">
        <Download className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onShowShortcuts} title="Shortcuts">
        <Keyboard className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
