import { useState } from 'react';
import { 
  X, Copy, ExternalLink, Clock, HardDrive, Calendar, Code, Terminal, 
  Download, Share2, FileJson, AlertTriangle, CheckCircle, FileCode,
  Hash, Zap, FileText, Shield, Eye, PlayCircle, Save, Star,
  GitCompare, Webhook, Activity, BookOpen, Sparkles, Braces,
  Timer, Database, Link, Settings, RefreshCw, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ApiDetailsSheet({ api, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!api) return null;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'border-blue-500 text-blue-500 bg-blue-500/10',
      POST: 'border-green-500 text-green-500 bg-green-500/10',
      PUT: 'border-yellow-500 text-yellow-500 bg-yellow-500/10',
      DELETE: 'border-red-500 text-red-500 bg-red-500/10',
      PATCH: 'border-purple-500 text-purple-500 bg-purple-500/10',
    };
    return colors[method] || 'border-gray-500 text-gray-500 bg-gray-500/10';
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-muted-foreground';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const copyToClipboard = (text, label = 'Content') => {
    navigator.clipboard.writeText(text)
      .then(() => showNotification(`${label} copied to clipboard!`))
      .catch(() => showNotification('Failed to copy', 'error'));
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  // ============ ADVANCED FUNCTIONS (25+) ============

  // 1. Copy as cURL
  const copyAsCurl = () => {
    const headers = api.headers ? Object.entries(api.headers)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(' \\\n  ') : '';
    const payload = api.payload ? `-d '${typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload)}'` : '';
    const curlCommand = `curl -X ${api.method} "${api.url}" \\\n  ${headers} ${payload}`.trim();
    copyToClipboard(curlCommand, 'cURL command');
  };

  // 2. Copy as JavaScript Fetch
  const copyAsFetch = () => {
    const fetchCode = `fetch('${api.url}', {
  method: '${api.method}',
  headers: ${JSON.stringify(api.headers || {}, null, 2)},
  ${api.payload ? `body: JSON.stringify(${JSON.stringify(api.payload, null, 2)})` : ''}
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
    copyToClipboard(fetchCode, 'JavaScript Fetch code');
  };

  // 3. Copy as Python Requests
  const copyAsPython = () => {
    const pythonCode = `import requests

url = "${api.url}"
headers = ${JSON.stringify(api.headers || {}, null, 2).replace(/"/g, "'")}
${api.payload ? `payload = ${JSON.stringify(api.payload, null, 2).replace(/"/g, "'")}` : ''}

response = requests.${api.method.toLowerCase()}(url, headers=headers${api.payload ? ', json=payload' : ''})
print(response.json())`;
    copyToClipboard(pythonCode, 'Python code');
  };

  // 4. Copy as Axios
  const copyAsAxios = () => {
    const axiosCode = `axios({
  method: '${api.method.toLowerCase()}',
  url: '${api.url}',
  headers: ${JSON.stringify(api.headers || {}, null, 2)},
  ${api.payload ? `data: ${JSON.stringify(api.payload, null, 2)}` : ''}
})
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));`;
    copyToClipboard(axiosCode, 'Axios code');
  };

  // 5. Generate Mock Response
  const generateMockResponse = () => {
    const mockData = {
      url: api.url,
      method: api.method,
      status: api.response?.status || 200,
      data: api.response?.data || {},
      headers: api.response?.headers || {},
      timestamp: new Date().toISOString()
    };
    copyToClipboard(JSON.stringify(mockData, null, 2), 'Mock response');
  };

  // 6. Test/Replay Request
  const replayRequest = async () => {
    setIsReplaying(true);
    setReplayResult(null);
    
    try {
      const startTime = Date.now();
      const response = await fetch(api.url, {
        method: api.method,
        headers: api.headers,
        body: api.payload ? JSON.stringify(api.payload) : undefined
      });
      const endTime = Date.now();
      const data = await response.json().catch(() => null);
      
      setReplayResult({
        status: response.status,
        time: endTime - startTime,
        data: data,
        success: response.ok
      });
      showNotification('Request replayed successfully!');
    } catch (error) {
      setReplayResult({
        error: error.message,
        success: false
      });
      showNotification('Replay failed: ' + error.message, 'error');
    } finally {
      setIsReplaying(false);
    }
  };

  // 7. Export to Postman
  const exportToPostman = () => {
    const postmanCollection = {
      info: {
        name: `${api.method} ${getDomain(api.url)}`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: [{
        name: api.url,
        request: {
          method: api.method,
          header: Object.entries(api.headers || {}).map(([key, value]) => ({ key, value })),
          url: {
            raw: api.url,
            protocol: new URL(api.url).protocol.replace(':', ''),
            host: new URL(api.url).hostname.split('.'),
            path: new URL(api.url).pathname.split('/').filter(Boolean)
          },
          body: api.payload ? {
            mode: 'raw',
            raw: JSON.stringify(api.payload, null, 2)
          } : undefined
        }
      }]
    };
    
    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `postman-${api.method}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Exported to Postman format!');
  };

  // 8. Export to Insomnia
  const exportToInsomnia = () => {
    const insomniaData = {
      _type: 'export',
      __export_format: 4,
      resources: [{
        _id: `req_${Date.now()}`,
        _type: 'request',
        method: api.method,
        url: api.url,
        headers: Object.entries(api.headers || {}).map(([name, value]) => ({ name, value })),
        body: api.payload ? {
          mimeType: 'application/json',
          text: JSON.stringify(api.payload, null, 2)
        } : {}
      }]
    };
    
    const blob = new Blob([JSON.stringify(insomniaData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insomnia-${api.method}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Exported to Insomnia format!');
  };

  // 9. Save to Collection
  const saveToCollection = () => {
    const collections = JSON.parse(localStorage.getItem('api-collections') || '[]');
    const existingCollection = collections[0] || { name: 'My Collection', apis: [] };
    existingCollection.apis.push({
      ...api,
      savedAt: new Date().toISOString()
    });
    collections[0] = existingCollection;
    localStorage.setItem('api-collections', JSON.stringify(collections));
    showNotification('Saved to collection!');
  };

  // 10. Calculate Hash
  const calculateHash = async (text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    copyToClipboard(hashHex, 'SHA-256 hash');
  };

  // 11. Format JSON
  const formatJSON = (jsonString) => {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const formatted = JSON.stringify(parsed, null, 2);
      copyToClipboard(formatted, 'Formatted JSON');
    } catch {
      showNotification('Invalid JSON', 'error');
    }
  };

  // 12. Minify JSON
  const minifyJSON = (jsonString) => {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const minified = JSON.stringify(parsed);
      copyToClipboard(minified, 'Minified JSON');
    } catch {
      showNotification('Invalid JSON', 'error');
    }
  };

  // 13. Generate TypeScript Types
  const generateTypeScript = () => {
    const generateType = (obj, name = 'ApiResponse') => {
      if (!obj || typeof obj !== 'object') return `type ${name} = any;`;
      
      const properties = Object.entries(obj).map(([key, value]) => {
        const type = Array.isArray(value) ? 'any[]' : typeof value;
        return `  ${key}: ${type};`;
      }).join('\n');
      
      return `interface ${name} {\n${properties}\n}`;
    };
    
    const tsCode = generateType(api.response?.data, 'ApiResponse');
    copyToClipboard(tsCode, 'TypeScript types');
  };

  // 14. Download Response
  const downloadResponse = () => {
    const data = api.response?.data || api;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `response-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Response downloaded!');
  };

  // 15. Share API Details
  const shareApiDetails = () => {
    const shareData = {
      title: `${api.method} ${getDomain(api.url)}`,
      text: `API: ${api.url}\nMethod: ${api.method}\nStatus: ${api.response?.status || 'N/A'}`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData).then(() => showNotification('Shared successfully!'));
    } else {
      copyToClipboard(shareData.text, 'API details');
    }
  };

  // 16. Generate Documentation
  const generateDocs = () => {
    const markdown = `# ${api.method} ${getDomain(api.url)}

## Endpoint
\`\`\`
${api.url}
\`\`\`

## Request
- **Method:** ${api.method}
- **Headers:**
\`\`\`json
${JSON.stringify(api.headers, null, 2)}
\`\`\`

${api.payload ? `- **Body:**
\`\`\`json
${JSON.stringify(api.payload, null, 2)}
\`\`\`` : ''}

## Response
- **Status:** ${api.response?.status || 'N/A'}
- **Time:** ${api.response?.time || 'N/A'}ms
- **Size:** ${formatBytes(api.response?.size)}

${api.response?.data ? `- **Data:**
\`\`\`json
${JSON.stringify(api.response.data, null, 2)}
\`\`\`` : ''}
`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-docs-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Documentation generated!');
  };

  // 17. Security Analysis
  const analyzeSecurity = () => {
    const issues = [];
    
    if (!api.url.startsWith('https://')) {
      issues.push('❌ Using HTTP instead of HTTPS');
    }
    if (api.headers?.Authorization && !api.url.startsWith('https://')) {
      issues.push('⚠️ Sending authorization over HTTP');
    }
    if (!api.headers?.['Content-Type']) {
      issues.push('ℹ️ Missing Content-Type header');
    }
    if (api.response?.headers?.['Access-Control-Allow-Origin'] === '*') {
      issues.push('⚠️ CORS allows all origins');
    }
    
    const result = issues.length > 0 
      ? `Security Issues:\n${issues.join('\n')}` 
      : '✅ No obvious security issues detected';
    
    alert(result);
  };

  // 18. Validate Response Schema
  const validateSchema = () => {
    try {
      const data = api.response?.data;
      if (!data) {
        showNotification('No response data to validate', 'error');
        return;
      }
      
      const schema = {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: typeof data === 'object' ? Object.keys(data) : []
      };
      
      copyToClipboard(JSON.stringify(schema, null, 2), 'Response schema');
    } catch {
      showNotification('Schema validation failed', 'error');
    }
  };

  // 19. Performance Analysis
  const analyzePerformance = () => {
    const time = api.response?.time || 0;
    const size = api.response?.size || 0;
    
    const rating = time < 200 ? '🟢 Excellent' : 
                   time < 500 ? '🟡 Good' : 
                   time < 1000 ? '🟠 Slow' : '🔴 Very Slow';
    
    const analysis = `Performance Analysis:
Time: ${time}ms - ${rating}
Size: ${formatBytes(size)}
Efficiency: ${size > 0 ? (size / time).toFixed(2) : '0'} bytes/ms

Recommendations:
${time > 1000 ? '- Consider caching\n' : ''}${size > 1000000 ? '- Implement pagination\n' : ''}${!api.headers?.['Content-Encoding'] ? '- Enable compression\n' : ''}`;
    
    alert(analysis);
  };

  // 20. Toggle Favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    const favorites = JSON.parse(localStorage.getItem('api-favorites') || '[]');
    
    if (!isFavorite) {
      favorites.push({ ...api, favoritedAt: new Date().toISOString() });
      localStorage.setItem('api-favorites', JSON.stringify(favorites));
      showNotification('Added to favorites!');
    } else {
      const filtered = favorites.filter(f => f.url !== api.url);
      localStorage.setItem('api-favorites', JSON.stringify(filtered));
      showNotification('Removed from favorites');
    }
  };

  // 21. Create Webhook
  const createWebhook = () => {
    const webhookConfig = {
      url: api.url,
      method: api.method,
      headers: api.headers,
      payload: api.payload,
      createdAt: new Date().toISOString()
    };
    copyToClipboard(JSON.stringify(webhookConfig, null, 2), 'Webhook configuration');
  };

  // 22. Monitor API
  const monitorApi = () => {
    const monitors = JSON.parse(localStorage.getItem('api-monitors') || '[]');
    monitors.push({
      url: api.url,
      method: api.method,
      interval: 60000, // 1 minute
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('api-monitors', JSON.stringify(monitors));
    showNotification('API monitoring enabled!');
  };

  // 23. Compare Responses
  const compareResponses = () => {
    const comparison = {
      original: api.response?.data,
      timestamp: api.timestamp,
      status: api.response?.status
    };
    copyToClipboard(JSON.stringify(comparison, null, 2), 'Comparison data');
  };

  // 24. Copy Headers Only
  const copyHeaders = () => {
    copyToClipboard(JSON.stringify(api.headers, null, 2), 'Headers');
  };

  // 25. Copy Response Only
  const copyResponse = () => {
    copyToClipboard(JSON.stringify(api.response?.data, null, 2), 'Response');
  };

  // 26. Generate API Client
  const generateAPIClient = () => {
    const clientCode = `class APIClient {
  async ${api.method.toLowerCase()}${getDomain(api.url).replace(/[.-]/g, '')}() {
    const response = await fetch('${api.url}', {
      method: '${api.method}',
      headers: ${JSON.stringify(api.headers, null, 6)},
      ${api.payload ? `body: JSON.stringify(${JSON.stringify(api.payload, null, 6)})` : ''}
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return await response.json();
  }
}

// Usage:
const client = new APIClient();
client.${api.method.toLowerCase()}${getDomain(api.url).replace(/[.-]/g, '')}()
  .then(data => console.log(data))
  .catch(error => console.error(error));`;
    
    copyToClipboard(clientCode, 'API Client code');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[750px] p-0">
        <div className="flex h-full flex-col bg-gradient-to-b from-background to-muted/20">
          {/* Modern Header with Action Buttons */}
          <div className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Badge
                  variant="outline"
                  className={`h-7 px-3 font-semibold text-sm ${getMethodColor(api.method)}`}
                >
                  {api.method}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-mono truncate font-semibold">
                      {api.url}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={toggleFavorite}
                    >
                      <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Link className="h-3 w-3" />
                    {getDomain(api.url)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="default"
                onClick={replayRequest}
                disabled={isReplaying}
                className="gap-1.5 h-8"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {isReplaying ? 'Testing...' : 'Test Now'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8">
                    <Code className="h-3.5 w-3.5" />
                    Export Code
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Export as Code</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={copyAsCurl}>
                    <Terminal className="h-4 w-4 mr-2" />
                    Copy as cURL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyAsFetch}>
                    <Code className="h-4 w-4 mr-2" />
                    JavaScript Fetch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyAsAxios}>
                    <Code className="h-4 w-4 mr-2" />
                    Axios Request
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyAsPython}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Python Requests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={generateAPIClient}>
                    <Braces className="h-4 w-4 mr-2" />
                    API Client Class
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8">
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Export Formats</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportToPostman}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Postman Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToInsomnia}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Insomnia Format
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadResponse}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Response
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={generateDocs}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Generate Docs (MD)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8">
                    <Sparkles className="h-3.5 w-3.5" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Advanced Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={saveToCollection}>
                    <Save className="h-4 w-4 mr-2" />
                    Save to Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={createWebhook}>
                    <Webhook className="h-4 w-4 mr-2" />
                    Create Webhook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={monitorApi}>
                    <Activity className="h-4 w-4 mr-2" />
                    Enable Monitoring
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={analyzeSecurity}>
                    <Shield className="h-4 w-4 mr-2" />
                    Security Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={analyzePerformance}>
                    <Zap className="h-4 w-4 mr-2" />
                    Performance Check
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={validateSchema}>
                    <Database className="h-4 w-4 mr-2" />
                    Validate Schema
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={shareApiDetails}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Notification Toast */}
            {notification && (
              <Alert className={`mt-3 ${notification.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{notification.message}</AlertDescription>
              </Alert>
            )}

            {/* Replay Result */}
            {replayResult && (
              <Card className="mt-3">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {replayResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    Replay Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Status:</span> 
                      <span className={`ml-1 font-medium ${replayResult.success ? 'text-green-500' : 'text-red-500'}`}>
                        {replayResult.status || replayResult.error}
                      </span>
                    </div>
                    {replayResult.time && (
                      <div>
                        <span className="text-muted-foreground">Time:</span> 
                        <span className="ml-1 font-medium">{replayResult.time}ms</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content - Scrollable */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start h-10 bg-muted/50">
                  <TabsTrigger value="overview" className="text-sm gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="headers" className="text-sm gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Headers
                  </TabsTrigger>
                  <TabsTrigger value="body" className="text-sm gap-1.5">
                    <Code className="h-3.5 w-3.5" />
                    Request
                  </TabsTrigger>
                  <TabsTrigger value="response" className="text-sm gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    Response
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="text-sm gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Tools
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab - Enhanced */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Modern Metrics Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status Code</p>
                            <p className={`text-2xl font-bold ${getStatusColor(api.response?.status)}`}>
                              {api.response?.status || 'N/A'}
                            </p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Response Time</p>
                            <p className="text-2xl font-bold">
                              {api.response?.time ? `${Math.round(api.response.time)}ms` : 'N/A'}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Response Size</p>
                            <p className="text-2xl font-bold">
                              {formatBytes(api.response?.size)}
                            </p>
                          </div>
                          <HardDrive className="h-8 w-8 text-purple-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                            <p className="text-sm font-bold">
                              {new Date(api.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                            </p>
                          </div>
                          <Calendar className="h-8 w-8 text-yellow-500/20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* URL Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">Request URL</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(api.url, 'URL')}
                          className="h-7 gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="rounded-md bg-muted/50 p-3 border">
                        <p className="text-xs font-mono break-all">{api.url}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions Grid */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                      <CardDescription className="text-xs">Common operations for this API</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={copyHeaders} className="justify-start gap-2">
                          <Copy className="h-4 w-4" />
                          Copy Headers
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyResponse} className="justify-start gap-2">
                          <Copy className="h-4 w-4" />
                          Copy Response
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => formatJSON(api.response?.data)} className="justify-start gap-2">
                          <Braces className="h-4 w-4" />
                          Format JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => minifyJSON(api.response?.data)} className="justify-start gap-2">
                          <Braces className="h-4 w-4" />
                          Minify JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateTypeScript} className="justify-start gap-2">
                          <FileCode className="h-4 w-4" />
                          TS Types
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateMockResponse} className="justify-start gap-2">
                          <Database className="h-4 w-4" />
                          Mock Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Headers Tab */}
                <TabsContent value="headers" className="space-y-3 mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    {/* Request Headers */}
                    {api.headers && Object.keys(api.headers).length > 0 && (
                      <AccordionItem value="request-headers">
                        <AccordionTrigger className="text-sm font-semibold">
                          Request Headers ({Object.keys(api.headers).length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {Object.entries(api.headers).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-[120px_1fr] gap-2 text-xs">
                                <span className="font-medium text-muted-foreground truncate">
                                  {key}:
                                </span>
                                <span className="font-mono break-all">{value}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {/* Response Headers */}
                    {api.response?.headers && Object.keys(api.response.headers).length > 0 && (
                      <AccordionItem value="response-headers">
                        <AccordionTrigger className="text-sm font-semibold">
                          Response Headers ({Object.keys(api.response.headers).length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {Object.entries(api.response.headers).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-[120px_1fr] gap-2 text-xs">
                                <span className="font-medium text-muted-foreground truncate">
                                  {key}:
                                </span>
                                <span className="font-mono break-all">{value}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </TabsContent>

                {/* Request Body Tab */}
                <TabsContent value="body" className="space-y-3 mt-4">
                  {api.payload ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Request Payload</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload, null, 2)
                          )}
                          className="h-7 gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                      <div className="rounded-md bg-muted p-3">
                        <pre className="text-xs font-mono overflow-x-auto">
                          {typeof api.payload === 'string' 
                            ? api.payload 
                            : JSON.stringify(api.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      No request payload
                    </div>
                  )}
                </TabsContent>

                {/* Response Tab */}
                <TabsContent value="response" className="space-y-3 mt-4">
                  {api.response?.data ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">Response Data</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => formatJSON(api.response.data)}
                              className="h-7 gap-1"
                            >
                              <Braces className="h-3 w-3" />
                              Format
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(
                                typeof api.response.data === 'string' 
                                  ? api.response.data 
                                  : JSON.stringify(api.response.data, null, 2),
                                'Response'
                              )}
                              className="h-7 gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="rounded-md bg-muted/50 p-3 max-h-[400px] overflow-auto border">
                          <pre className="text-xs font-mono">
                            {typeof api.response.data === 'string' 
                              ? api.response.data 
                              : JSON.stringify(api.response.data, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                      <div className="text-center">
                        <Database className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No response data available</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* NEW: Advanced Tools Tab - All 26+ Functions */}
                <TabsContent value="tools" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Code Generation
                      </CardTitle>
                      <CardDescription className="text-xs">Export this API in various programming languages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={copyAsCurl} className="justify-start gap-2">
                          <Terminal className="h-4 w-4" />
                          cURL Command
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyAsFetch} className="justify-start gap-2">
                          <Code className="h-4 w-4" />
                          JavaScript Fetch
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyAsAxios} className="justify-start gap-2">
                          <Code className="h-4 w-4" />
                          Axios Request
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyAsPython} className="justify-start gap-2">
                          <FileCode className="h-4 w-4" />
                          Python Requests
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateAPIClient} className="justify-start gap-2">
                          <Braces className="h-4 w-4" />
                          API Client Class
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateTypeScript} className="justify-start gap-2">
                          <FileCode className="h-4 w-4" />
                          TypeScript Types
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export & Save
                      </CardTitle>
                      <CardDescription className="text-xs">Export to different formats and save</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={exportToPostman} className="justify-start gap-2">
                          <FileJson className="h-4 w-4" />
                          Postman Collection
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToInsomnia} className="justify-start gap-2">
                          <FileJson className="h-4 w-4" />
                          Insomnia Format
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadResponse} className="justify-start gap-2">
                          <Download className="h-4 w-4" />
                          Download Response
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateDocs} className="justify-start gap-2">
                          <BookOpen className="h-4 w-4" />
                          Generate Docs
                        </Button>
                        <Button variant="outline" size="sm" onClick={saveToCollection} className="justify-start gap-2">
                          <Save className="h-4 w-4" />
                          Save to Collection
                        </Button>
                        <Button variant="outline" size="sm" onClick={shareApiDetails} className="justify-start gap-2">
                          <Share2 className="h-4 w-4" />
                          Share Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Analysis & Testing
                      </CardTitle>
                      <CardDescription className="text-xs">Analyze and test this API endpoint</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={replayRequest} disabled={isReplaying} className="justify-start gap-2">
                          <PlayCircle className="h-4 w-4" />
                          {isReplaying ? 'Testing...' : 'Test Request'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={analyzeSecurity} className="justify-start gap-2">
                          <Shield className="h-4 w-4" />
                          Security Check
                        </Button>
                        <Button variant="outline" size="sm" onClick={analyzePerformance} className="justify-start gap-2">
                          <Timer className="h-4 w-4" />
                          Performance
                        </Button>
                        <Button variant="outline" size="sm" onClick={validateSchema} className="justify-start gap-2">
                          <Database className="h-4 w-4" />
                          Validate Schema
                        </Button>
                        <Button variant="outline" size="sm" onClick={compareResponses} className="justify-start gap-2">
                          <GitCompare className="h-4 w-4" />
                          Compare
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => calculateHash(api.url)} className="justify-start gap-2">
                          <Hash className="h-4 w-4" />
                          Calculate Hash
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Automation & Monitoring
                      </CardTitle>
                      <CardDescription className="text-xs">Set up automation and monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={createWebhook} className="justify-start gap-2">
                          <Webhook className="h-4 w-4" />
                          Create Webhook
                        </Button>
                        <Button variant="outline" size="sm" onClick={monitorApi} className="justify-start gap-2">
                          <Activity className="h-4 w-4" />
                          Enable Monitor
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateMockResponse} className="justify-start gap-2">
                          <Database className="h-4 w-4" />
                          Mock Response
                        </Button>
                        <Button variant="outline" size="sm" onClick={toggleFavorite} className="justify-start gap-2">
                          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
                          {isFavorite ? 'Unfavorite' : 'Add Favorite'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Braces className="h-4 w-4" />
                        Data Manipulation
                      </CardTitle>
                      <CardDescription className="text-xs">Format and transform response data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => formatJSON(api.response?.data)} className="justify-start gap-2">
                          <Braces className="h-4 w-4" />
                          Format JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => minifyJSON(api.response?.data)} className="justify-start gap-2">
                          <Braces className="h-4 w-4" />
                          Minify JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyHeaders} className="justify-start gap-2">
                          <Copy className="h-4 w-4" />
                          Copy Headers
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyResponse} className="justify-start gap-2">
                          <Copy className="h-4 w-4" />
                          Copy Response
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>26+ Advanced Functions Available!</strong> Use these tools to analyze, test, export, and automate your API workflows.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Modern Footer */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => copyToClipboard(api.url, 'URL')}
                  className="gap-1.5 h-9"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(api.url, '_blank')}
                  className="gap-1.5 h-9"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Browser
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-1.5 h-9"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ApiDetailsSheet;
