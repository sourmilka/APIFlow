import { Globe, ArrowRight, Loader2, Settings2, Cookie, ExternalLink, ChevronDown, ChevronUp, Info, Zap, Shield, Search, CheckCircle2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useMemo } from 'react';

const POPULAR_SITES = [
  { url: 'https://github.com', label: 'GitHub' },
  { url: 'https://api.github.com', label: 'GitHub API' },
  { url: 'https://jsonplaceholder.typicode.com', label: 'JSONPlaceholder' },
  { url: 'https://pokeapi.co', label: 'PokéAPI' },
  { url: 'https://reddit.com', label: 'Reddit' },
  { url: 'https://twitter.com', label: 'Twitter/X' },
  { url: 'https://youtube.com', label: 'YouTube' },
  { url: 'https://amazon.com', label: 'Amazon' },
  { url: 'https://netflix.com', label: 'Netflix' },
  { url: 'https://discord.com', label: 'Discord' },
];

const SCAN_STEPS = [
  { label: 'Launching browser', icon: '🚀' },
  { label: 'Setting cookies & headers', icon: '🍪' },
  { label: 'Navigating to page', icon: '🌐' },
  { label: 'Intercepting API calls', icon: '📡' },
  { label: 'Capturing WebSockets', icon: '🔌' },
  { label: 'Scrolling page', icon: '📜' },
  { label: 'Analyzing responses', icon: '🔍' },
  { label: 'Building results', icon: '✅' },
];

export default function ScanDialog({ open, onOpenChange, onScan, loading }) {
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showCookieGuide, setShowCookieGuide] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [cookiesInput, setCookiesInput] = useState('');
  const [cookieError, setCookieError] = useState('');
  const [deepScan, setDeepScan] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!url.trim() || url.includes('://')) return [];
    return POPULAR_SITES.filter(s =>
      s.label.toLowerCase().includes(url.toLowerCase()) || s.url.includes(url.toLowerCase())
    ).slice(0, 5);
  }, [url]);

  // Progress simulation during scan
  const [scanStep, setScanStep] = useState(0);
  useState(() => {
    if (!loading) { setScanStep(0); return; }
    let step = 0;
    const interval = setInterval(() => {
      step = Math.min(step + 1, SCAN_STEPS.length - 1);
      setScanStep(step);
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  const validateCookies = (input) => {
    if (!input.trim()) { setCookieError(''); return true; }
    try {
      const parsed = JSON.parse(input.trim());
      if (!Array.isArray(parsed)) { setCookieError('Must be a JSON array from Cookie Editor'); return false; }
      if (parsed.length === 0) { setCookieError('Cookie array is empty'); return false; }
      const first = parsed[0];
      if (!first.name || !first.value) { setCookieError('Cookies must have "name" and "value" fields'); return false; }
      setCookieError('');
      return true;
    } catch {
      // Try simple format
      if (input.includes('=')) { setCookieError(''); return true; }
      setCookieError('Invalid format. Use Cookie Editor JSON or name=value pairs');
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!validateCookies(cookiesInput)) return;

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

    let headers = {};
    if (customHeaders.trim()) {
      try {
        headers = JSON.parse(customHeaders.trim());
      } catch {
        customHeaders.split('\n').forEach((line) => {
          const [k, ...v] = line.split(':');
          if (k && v.length) headers[k.trim()] = v.join(':').trim();
        });
      }
    }

    let cookies = undefined;
    if (cookiesInput.trim()) {
      try {
        cookies = JSON.parse(cookiesInput.trim());
      } catch {
        cookies = cookiesInput.trim(); // pass as simple string
      }
    }

    onScan({
      url: finalUrl,
      userAgent: userAgent.trim() || undefined,
      customHeaders: Object.keys(headers).length ? headers : undefined,
      cookies,
      options: { deepScan }
    });
  };

  const handleClose = () => {
    if (!loading) {
      setUrl('');
      setShowAdvanced(false);
      setShowCookies(false);
      setShowCookieGuide(false);
      setUserAgent('');
      setCustomHeaders('');
      setCookiesInput('');
      setCookieError('');
      setDeepScan(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Globe className="w-5 h-5 text-primary" />
            {loading ? 'Scanning...' : 'New API Scan'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20" />
              <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Analyzing website...</p>
              <p className="text-xs text-muted-foreground mt-1">Intercepting APIs, WebSockets, and SSE connections</p>
            </div>
            {/* Step progress indicator */}
            <div className="w-full max-w-xs space-y-1.5 mt-2">
              {SCAN_STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-[11px] transition-all duration-300 ${
                  i < scanStep ? 'text-emerald-400' : i === scanStep ? 'text-primary' : 'text-muted-foreground/40'
                }`}>
                  <span className="w-4 text-center">
                    {i < scanStep ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> :
                     i === scanStep ? <Clock className="w-3.5 h-3.5 animate-pulse text-primary" /> :
                     <span className="text-[10px]">{step.icon}</span>}
                  </span>
                  <span>{step.label}</span>
                  {i === scanStep && <span className="text-[9px] text-muted-foreground animate-pulse">...</span>}
                </div>
              ))}
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
              <div className="relative">
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="mt-1.5 bg-background"
                  autoFocus
                  autoComplete="off"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg overflow-hidden animate-slide-up">
                    {filteredSuggestions.map(site => (
                      <button
                        key={site.url}
                        type="button"
                        onClick={() => { setUrl(site.url); setShowSuggestions(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-xs transition-colors"
                      >
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{site.label}</span>
                        <span className="text-muted-foreground text-[10px] ml-auto">{site.url}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                We'll intercept all API calls, WebSocket connections, and SSE streams.
              </p>
            </div>

            {/* Deep Scan toggle */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={deepScan}
                onChange={(e) => setDeepScan(e.target.checked)}
                className="rounded border-border bg-background accent-primary w-4 h-4"
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Deep Scan — Click buttons & interactive elements to discover more APIs
              </span>
            </label>

            {/* Cookie Authentication Section */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCookies(!showCookies)}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
              >
                <Cookie className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium flex-1">Cookie Authentication</span>
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">For logged-in pages</span>
                {showCookies ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              {showCookies && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3 animate-slide-up">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="cookies" className="text-xs text-muted-foreground">Paste Cookie Editor JSON</Label>
                      <button
                        type="button"
                        onClick={() => setShowCookieGuide(!showCookieGuide)}
                        className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        How to get cookies?
                      </button>
                    </div>

                    {showCookieGuide && (
                      <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-[11px] space-y-2 animate-slide-up">
                        <p className="font-medium text-primary">How to export cookies:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Install the <a href="https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">Cookie Editor extension <ExternalLink className="w-2.5 h-2.5" /></a></li>
                          <li>Log into the website you want to scan</li>
                          <li>Click the Cookie Editor icon in your browser toolbar</li>
                          <li>Click <strong>Export</strong> → <strong>Export as JSON</strong></li>
                          <li>Paste the JSON array below</li>
                        </ol>
                        <p className="text-muted-foreground/80 italic">This lets APIFlow browse the site as if you're logged in, capturing authenticated API calls.</p>
                      </div>
                    )}

                    <Textarea
                      id="cookies"
                      placeholder={`[\n  {\n    "name": "session_token",\n    "value": "abc123...",\n    "domain": ".example.com",\n    "path": "/"\n  }\n]`}
                      value={cookiesInput}
                      onChange={(e) => { setCookiesInput(e.target.value); validateCookies(e.target.value); }}
                      className={`mt-1 bg-background text-xs min-h-[100px] font-mono ${cookieError ? 'border-red-500/50' : ''}`}
                    />
                    {cookieError && <p className="text-[10px] text-red-400 mt-1">{cookieError}</p>}
                    {cookiesInput && !cookieError && (
                      <p className="text-[10px] text-emerald-400 mt-1">
                        ✓ {(() => { try { const c = JSON.parse(cookiesInput); return Array.isArray(c) ? `${c.length} cookies loaded` : 'Valid cookies'; } catch { return 'Cookie string format'; }})()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="w-3 h-3" />
              Advanced options
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
              <Button type="submit" size="sm" className="gap-1.5" disabled={!url.trim() || !!cookieError}>
                Scan <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
