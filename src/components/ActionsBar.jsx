import { useState } from 'react';
import { 
  Download, 
  Copy, 
  Trash2, 
  FolderPlus, 
  Play,
  FileJson,
  FileText,
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ActionsBar({ 
  apis = [],
  selectedApis = [],
  onSelectAll,
  onClearSelection,
  onExport,
  onDelete,
  onAddToCollection,
  onReplayAll
}) {
  const allSelected = selectedApis.length > 0 && selectedApis.length === apis.length;
  const someSelected = selectedApis.length > 0 && selectedApis.length < apis.length;

  const exportAsJSON = () => {
    const data = apis.filter(api => selectedApis.includes(api.id || api.url));
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apis-${Date.now()}.json`;
    a.click();
  };

  const exportAsCSV = () => {
    const data = apis.filter(api => selectedApis.includes(api.id || api.url));
    const headers = ['Method', 'URL', 'Status', 'Time (ms)', 'Size (bytes)', 'Timestamp'];
    const rows = data.map(api => [
      api.method,
      api.url,
      api.response?.status || '',
      api.response?.time || '',
      api.response?.size || '',
      new Date(api.timestamp).toISOString()
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apis-${Date.now()}.csv`;
    a.click();
  };

  const copyAllAsCurl = () => {
    const data = apis.filter(api => selectedApis.includes(api.id || api.url));
    const curls = data.map(api => {
      let curl = `curl -X ${api.method} '${api.url}'`;
      if (api.headers) {
        Object.entries(api.headers).forEach(([key, value]) => {
          curl += ` -H '${key}: ${value}'`;
        });
      }
      if (api.payload) {
        curl += ` -d '${JSON.stringify(api.payload)}'`;
      }
      return curl;
    }).join('\n\n');
    
    navigator.clipboard.writeText(curls);
  };

  const exportAsHAR = () => {
    const data = apis.filter(api => selectedApis.includes(api.id || api.url));
    
    const har = {
      log: {
        version: "1.2",
        creator: {
          name: "API Parser Pro",
          version: "1.0.0"
        },
        entries: data.map(api => ({
          startedDateTime: api.timestamp || new Date().toISOString(),
          time: api.response?.time || 0,
          request: {
            method: api.method,
            url: api.url,
            httpVersion: "HTTP/1.1",
            headers: Object.entries(api.headers || {}).map(([name, value]) => ({ name, value })),
            queryString: [],
            cookies: [],
            headersSize: -1,
            bodySize: -1,
          },
          response: {
            status: api.response?.status || 0,
            statusText: "",
            httpVersion: "HTTP/1.1",
            headers: [],
            content: {
              size: api.response?.size || 0,
              mimeType: "application/json"
            },
            redirectURL: "",
            headersSize: -1,
            bodySize: api.response?.size || 0
          },
          cache: {},
          timings: {
            send: 0,
            wait: api.response?.time || 0,
            receive: 0
          }
        }))
      }
    };
    
    const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apis-${Date.now()}.har`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPostman = () => {
    const data = apis.filter(api => selectedApis.includes(api.id || api.url));
    
    const collection = {
      info: {
        name: "API Parser Pro Collection",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: data.map(api => {
        const urlObj = new URL(api.url);
        return {
          name: `${api.method} ${urlObj.pathname}`,
          request: {
            method: api.method,
            header: Object.entries(api.headers || {}).map(([key, value]) => ({ key, value })),
            url: {
              raw: api.url,
              protocol: urlObj.protocol.replace(':', ''),
              host: urlObj.hostname.split('.'),
              path: urlObj.pathname.split('/').filter(Boolean),
              query: []
            }
          }
        };
      })
    };
    
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postman-collection-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (apis.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-border rounded bg-card mb-3">
      {/* Left: Selection */}
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll();
            } else {
              onClearSelection();
            }
          }}
        />
        <span className="text-sm text-muted-foreground">
          {selectedApis.length > 0 ? (
            <span className="font-medium text-foreground">{selectedApis.length} selected</span>
          ) : (
            'Select all'
          )}
        </span>
      </div>

      {/* Right: Actions */}
      {selectedApis.length > 0 && (
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Download className="h-4 w-4" />
                Export ({selectedApis.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
                <FileJson className="h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
                <FileText className="h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyAllAsCurl} className="gap-2">
                <Terminal className="h-4 w-4" />
                Copy as cURL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportAsHAR} className="gap-2">
                <FileText className="h-4 w-4" />
                Export as HAR
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsPostman} className="gap-2">
                <FileJson className="h-4 w-4" />
                Postman Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Replay All */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReplayAll}
            className="h-9 gap-2"
          >
            <Play className="h-4 w-4" />
            Replay
          </Button>

          {/* Add to Collection */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddToCollection}
            className="h-9 gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            Collection
          </Button>

          {/* Delete */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDelete}
            className="h-9 gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          {/* Clear Selection */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearSelection}
            className="h-9"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

export default ActionsBar;
