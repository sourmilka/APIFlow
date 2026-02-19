import { Globe, ArrowRight, Loader2, Settings2, Cookie, ExternalLink, ChevronDown, ChevronUp, Info, Zap, Shield, Search, CheckCircle2, Clock, Upload, FileJson, Clipboard, AlertTriangle, Key, Copy, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useMemo, useRef, useCallback } from 'react';

const POPULAR_SITES = [
  { url: 'https://github.com', label: 'GitHub', needsAuth: false },
  { url: 'https://api.github.com', label: 'GitHub API', needsAuth: false },
  { url: 'https://jsonplaceholder.typicode.com', label: 'JSONPlaceholder', needsAuth: false },
  { url: 'https://pokeapi.co', label: 'PokéAPI', needsAuth: false },
  { url: 'https://reddit.com', label: 'Reddit', needsAuth: true },
  { url: 'https://twitter.com', label: 'Twitter/X', needsAuth: true },
  { url: 'https://youtube.com', label: 'YouTube', needsAuth: true },
  { url: 'https://amazon.com', label: 'Amazon', needsAuth: true },
  { url: 'https://netflix.com', label: 'Netflix', needsAuth: true },
  { url: 'https://discord.com', label: 'Discord', needsAuth: true },
];

const SCAN_STEPS = [
  { label: 'Launching browser', icon: '🚀' },
  { label: 'Setting cookies & headers', icon: '🍪' },
  { label: 'Navigating to page', icon: '🌐' },
  { label: 'Intercepting API calls', icon: '📡' },
  { label: 'Capturing WebSockets', icon: '🔌' },
  { label: 'Scrolling & interacting', icon: '📜' },
  { label: 'Analyzing responses', icon: '🔍' },
  { label: 'Building results', icon: '✅' },
];

const COOKIE_METHODS = [
  {
    id: 'cookie-editor',
    name: 'Cookie Editor Extension',
    description: 'Best method — exports all cookies with proper domains',
    badge: 'Recommended',
    badgeColor: 'text-emerald-400 border-emerald-500/30',
    steps: [
      { text: 'Install', link: 'https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm', linkText: 'Cookie Editor for Chrome' },
      { text: 'Log into the website you want to scan' },
      { text: 'Click the Cookie Editor icon in toolbar' },
      { text: 'Click Export → Export as JSON' },
      { text: 'Paste the JSON below' },
    ]
  },
  {
    id: 'devtools',
    name: 'Browser DevTools',
    description: 'Quick method — copy from DevTools console',
    badge: 'Quick',
    badgeColor: 'text-blue-400 border-blue-500/30',
    steps: [
      { text: 'Log into the website' },
      { text: 'Open DevTools (F12)' },
      { text: 'Go to Console tab' },
      { text: 'Paste this command:', code: 'copy(document.cookie)' },
      { text: 'Paste the result below' },
    ]
  },
  {
    id: 'header',
    name: 'From Request Headers',
    description: 'Copy Cookie header from any network request',
    badge: 'Manual',
    badgeColor: 'text-amber-400 border-amber-500/30',
    steps: [
      { text: 'Open DevTools → Network tab' },
      { text: 'Find any request to the site' },
      { text: 'Right-click → Copy → Copy request headers' },
      { text: 'Find the "Cookie:" line and paste the value below' },
    ]
  },
];

/**
 * Detect cookie format and parse count
 */
function detectCookieFormat(input) {
  if (!input?.trim()) return { format: null, count: 0, valid: true };
  const trimmed = input.trim();

  // JSON array (Cookie Editor / EditThisCookie / HAR)
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return { format: 'json-array', count: 0, valid: false, error: 'Empty array' };
      if (parsed[0]?.name) return { format: 'Cookie Editor JSON', count: parsed.length, valid: true };
      return { format: 'json-array', count: parsed.length, valid: false, error: 'Cookies must have "name" field' };
    }
    if (typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      if (keys.length === 0) return { format: 'json-object', count: 0, valid: false, error: 'Empty object' };
      return { format: 'JSON object', count: keys.length, valid: true };
    }
  } catch { /* not JSON */ }

  // Netscape/wget format (tab-separated)
  if (trimmed.includes('\t')) {
    const lines = trimmed.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    const valid = lines.filter(l => l.split('\t').length >= 7);
    if (valid.length > 0) return { format: 'Netscape/wget format', count: valid.length, valid: true };
  }

  // Simple cookie string "name=value; name2=value2"
  if (trimmed.includes('=')) {
    const pairs = trimmed.split(';').filter(c => c.trim().includes('='));
    if (pairs.length > 0) return { format: 'Cookie header string', count: pairs.length, valid: true };
  }

  return { format: null, count: 0, valid: false, error: 'Unrecognized format. Use Cookie Editor JSON, header string, or name=value pairs.' };
}

export default function ScanDialog({ open, onOpenChange, onScan, loading }) {
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [activeCookieMethod, setActiveCookieMethod] = useState(null);
  const [userAgent, setUserAgent] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [cookiesInput, setCookiesInput] = useState('');
  const [deepScan, setDeepScan] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const cookieInfo = useMemo(() => detectCookieFormat(cookiesInput), [cookiesInput]);

  const filteredSuggestions = useMemo(() => {
    if (!url.trim() || url.includes('://')) return [];
    return POPULAR_SITES.filter(s =>
      s.label.toLowerCase().includes(url.toLowerCase()) || s.url.includes(url.toLowerCase())
    ).slice(0, 5);
  }, [url]);

  // Check if current URL likely needs auth
  const urlNeedsAuth = useMemo(() => {
    if (!url.trim()) return false;
    const lower = url.toLowerCase();
    return POPULAR_SITES.some(s => s.needsAuth && lower.includes(new URL(s.url).hostname)) ||
      lower.includes('dashboard') || lower.includes('account') || lower.includes('admin') ||
      lower.includes('app.') || lower.includes('my.') || lower.includes('portal') ||
      lower.includes('trade') || lower.includes('vision') || lower.includes('wallet');
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

  // Handle file drop / import
  const handleFileImport = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setCookiesInput(content);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.txt') || file.type === 'application/json' || file.type === 'text/plain')) {
      handleFileImport(file);
    }
  }, [handleFileImport]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setCookiesInput(text);
    } catch {
      // Clipboard API may be blocked
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (cookiesInput.trim() && !cookieInfo.valid) return;

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
      setActiveCookieMethod(null);
      setUserAgent('');
      setCustomHeaders('');
      setCookiesInput('');
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
            {cookiesInput.trim() && cookieInfo.valid && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1">
                <Cookie className="w-3 h-3" />
                Scanning with {cookieInfo.count} cookies ({cookieInfo.format})
              </div>
            )}
            <div className="flex items-center gap-1 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL Input */}
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
                        {site.needsAuth && <Key className="w-2.5 h-2.5 text-amber-400" />}
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

            {/* Auth warning banner — shown when URL likely needs cookies */}
            {urlNeedsAuth && !cookiesInput.trim() && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 animate-slide-up">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] space-y-1">
                  <p className="font-medium text-amber-400">This site likely requires authentication</p>
                  <p className="text-muted-foreground">
                    Many APIs only fire when you're logged in. Add your cookies below to capture <strong>all</strong> API calls including authenticated endpoints.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCookies(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    + Add cookies →
                  </button>
                </div>
              </div>
            )}

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

            {/* ── Cookie Authentication Section ─────────────────── */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCookies(!showCookies)}
                className={`flex items-center gap-2 w-full px-3 py-2.5 text-left transition-colors ${
                  showCookies ? 'bg-accent/30' : 'hover:bg-accent/50'
                } ${cookiesInput.trim() && cookieInfo.valid ? 'border-b-0' : ''}`}
              >
                <Cookie className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium flex-1">Cookie Authentication</span>
                {cookiesInput.trim() && cookieInfo.valid ? (
                  <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {cookieInfo.count} cookies
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">For logged-in pages</span>
                )}
                {showCookies ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              {showCookies && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3 animate-slide-up">
                  {/* Cookie import methods */}
                  <div className="flex gap-1.5 flex-wrap">
                    {COOKIE_METHODS.map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setActiveCookieMethod(activeCookieMethod === method.id ? null : method.id)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                          activeCookieMethod === method.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {method.name}
                      </button>
                    ))}
                  </div>

                  {/* Method instructions */}
                  {activeCookieMethod && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-[11px] space-y-2 animate-slide-up">
                      {(() => {
                        const method = COOKIE_METHODS.find(m => m.id === activeCookieMethod);
                        if (!method) return null;
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-primary">{method.name}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${method.badgeColor}`}>{method.badge}</span>
                            </div>
                            <p className="text-muted-foreground">{method.description}</p>
                            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                              {method.steps.map((step, i) => (
                                <li key={i}>
                                  {step.link ? (
                                    <>
                                      {step.text}{' '}
                                      <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">
                                        {step.linkText} <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </>
                                  ) : step.code ? (
                                    <>
                                      {step.text}
                                      <code className="ml-1 px-1.5 py-0.5 bg-background rounded text-[10px] font-mono text-emerald-400 select-all">{step.code}</code>
                                    </>
                                  ) : (
                                    step.text
                                  )}
                                </li>
                              ))}
                            </ol>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Cookie input area with drag-drop */}
                  <div
                    className={`relative rounded-lg border-2 border-dashed transition-colors ${
                      dragOver ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {dragOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-lg z-10">
                        <div className="flex items-center gap-2 text-primary text-sm">
                          <Upload className="w-5 h-5" />
                          Drop cookie file here
                        </div>
                      </div>
                    )}
                    <div className="p-0.5">
                      <div className="flex items-center justify-between px-2 pt-1.5">
                        <Label htmlFor="cookies" className="text-xs text-muted-foreground">Paste cookies</Label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10"
                            title="Paste from clipboard"
                          >
                            <Clipboard className="w-3 h-3" />
                            Paste
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10"
                            title="Import JSON file"
                          >
                            <FileJson className="w-3 h-3" />
                            Import
                          </button>
                          {cookiesInput && (
                            <button
                              type="button"
                              onClick={() => setCookiesInput('')}
                              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors px-1.5 py-0.5 rounded hover:bg-red-500/10"
                              title="Clear cookies"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.txt"
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) handleFileImport(e.target.files[0]); }}
                      />
                      <Textarea
                        id="cookies"
                        placeholder={`Paste cookies here — supports many formats:\n\n• Cookie Editor JSON: [{"name":"token","value":"abc",...}]\n• Header string: session=abc123; csrf=xyz789\n• document.cookie output\n• Netscape/wget format\n\nOr drag & drop a .json file`}
                        value={cookiesInput}
                        onChange={(e) => setCookiesInput(e.target.value)}
                        className={`border-0 shadow-none focus-visible:ring-0 bg-transparent text-xs min-h-[120px] font-mono resize-none ${
                          cookiesInput && !cookieInfo.valid ? 'text-red-400' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Cookie status indicator */}
                  {cookiesInput.trim() && (
                    <div className={`flex items-center gap-1.5 text-[10px] ${cookieInfo.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cookieInfo.valid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {cookieInfo.count} cookies loaded ({cookieInfo.format})
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          {cookieInfo.error}
                        </>
                      )}
                    </div>
                  )}

                  {/* Supported formats info */}
                  <div className="flex flex-wrap gap-1">
                    {['Cookie Editor JSON', 'Header string', 'Netscape/wget', 'JSON object', 'DevTools copy'].map(fmt => (
                      <span key={fmt} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {fmt}
                      </span>
                    ))}
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
              <Button type="submit" size="sm" className="gap-1.5" disabled={!url.trim() || (cookiesInput.trim() && !cookieInfo.valid)}>
                {cookiesInput.trim() && cookieInfo.valid && <Cookie className="w-3 h-3" />}
                Scan {cookiesInput.trim() && cookieInfo.valid ? `(${cookieInfo.count} cookies)` : ''}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
