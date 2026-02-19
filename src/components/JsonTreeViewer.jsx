import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';

function JsonValue({ value, depth = 0, path = '', onCopy }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) return <span className="text-red-400 font-mono text-[11px]">null</span>;
  if (value === undefined) return <span className="text-muted-foreground font-mono text-[11px]">undefined</span>;
  if (typeof value === 'boolean') return <span className="text-amber-400 font-mono text-[11px]">{value.toString()}</span>;
  if (typeof value === 'number') return <span className="text-blue-400 font-mono text-[11px]">{value}</span>;
  if (typeof value === 'string') {
    if (value.length > 200) {
      return (
        <span className="text-emerald-400 font-mono text-[11px]">
          "{value.substring(0, 200)}..."
          <span className="text-muted-foreground ml-1">({value.length} chars)</span>
        </span>
      );
    }
    return <span className="text-emerald-400 font-mono text-[11px]">"{value}"</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground font-mono text-[11px]">[]</span>;
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-[10px] font-mono text-muted-foreground">Array[{value.length}]</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-border/50 pl-2 space-y-0.5">
            {value.slice(0, 50).map((item, i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-4 text-right">{i}:</span>
                <JsonValue value={item} depth={depth + 1} path={`${path}[${i}]`} onCopy={onCopy} />
              </div>
            ))}
            {value.length > 50 && <div className="text-[10px] text-muted-foreground italic">...{value.length - 50} more items</div>}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return <span className="text-muted-foreground font-mono text-[11px]">{'{}'}</span>;
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-[10px] font-mono text-muted-foreground">{'{'}{keys.length} keys{'}'}</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-border/50 pl-2 space-y-0.5">
            {keys.slice(0, 100).map(key => (
              <div key={key} className="flex items-start gap-1">
                <span className="text-[10px] text-purple-400/80 font-mono shrink-0 mt-0.5">"{key}":</span>
                <JsonValue value={value[key]} depth={depth + 1} path={`${path}.${key}`} onCopy={onCopy} />
              </div>
            ))}
            {keys.length > 100 && <div className="text-[10px] text-muted-foreground italic">...{keys.length - 100} more keys</div>}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-foreground/70 font-mono text-[11px]">{String(value)}</span>;
}

export default function JsonTreeViewer({ data, onCopy }) {
  const handleCopyAll = useCallback(() => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    onCopy?.(text);
  }, [data, onCopy]);

  if (!data) return <p className="text-xs text-muted-foreground py-2">No data</p>;

  let parsed = data;
  if (typeof data === 'string') {
    try { parsed = JSON.parse(data); } catch { return <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-all">{data.substring(0, 5000)}</pre>; }
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopyAll}
        className="absolute top-0 right-0 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Copy JSON"
      >
        <Copy className="w-3 h-3 text-muted-foreground" />
      </button>
      <div className="bg-background rounded-md p-2 border border-border overflow-auto max-h-80">
        <JsonValue value={parsed} onCopy={onCopy} />
      </div>
    </div>
  );
}
