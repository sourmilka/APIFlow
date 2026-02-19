import { Globe, ArrowRight, Loader2, Settings2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export default function ScanDialog({ open, onOpenChange, onScan, loading }) {
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

    let headers = {};
    if (customHeaders.trim()) {
      try {
        headers = JSON.parse(customHeaders.trim());
      } catch {
        // try key: value format
        customHeaders.split('\n').forEach((line) => {
          const [k, ...v] = line.split(':');
          if (k && v.length) headers[k.trim()] = v.join(':').trim();
        });
      }
    }

    onScan({ url: finalUrl, userAgent: userAgent.trim() || undefined, customHeaders: Object.keys(headers).length ? headers : undefined });
  };

  const handleClose = () => {
    if (!loading) {
      setUrl('');
      setShowAdvanced(false);
      setUserAgent('');
      setCustomHeaders('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Globe className="w-5 h-5 text-primary" />
            {loading ? 'Scanning...' : 'New API Scan'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20" />
              <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Analyzing website...</p>
              <p className="text-xs text-muted-foreground mt-1">Intercepting network requests and discovering APIs</p>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="url" className="text-xs text-muted-foreground">Website URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1.5 bg-background"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                We'll visit this page and intercept all API calls made by the website.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="w-3 h-3" />
              Advanced options
            </button>

            {showAdvanced && (
              <div className="space-y-3 animate-slide-up">
                <div>
                  <Label htmlFor="ua" className="text-xs text-muted-foreground">Custom User-Agent</Label>
                  <Input
                    id="ua"
                    placeholder="Mozilla/5.0..."
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    className="mt-1 bg-background text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="headers" className="text-xs text-muted-foreground">Custom Headers (JSON or Key: Value per line)</Label>
                  <Textarea
                    id="headers"
                    placeholder={'{"Authorization": "Bearer xxx"}\nor\nAuthorization: Bearer xxx'}
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    className="mt-1 bg-background text-xs min-h-[80px] font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5" disabled={!url.trim()}>
                Scan <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
