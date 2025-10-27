import { useState } from 'react';
import { Settings, Plus, Trash2, Save, Key, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function CustomHeaders({ onSave, onClose }) {
  const [headers, setHeaders] = useState([]);
  const [cookies, setCookies] = useState('');
  const [userAgent, setUserAgent] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index, field, value) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const toggleHeader = (index) => {
    const updated = [...headers];
    updated[index].enabled = !updated[index].enabled;
    setHeaders(updated);
  };

  const handleSave = () => {
    const config = {
      headers: headers.filter(h => h.enabled && h.key && h.value).reduce((acc, h) => {
        acc[h.key] = h.value;
        return acc;
      }, {}),
      cookies,
      userAgent
    };
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <Settings className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Request Configuration</h2>
              <p className="text-sm text-muted-foreground">Configure headers, user agent, and cookies for advanced parsing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Agent */}
          <div className="space-y-2">
            <Label htmlFor="user-agent">User Agent</Label>
            <Input
              id="user-agent"
              type="text"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              placeholder="Mozilla/5.0..."
            />
            <p className="text-xs text-muted-foreground">
              Custom user agent to avoid bot detection
            </p>
          </div>

          {/* Custom Headers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Custom Headers</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHeaders([...headers, { key: 'Authorization', value: 'Bearer ', enabled: true }])}
                  className="h-8 text-xs"
                >
                  + Bearer Token
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHeaders([...headers, { key: 'X-API-Key', value: '', enabled: true }])}
                  className="h-8 text-xs"
                >
                  + API Key
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHeader}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Header
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={header.enabled}
                    onCheckedChange={() => toggleHeader(index)}
                  />
                  <Input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    placeholder="Header name (e.g., Authorization)"
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    placeholder="Header value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {headers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No custom headers added</p>
                <p className="text-xs mt-1">Click "Add Header" to add authentication or custom headers</p>
              </div>
            )}
          </div>

          {/* Cookies */}
          <div className="space-y-2">
            <Label htmlFor="cookies">Cookies (Optional)</Label>
            <Textarea
              id="cookies"
              value={cookies}
              onChange={(e) => setCookies(e.target.value)}
              rows={3}
              className="font-mono text-sm"
              placeholder="session=abc123; token=xyz789"
            />
            <p className="text-xs text-muted-foreground">
              Paste cookies from browser DevTools (Format: name=value; name2=value2)
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CustomHeaders;
