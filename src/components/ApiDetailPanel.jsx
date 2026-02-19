import { useState } from 'react';
import { X, Copy, ExternalLink, Lock, Zap, Clock, FileJson, ArrowDownToLine, AlertTriangle, Code2, Shield, Globe, Play, Server, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { METHOD_COLORS, statusClass } from '@/constants/brand';
import CodeGenerator from './CodeGenerator';
import JsonTreeViewer from './JsonTreeViewer';

function JsonBlock({ data, label }) {
  if (!data) return null;
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <div className="mt-2">
      {label && <div className="text-[11px] text-muted-foreground font-medium mb-1">{label}</div>}
      <pre className="text-[11px] font-mono bg-background rounded-md p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all border border-border">
        {str}
      </pre>
    </div>
  );
}

function HeadersTable({ headers }) {
  if (!headers || !Object.keys(headers).length) {
    return <p className="text-xs text-muted-foreground py-2">No headers captured</p>;
  }
  return (
    <div className="mt-2 space-y-1">
      {Object.entries(headers).map(([k, v]) => (
        <div key={k} className="flex gap-2 text-[11px]">
          <span className="font-mono text-primary/80 shrink-0">{k}:</span>
          <span className="font-mono text-foreground/70 break-all">{v}</span>
        </div>
      ))}
    </div>
  );
}

function CorsInfo({ cors }) {
  if (!cors || (!cors.allowOrigin && !cors.allowMethods)) return null;
  return (
    <div className="mt-3 p-2 rounded border border-border bg-muted/20">
      <div className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
        <Globe className="w-3 h-3" /> CORS Configuration
      </div>
      {cors.allowOrigin && <div className="text-[10px]"><span className="text-muted-foreground">Origin:</span> <span className={cors.allowOrigin === '*' ? 'text-amber-400' : 'text-emerald-400'}>{cors.allowOrigin}</span></div>}
      {cors.allowMethods && <div className="text-[10px]"><span className="text-muted-foreground">Methods:</span> {cors.allowMethods}</div>}
      {cors.credentials && <div className="text-[10px]"><span className="text-muted-foreground">Credentials:</span> {cors.credentials}</div>}
    </div>
  );
}

function QueryParamsTable({ params }) {
  if (!params || !Object.keys(params).length) return null;
  return (
    <div className="mt-2">
      <div className="text-[11px] text-muted-foreground font-medium mb-1">Query Parameters</div>
      <div className="space-y-1">
        {Object.entries(params).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-[11px] bg-muted/20 px-2 py-1 rounded">
            <span className="font-mono text-primary/80 shrink-0">{k}</span>
            <span className="text-muted-foreground">=</span>
            <span className="font-mono text-foreground/70 break-all">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UrlPathBreakdown({ url }) {
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="text-[11px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
        <Link2 className="w-3 h-3" /> URL Path Segments
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-[10px] font-mono text-muted-foreground">{parsed.origin}</span>
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <span className="text-muted-foreground text-[10px]">/</span>
            <Badge variant="secondary" className={`text-[10px] font-mono ${
              /^v\d+/.test(seg) ? 'text-blue-400 border-blue-500/30' :
              /^\d+$/.test(seg) || /^[a-f0-9-]{8,}$/i.test(seg) ? 'text-amber-400 border-amber-500/30' :
              ''
            }`}>{seg}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionInfo({ response }) {
  if (!response) return null;
  const info = [];
  if (response.server) info.push({ label: 'Server', value: response.server });
  if (response.cfRay) info.push({ label: 'CF-Ray', value: response.cfRay });
  if (response.vary) info.push({ label: 'Vary', value: response.vary });
  if (response.cacheControl) info.push({ label: 'Cache', value: response.cacheControl });
  if (info.length === 0) return null;
  return (
    <div className="mt-3 p-2 rounded border border-border bg-muted/20">
      <div className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
        <Server className="w-3 h-3" /> Connection Info
      </div>
      {info.map((item, i) => (
        <div key={i} className="text-[10px] flex gap-2">
          <span className="text-muted-foreground shrink-0">{item.label}:</span>
          <span className="text-foreground/70 break-all">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function ReplayButton({ api, onCopy }) {
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState(null);

  const handleReplay = async () => {
    setReplaying(true);
    setReplayResult(null);
    try {
      const opts = { method: api.method, headers: {} };
      // Copy safe headers
      if (api.headers) {
        ['accept', 'content-type', 'authorization', 'x-api-key'].forEach(h => {
          if (api.headers[h]) opts.headers[h] = api.headers[h];
        });
      }
      if (api.payload && ['POST', 'PUT', 'PATCH'].includes(api.method)) {
        opts.body = typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload);
      }
      const start = performance.now();
      const resp = await fetch(api.url, opts);
      const elapsed = Math.round(performance.now() - start);
      let data;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('json')) data = await resp.json();
      else data = await resp.text();
      setReplayResult({ status: resp.status, statusText: resp.statusText, data, time: elapsed, ok: true });
    } catch (err) {
      setReplayResult({ error: err.message, ok: false });
    } finally {
      setReplaying(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={handleReplay}
        disabled={replaying}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-[11px] font-medium border border-primary/20 transition-colors disabled:opacity-50"
      >
        <Play className="w-3 h-3" />
        {replaying ? 'Replaying...' : 'Try It (Replay)'}
      </button>
      {replayResult && (
        <div className="mt-2 p-2 rounded border border-border bg-background/50 text-[11px]">
          {replayResult.ok ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={`text-[10px] ${replayResult.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {replayResult.status} {replayResult.statusText}
                </Badge>
                <span className="text-muted-foreground">{replayResult.time}ms</span>
              </div>
              <pre className="font-mono text-[10px] text-foreground/70 max-h-32 overflow-auto whitespace-pre-wrap break-all">
                {typeof replayResult.data === 'object' ? JSON.stringify(replayResult.data, null, 2).substring(0, 2000) : String(replayResult.data).substring(0, 2000)}
              </pre>
            </>
          ) : (
            <div className="text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {replayResult.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiDetailPanel({ api, onClose, onCopy }) {
  if (!api) return null;

  const status = api.response?.status;

  return (
    <div className="w-[420px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${METHOD_COLORS[api.method] || 'method-get'}`}>
            {api.method}
          </span>
          {status && (
            <span className={`text-xs font-semibold ${statusClass(status)}`}>{status} {api.response?.statusText}</span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* URL */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-mono break-all flex-1 text-foreground/80">{api.url}</p>
          <button onClick={() => onCopy(api.url)} className="p-1 rounded hover:bg-muted shrink-0" title="Copy URL">
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
          <a href={api.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted shrink-0">
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Meta badges */}
      <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-border shrink-0">
        <Badge variant="secondary" className="text-[10px] gap-1">
          <Clock className="w-2.5 h-2.5" />
          {api.response?.responseTime ? `${api.response.responseTime}ms` : 'N/A'}
        </Badge>
        {api.authentication && (
          <Badge variant="secondary" className="text-[10px] gap-1 border-amber-500/30 text-amber-400">
            <Lock className="w-2.5 h-2.5" />
            {api.authentication[0]?.type || 'Auth'}
          </Badge>
        )}
        {api.graphql && (
          <Badge variant="secondary" className="text-[10px] gap-1 border-purple-500/30 text-purple-400">
            <Zap className="w-2.5 h-2.5" />
            GraphQL {api.graphql.operationType}
          </Badge>
        )}
        {api.response?.rateLimit && (
          <Badge variant="secondary" className={`text-[10px] gap-1 ${api.response.rateLimit.isApproachingLimit ? 'border-red-500/30 text-red-400' : ''}`}>
            <AlertTriangle className="w-2.5 h-2.5" />
            Rate: {api.response.rateLimit.remaining}/{api.response.rateLimit.limit}
          </Badge>
        )}
        {api.apiVersion && (
          <Badge variant="secondary" className="text-[10px] border-blue-500/30 text-blue-400">
            {api.apiVersion}
          </Badge>
        )}
        {api.category && (
          <Badge variant="secondary" className="text-[10px]">{api.category}</Badge>
        )}
        <Badge variant="secondary" className="text-[10px]">{api.type}</Badge>
      </div>

      {/* Explanations */}
      {api.explanations?.length > 0 && (
        <div className="px-4 py-2 border-b border-border shrink-0">
          {api.explanations.map((exp, i) => (
            <p key={i} className="text-[11px] text-muted-foreground">{exp}</p>
          ))}
        </div>
      )}

      {/* Tabbed content */}
      <Tabs defaultValue="response" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 bg-muted/50 h-8 shrink-0">
          <TabsTrigger value="response" className="text-[11px] h-7">Response</TabsTrigger>
          <TabsTrigger value="request" className="text-[11px] h-7">Request</TabsTrigger>
          <TabsTrigger value="headers" className="text-[11px] h-7">Headers</TabsTrigger>
          <TabsTrigger value="code" className="text-[11px] h-7">Code</TabsTrigger>
          {api.graphql && <TabsTrigger value="graphql" className="text-[11px] h-7">GraphQL</TabsTrigger>}
        </TabsList>

        <ScrollArea className="flex-1 px-4 pb-4">
          <TabsContent value="response" className="mt-2">
            {api.response ? (
              <>
                {api.response.size && api.response.size !== 'unknown' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                    <ArrowDownToLine className="w-3 h-3" />
                    {parseInt(api.response.size) > 1024
                      ? `${(parseInt(api.response.size) / 1024).toFixed(1)} KB`
                      : `${api.response.size} bytes`}
                  </div>
                )}
                <JsonTreeViewer data={api.response.data} onCopy={onCopy} />
                {api.response.error && (
                  <p className="text-xs text-destructive mt-2">{api.response.error}</p>
                )}
                <CorsInfo cors={api.response.cors} />
                <ConnectionInfo response={api.response} />
                <ReplayButton api={api} onCopy={onCopy} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-4">No response captured</p>
            )}
          </TabsContent>

          <TabsContent value="request" className="mt-2">
            <UrlPathBreakdown url={api.url} />
            <QueryParamsTable params={api.queryParams} />
            {api.payload ? (
              <JsonBlock data={api.payload} label="Request Body" />
            ) : (
              <p className="text-xs text-muted-foreground py-4">No request body</p>
            )}
          </TabsContent>

          <TabsContent value="headers" className="mt-2">
            <div className="text-[11px] font-medium text-muted-foreground mb-1">Request Headers</div>
            <HeadersTable headers={api.headers} />
            <Separator className="my-3" />
            <div className="text-[11px] font-medium text-muted-foreground mb-1">Response Headers</div>
            <HeadersTable headers={api.response?.headers} />
          </TabsContent>

          <TabsContent value="code" className="mt-2">
            <CodeGenerator api={api} onCopy={onCopy} type="api" />
            <div className="mt-4 space-y-2">
              <div className="text-[11px] font-medium text-muted-foreground">Usage Notes</div>
              <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/20 p-2 rounded">
                <p>• Copy the code snippet above and paste it into your project</p>
                {api.authentication && <p>• This endpoint requires <strong>{api.authentication[0]?.type}</strong> — make sure to include valid credentials</p>}
                {api.response?.rateLimit && <p>• Rate limited: {api.response.rateLimit.remaining}/{api.response.rateLimit.limit} remaining</p>}
                {api.response?.cors?.allowOrigin && <p>• CORS: {api.response.cors.allowOrigin === '*' ? 'Open (any origin allowed)' : `Restricted to ${api.response.cors.allowOrigin}`}</p>}
                {api.graphql && <p>• GraphQL {api.graphql.operationType}: modify the query/variables as needed</p>}
              </div>
            </div>
          </TabsContent>

          {api.graphql && (
            <TabsContent value="graphql" className="mt-2">
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Operation</div>
                  <p className="text-xs font-medium">{api.graphql.operationType} {api.graphql.operationName}</p>
                </div>
                <JsonBlock data={api.graphql.query} label="Query" />
                {api.graphql.variables && <JsonBlock data={api.graphql.variables} label="Variables" />}
                {api.graphql.fields?.length > 0 && (
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Fields</div>
                    <div className="flex flex-wrap gap-1">
                      {api.graphql.fields.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>
    </div>
  );
}
