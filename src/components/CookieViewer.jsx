import { Cookie, Shield, Lock, Globe, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CookieViewer({ cookies, onClose }) {
  if (!cookies || cookies.length === 0) {
    return (
      <div className="w-[420px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Cookie className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">Page Cookies</span>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
          No cookies captured from this page.
        </div>
      </div>
    );
  }

  const secureCookies = cookies.filter(c => c.secure);
  const httpOnlyCookies = cookies.filter(c => c.httpOnly);
  const sessionCookies = cookies.filter(c => !c.expires || c.expires === -1);
  const domains = [...new Set(cookies.map(c => c.domain))];

  return (
    <div className="w-[420px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Cookie className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">Page Cookies</span>
          <Badge variant="secondary" className="text-[10px]">{cookies.length}</Badge>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
      </div>

      {/* Cookie Stats */}
      <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-border">
        <Badge variant="secondary" className="text-[10px] gap-1">
          <Globe className="w-2.5 h-2.5" />
          {domains.length} domain{domains.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-400 border-emerald-500/30">
          <Lock className="w-2.5 h-2.5" />
          {secureCookies.length} secure
        </Badge>
        <Badge variant="secondary" className="text-[10px] gap-1 text-blue-400 border-blue-500/30">
          <Shield className="w-2.5 h-2.5" />
          {httpOnlyCookies.length} httpOnly
        </Badge>
        <Badge variant="secondary" className="text-[10px] gap-1 text-amber-400 border-amber-500/30">
          <Clock className="w-2.5 h-2.5" />
          {sessionCookies.length} session
        </Badge>
      </div>

      {/* Security Info */}
      {secureCookies.length < cookies.length && (
        <div className="px-4 py-1.5 border-b border-border">
          <div className="flex items-center gap-1 text-[10px] text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            {cookies.length - secureCookies.length} cookie{cookies.length - secureCookies.length !== 1 ? 's are' : ' is'} not marked Secure
          </div>
        </div>
      )}

      {/* Cookie List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {cookies.map((cookie, i) => (
            <div key={i} className="p-2.5 rounded-md border border-border bg-background/50 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-foreground truncate flex-1">{cookie.name}</span>
                <div className="flex gap-0.5">
                  {cookie.secure && <Badge variant="secondary" className="text-[9px] px-1 py-0 text-emerald-400 border-emerald-500/30">S</Badge>}
                  {cookie.httpOnly && <Badge variant="secondary" className="text-[9px] px-1 py-0 text-blue-400 border-blue-500/30">H</Badge>}
                  {cookie.sameSite && <Badge variant="secondary" className="text-[9px] px-1 py-0">{cookie.sameSite}</Badge>}
                </div>
              </div>
              <div className="text-[10px] font-mono text-foreground/60 break-all truncate">{cookie.value || '(empty)'}</div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span>{cookie.domain}</span>
                <span>{cookie.path}</span>
                {cookie.expires && cookie.expires > 0 && (
                  <span className="ml-auto">expires {new Date(cookie.expires * 1000).toLocaleDateString()}</span>
                )}
                {(!cookie.expires || cookie.expires === -1) && (
                  <span className="ml-auto italic">session</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
