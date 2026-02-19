import { Shield, ShieldCheck, ShieldAlert, ShieldX, Globe, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function SecurityItem({ label, value, status }) {
  const colors = {
    good: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    warn: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    bad: 'text-red-400 border-red-500/30 bg-red-500/5',
    info: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  };
  return (
    <div className={`flex items-start gap-2 p-2 rounded border ${colors[status] || colors.info}`}>
      <div className="shrink-0 mt-0.5">
        {status === 'good' ? <ShieldCheck className="w-3.5 h-3.5" /> :
         status === 'warn' ? <ShieldAlert className="w-3.5 h-3.5" /> :
         status === 'bad' ? <ShieldX className="w-3.5 h-3.5" /> :
         <Shield className="w-3.5 h-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium">{label}</div>
        <div className="text-[10px] opacity-80 break-all">{value}</div>
      </div>
    </div>
  );
}

export default function SecurityPanel({ securityHeaders, apis }) {
  if (!securityHeaders && !apis?.length) return null;

  const headers = securityHeaders || {};
  const items = [];

  // HTTPS
  items.push({
    label: 'HTTPS',
    value: apis?.every(a => a.url?.startsWith('https')) ? 'All endpoints use HTTPS' : 'Some endpoints use HTTP (insecure)',
    status: apis?.every(a => a.url?.startsWith('https')) ? 'good' : 'warn'
  });

  // CORS
  if (headers.cors) {
    items.push({
      label: 'CORS (Access-Control-Allow-Origin)',
      value: headers.cors,
      status: headers.cors === '*' ? 'warn' : 'good'
    });
  } else {
    items.push({ label: 'CORS', value: 'Not configured', status: 'info' });
  }

  // CSP
  if (headers.csp) {
    items.push({ label: 'Content Security Policy', value: headers.csp.substring(0, 150) + (headers.csp.length > 150 ? '...' : ''), status: 'good' });
  } else {
    items.push({ label: 'Content Security Policy', value: 'Not set — vulnerable to XSS', status: 'bad' });
  }

  // HSTS
  if (headers.hsts) {
    items.push({ label: 'Strict Transport Security', value: headers.hsts, status: 'good' });
  } else {
    items.push({ label: 'Strict Transport Security', value: 'Not set — vulnerable to downgrade attacks', status: 'warn' });
  }

  // X-Frame-Options
  if (headers.xFrameOptions) {
    items.push({ label: 'X-Frame-Options', value: headers.xFrameOptions, status: 'good' });
  } else {
    items.push({ label: 'X-Frame-Options', value: 'Not set — vulnerable to clickjacking', status: 'warn' });
  }

  // X-Content-Type-Options
  if (headers.xContentTypeOptions) {
    items.push({ label: 'X-Content-Type-Options', value: headers.xContentTypeOptions, status: 'good' });
  }

  // Referrer Policy
  if (headers.referrerPolicy) {
    items.push({ label: 'Referrer Policy', value: headers.referrerPolicy, status: 'good' });
  }

  // Server header (information leak)
  if (headers.server) {
    items.push({ label: 'Server Header', value: `${headers.server} — Version info exposed`, status: 'warn' });
  }
  if (headers.poweredBy) {
    items.push({ label: 'X-Powered-By', value: `${headers.poweredBy} — Technology stack exposed`, status: 'warn' });
  }

  // Auth analysis
  const authApis = apis?.filter(a => a.authentication) || [];
  if (authApis.length > 0) {
    const authTypes = [...new Set(authApis.flatMap(a => a.authentication?.map(auth => auth.type) || []))];
    items.push({ label: 'Authentication Methods', value: authTypes.join(', '), status: 'info' });
  }

  // CORS Deep Analysis
  const corsApis = apis?.filter(a => a.response?.cors?.allowOrigin) || [];
  if (corsApis.length > 0) {
    const wildcardCors = corsApis.filter(a => a.response.cors.allowOrigin === '*');
    const credentialCors = corsApis.filter(a => a.response.cors.credentials === 'true');
    if (wildcardCors.length > 0) {
      items.push({
        label: 'CORS Wildcard APIs',
        value: `${wildcardCors.length} endpoint${wildcardCors.length !== 1 ? 's' : ''} allow any origin (*). ${credentialCors.length > 0 ? 'WARNING: ' + credentialCors.length + ' also allow credentials!' : 'No credentials exposed.'}`,
        status: credentialCors.length > 0 ? 'bad' : 'warn'
      });
    }
  }

  // Mixed content check
  const httpApis = apis?.filter(a => a.url?.startsWith('http://')) || [];
  if (httpApis.length > 0) {
    items.push({
      label: 'Mixed Content',
      value: `${httpApis.length} endpoint${httpApis.length !== 1 ? 's' : ''} use insecure HTTP`,
      status: 'bad'
    });
  }

  // Exposed API keys check
  const exposedKeys = apis?.filter(a => {
    const url = a.url?.toLowerCase() || '';
    return url.includes('key=') || url.includes('api_key=') || url.includes('apikey=') || url.includes('token=');
  }) || [];
  if (exposedKeys.length > 0) {
    items.push({
      label: 'Exposed Keys in URL',
      value: `${exposedKeys.length} endpoint${exposedKeys.length !== 1 ? 's' : ''} may have API keys in query parameters`,
      status: 'warn'
    });
  }

  // Score
  const good = items.filter(i => i.status === 'good').length;
  const total = items.length;
  const score = Math.round((good / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">Security Analysis</span>
        </div>
        <Badge variant="secondary" className={`text-[10px] ${
          score >= 70 ? 'text-emerald-400 border-emerald-500/30' :
          score >= 40 ? 'text-amber-400 border-amber-500/30' :
          'text-red-400 border-red-500/30'
        }`}>
          Score: {score}%
        </Badge>
      </div>

      <div className="space-y-1.5">
        {items.map((item, i) => (
          <SecurityItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
}
