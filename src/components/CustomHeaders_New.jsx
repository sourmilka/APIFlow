import { useState } from 'react';
import { Settings, Plus, Trash2, Key, Cookie, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

function CustomHeaders({ onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [authType, setAuthType] = useState('none');
  const [bearerToken, setBearerToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [basicUser, setBasicUser] = useState('');
  const [basicPass, setBasicPass] = useState('');
  const [customHeaders, setCustomHeaders] = useState([]);
  const [cookies, setCookies] = useState('');
  const [userAgent, setUserAgent] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const updateCustomHeader = (index, field, value) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  const removeCustomHeader = (index) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const headers = {};
    
    // Add auth headers based on type
    if (authType === 'bearer' && bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    } else if (authType === 'apikey' && apiKey) {
      headers[apiKeyHeader] = apiKey;
    } else if (authType === 'basic' && basicUser && basicPass) {
      const credentials = btoa(`${basicUser}:${basicPass}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    // Add custom headers
    customHeaders.forEach(h => {
      if (h.key && h.value) {
        headers[h.key] = h.value;
      }
    });

    const config = {
      headers,
      cookies,
      userAgent
    };
    
    onSave(config);
    setIsOpen(false);
  };

  const handleReset = () => {
    setAuthType('none');
    setBearerToken('');
    setApiKey('');
    setBasicUser('');
    setBasicPass('');
    setCustomHeaders([]);
    setCookies('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 h-9">
          <Settings className="h-4 w-4" />
          <span>Config</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Configuration</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="auth" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="auth" className="text-xs">Authentication</TabsTrigger>
            <TabsTrigger value="headers" className="text-xs">Custom Headers</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="auth" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Auth Type</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={authType === 'none' ? 'default' : 'outline'}
                  onClick={() => setAuthType('none')}
                  className="h-9"
                >
                  None
                </Button>
                <Button
                  variant={authType === 'bearer' ? 'default' : 'outline'}
                  onClick={() => setAuthType('bearer')}
                  className="h-9"
                >
                  Bearer
                </Button>
                <Button
                  variant={authType === 'apikey' ? 'default' : 'outline'}
                  onClick={() => setAuthType('apikey')}
                  className="h-9"
                >
                  API Key
                </Button>
                <Button
                  variant={authType === 'basic' ? 'default' : 'outline'}
                  onClick={() => setAuthType('basic')}
                  className="h-9"
                >
                  Basic
                </Button>
              </div>
            </div>

            <Separator />

            {/* Bearer Token */}
            {authType === 'bearer' && (
              <div className="space-y-2">
                <Label className="text-sm">Bearer Token</Label>
                <Input
                  placeholder="your_token_here"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Header: <code className="bg-secondary px-1 py-0.5 rounded">Authorization: Bearer {bearerToken || '...'}</code>
                </p>
              </div>
            )}

            {/* API Key */}
            {authType === 'apikey' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Header Name</Label>
                  <Input
                    placeholder="X-API-Key"
                    value={apiKeyHeader}
                    onChange={(e) => setApiKeyHeader(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">API Key</Label>
                  <Input
                    placeholder="your_api_key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Header: <code className="bg-secondary px-1 py-0.5 rounded">{apiKeyHeader}: {apiKey || '...'}</code>
                </p>
              </div>
            )}

            {/* Basic Auth */}
            {authType === 'basic' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Username</Label>
                  <Input
                    placeholder="username"
                    value={basicUser}
                    onChange={(e) => setBasicUser(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Password</Label>
                  <Input
                    type="password"
                    placeholder="password"
                    value={basicPass}
                    onChange={(e) => setBasicPass(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Header: <code className="bg-secondary px-1 py-0.5 rounded">Authorization: Basic [base64]</code>
                </p>
              </div>
            )}

            {/* Quick Examples */}
            {authType === 'none' && (
              <div className="p-3 bg-secondary/30 rounded text-xs space-y-2">
                <p className="font-semibold">Common Use Cases:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Bearer Token:</strong> JWT tokens, OAuth 2.0</li>
                  <li>• <strong>API Key:</strong> REST API keys in headers</li>
                  <li>• <strong>Basic Auth:</strong> Username/password authentication</li>
                  <li>• <strong>Custom Headers:</strong> Any specific headers required</li>
                </ul>
              </div>
            )}
          </TabsContent>

          {/* Custom Headers Tab */}
          <TabsContent value="headers" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Custom Headers</Label>
              <Button variant="outline" size="sm" onClick={addCustomHeader} className="gap-1 h-8">
                <Plus className="h-3 w-3" />
                Add Header
              </Button>
            </div>

            {customHeaders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No custom headers added</p>
                <p className="text-xs mt-1">Click "Add Header" to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header-Name"
                      value={header.key}
                      onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                    <Input
                      placeholder="value"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomHeader(index)}
                      className="h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Quick presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Add:</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomHeaders([...customHeaders, { key: 'Content-Type', value: 'application/json' }])}
                  className="text-xs h-8"
                >
                  Content-Type: JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomHeaders([...customHeaders, { key: 'Accept', value: 'application/json' }])}
                  className="text-xs h-8"
                >
                  Accept: JSON
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            {/* Cookies */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cookie className="h-4 w-4" />
                <Label className="text-sm font-semibold">Cookies</Label>
              </div>
              <Textarea
                placeholder="name1=value1; name2=value2"
                value={cookies}
                onChange={(e) => setCookies(e.target.value)}
                className="font-mono text-sm min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Enter cookies in format: <code className="bg-secondary px-1 py-0.5 rounded">name=value; name2=value2</code>
              </p>
            </div>

            <Separator />

            {/* User Agent */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">User Agent</Label>
              <Input
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')}
                  className="text-xs h-7"
                >
                  Chrome
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserAgent('curl/7.68.0')}
                  className="text-xs h-7"
                >
                  cURL
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset} className="h-9">
            Reset
          </Button>
          <Button onClick={handleSave} className="h-9">
            Apply Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomHeaders;
