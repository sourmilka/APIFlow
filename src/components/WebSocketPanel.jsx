import { Globe, ArrowUpDown, Clock, Copy, ExternalLink, ChevronRight, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeGenerator from './CodeGenerator';

function FramesList({ frames }) {
  if (!frames?.length) return <p className="text-xs text-muted-foreground py-4">No frames captured</p>;
  return (
    <div className="space-y-1 mt-2">
      {frames.map((frame, i) => (
        <div key={i} className={`flex items-start gap-2 text-[11px] p-2 rounded ${
          frame.direction === 'sent' ? 'bg-blue-500/5 border-l-2 border-blue-500/30' : 'bg-emerald-500/5 border-l-2 border-emerald-500/30'
        }`}>
          <ArrowUpDown className={`w-3 h-3 shrink-0 mt-0.5 ${frame.direction === 'sent' ? 'text-blue-400 rotate-180' : 'text-emerald-400'}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-medium ${frame.direction === 'sent' ? 'text-blue-400' : 'text-emerald-400'}`}>
                {frame.direction === 'sent' ? '↑ SENT' : '↓ RECEIVED'}
              </span>
              <span className="text-[10px] text-muted-foreground">{new Date(frame.time).toLocaleTimeString()}</span>
            </div>
            <pre className="font-mono text-[10px] text-foreground/80 whitespace-pre-wrap break-all">
              {(() => { try { return JSON.stringify(JSON.parse(frame.data), null, 2); } catch { return frame.data; } })()}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WebSocketList({ webSockets, selectedId, onSelect, onCopy }) {
  if (!webSockets?.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
        No WebSocket connections detected.
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {webSockets.map(ws => {
          const isSelected = selectedId === ws.id;
          return (
            <button
              key={ws.id}
              onClick={() => onSelect(ws.id)}
              className={`w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 group ${
                isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shrink-0">WS</span>
                <span className="text-xs font-mono truncate flex-1 text-foreground/80">{ws.url}</span>
                <Badge variant="secondary" className={`text-[10px] ${
                  ws.status === 'connected' ? 'text-emerald-400 border-emerald-500/30' :
                  ws.status === 'closed' ? 'text-red-400 border-red-500/30' :
                  'text-amber-400 border-amber-500/30'
                }`}>
                  <Radio className="w-2 h-2 mr-1" />
                  {ws.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground shrink-0">{ws.frames?.length || 0} frames</span>
                <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function WebSocketDetailPanel({ ws, onClose, onCopy }) {
  if (!ws) return null;

  return (
    <div className="w-[420px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shrink-0">WS</span>
          <Badge variant="secondary" className={`text-[10px] ${ws.status === 'connected' ? 'text-emerald-400' : ws.status === 'closed' ? 'text-red-400' : 'text-amber-400'}`}>
            {ws.status}
          </Badge>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted"><span className="text-xs">✕</span></button>
      </div>

      <div className="px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-mono break-all flex-1 text-foreground/80">{ws.url}</p>
          <button onClick={() => onCopy(ws.url)} className="p-1 rounded hover:bg-muted shrink-0" title="Copy URL">
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-border shrink-0">
        <Badge variant="secondary" className="text-[10px] gap-1">
          <ArrowUpDown className="w-2.5 h-2.5" />
          {ws.frames?.length || 0} frames
        </Badge>
        <Badge variant="secondary" className="text-[10px] text-blue-400 border-blue-500/30">
          ↑ {ws.frames?.filter(f => f.direction === 'sent').length || 0} sent
        </Badge>
        <Badge variant="secondary" className="text-[10px] text-emerald-400 border-emerald-500/30">
          ↓ {ws.frames?.filter(f => f.direction === 'received').length || 0} received
        </Badge>
        {/* Frame data size estimate */}
        {ws.frames?.length > 0 && (
          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
            ~{(() => {
              const totalBytes = ws.frames.reduce((s, f) => s + (f.data?.length || 0), 0);
              return totalBytes > 1024 ? `${(totalBytes / 1024).toFixed(1)} KB` : `${totalBytes} B`;
            })()}
          </Badge>
        )}
        {/* Avg frame size */}
        {ws.frames?.length > 0 && (
          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
            avg {Math.round(ws.frames.reduce((s, f) => s + (f.data?.length || 0), 0) / ws.frames.length)} B/frame
          </Badge>
        )}
      </div>

      <Tabs defaultValue="frames" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 bg-muted/50 h-8 shrink-0">
          <TabsTrigger value="frames" className="text-[11px] h-7">Frames</TabsTrigger>
          <TabsTrigger value="stats" className="text-[11px] h-7">Stats</TabsTrigger>
          <TabsTrigger value="code" className="text-[11px] h-7">Code</TabsTrigger>
          {ws.handshakeHeaders && <TabsTrigger value="headers" className="text-[11px] h-7">Headers</TabsTrigger>}
        </TabsList>

        <ScrollArea className="flex-1 px-4 pb-4">
          <TabsContent value="frames" className="mt-2">
            <FramesList frames={ws.frames} />
          </TabsContent>

          <TabsContent value="stats" className="mt-2">
            {ws.frames?.length > 0 ? (
              <div className="space-y-3 text-[11px]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded">
                    <div className="text-muted-foreground mb-0.5">Sent</div>
                    <div className="text-lg font-semibold text-blue-400">{ws.frames.filter(f => f.direction === 'sent').length}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {(() => { const bytes = ws.frames.filter(f => f.direction === 'sent').reduce((s, f) => s + (f.data?.length || 0), 0); return bytes > 1024 ? `${(bytes/1024).toFixed(1)} KB` : `${bytes} B`; })()}
                    </div>
                  </div>
                  <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded">
                    <div className="text-muted-foreground mb-0.5">Received</div>
                    <div className="text-lg font-semibold text-emerald-400">{ws.frames.filter(f => f.direction === 'received').length}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {(() => { const bytes = ws.frames.filter(f => f.direction === 'received').reduce((s, f) => s + (f.data?.length || 0), 0); return bytes > 1024 ? `${(bytes/1024).toFixed(1)} KB` : `${bytes} B`; })()}
                    </div>
                  </div>
                </div>
                {/* JSON vs binary detection */}
                <div className="p-2 bg-muted/20 border border-border rounded">
                  <div className="text-muted-foreground mb-1">Message Types</div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      JSON: {ws.frames.filter(f => { try { JSON.parse(f.data); return true; } catch { return false; } }).length}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      Text: {ws.frames.filter(f => { try { JSON.parse(f.data); return false; } catch { return true; } }).length}
                    </Badge>
                  </div>
                </div>
                {/* Duration */}
                {ws.frames.length >= 2 && (() => {
                  const first = new Date(ws.frames[0].time).getTime();
                  const last = new Date(ws.frames[ws.frames.length - 1].time).getTime();
                  const duration = last - first;
                  return (
                    <div className="p-2 bg-muted/20 border border-border rounded">
                      <div className="text-muted-foreground mb-0.5">Activity Duration</div>
                      <div className="font-medium">{duration > 1000 ? `${(duration/1000).toFixed(1)}s` : `${duration}ms`}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {(ws.frames.length / (duration / 1000)).toFixed(1)} frames/sec
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4">No frame data for statistics</p>
            )}
          </TabsContent>

          <TabsContent value="code" className="mt-2">
            <CodeGenerator ws={ws} type="websocket" onCopy={onCopy} />
          </TabsContent>

          {ws.handshakeHeaders && (
            <TabsContent value="headers" className="mt-2">
              <div className="space-y-1 mt-2">
                {Object.entries(ws.handshakeHeaders).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-[11px]">
                    <span className="font-mono text-primary/80 shrink-0">{k}:</span>
                    <span className="font-mono text-foreground/70 break-all">{v}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>
    </div>
  );
}
