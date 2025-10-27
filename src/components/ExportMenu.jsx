import { Download, FileJson, FileText, Terminal, Package } from 'lucide-react';
import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToPostman, downloadPostmanCollection } from '../utils/postmanExporter';

const ExportMenu = forwardRef(({ apis, url }, ref) => {
  const exportAsJSON = () => {
    const data = {
      url,
      timestamp: new Date().toISOString(),
      totalApis: apis.length,
      apis: apis
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `api-export-${Date.now()}.json`);
  };

  const exportAsCSV = () => {
    const headers = ['ID', 'Method', 'URL', 'Status', 'Type', 'Timestamp'];
    const rows = apis.map(api => [
      api.id,
      api.method,
      api.url,
      api.response?.status || 'N/A',
      api.type,
      api.timestamp
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `api-export-${Date.now()}.csv`);
  };

  const exportAsCurl = () => {
    const curlCommands = apis.map(api => {
      let curl = `curl -X ${api.method} "${api.url}"`;
      
      // Add headers
      if (api.headers) {
        Object.entries(api.headers).forEach(([key, value]) => {
          if (!key.startsWith(':')) { // Skip HTTP/2 pseudo-headers
            curl += ` \\\n  -H "${key}: ${value}"`;
          }
        });
      }
      
      // Add payload
      if (api.payload) {
        curl += ` \\\n  -d '${api.payload}'`;
      }
      
      return curl;
    }).join('\n\n# ---\n\n');
    
    const blob = new Blob([curlCommands], { type: 'text/plain' });
    downloadFile(blob, `api-curl-${Date.now()}.sh`);
  };

  const exportAsPostman = () => {
    try {
      const collection = exportToPostman(apis, url);
      downloadPostmanCollection(collection, `postman-collection-${Date.now()}.json`);
    } catch (error) {
      console.error('Postman export failed:', error);
      alert('Failed to export Postman collection. Please try again.');
    }
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (apis.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={ref} className="gap-2">
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={exportAsJSON} className="gap-3 cursor-pointer">
          <FileJson className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">Export as JSON</span>
            <span className="text-xs text-muted-foreground">Full data export</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportAsCSV} className="gap-3 cursor-pointer">
          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">Export as CSV</span>
            <span className="text-xs text-muted-foreground">Spreadsheet format</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportAsCurl} className="gap-3 cursor-pointer">
          <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">Export as cURL</span>
            <span className="text-xs text-muted-foreground">Command line scripts</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportAsPostman} className="gap-3 cursor-pointer">
          <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">Export as Postman</span>
            <span className="text-xs text-muted-foreground">Postman Collection v2.1</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default ExportMenu;
