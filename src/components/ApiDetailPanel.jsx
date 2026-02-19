import { X, Copy, ExternalLink, Lock, Zap, Clock, FileJson, ArrowDownToLine, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { METHOD_COLORS, statusClass } from '@/constants/brand';

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
          {api.graphql && <TabsTrigger value="graphql" className="text-[11px] h-7">GraphQL</TabsTrigger>}
        </TabsList>

        <ScrollArea className="flex-1 px-4 pb-4">
          <TabsContent value="response" className="mt-2">
            {api.response ? (
              <>
                {api.response.size && api.response.size !== 'unknown' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                    <ArrowDownToLine className="w-3 h-3" />
                    {api.response.size} bytes
                  </div>
                )}
                <JsonBlock data={api.response.data} />
                {api.response.error && (
                  <p className="text-xs text-destructive mt-2">{api.response.error}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-4">No response captured</p>
            )}
          </TabsContent>

          <TabsContent value="request" className="mt-2">
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
