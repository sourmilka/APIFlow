import { Globe, Scan, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/constants/brand';

export default function EmptyState({ onNew }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center mb-6">
          <Globe className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">{BRAND.name}</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          {BRAND.tagline}. Enter any website URL and we'll intercept, analyze, and document every API call it makes.
        </p>

        <Button size="lg" className="gap-2" onClick={onNew}>
          <Scan className="w-4 h-4" />
          Start Your First Scan
          <ArrowRight className="w-4 h-4" />
        </Button>

        <div className="mt-10 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'APIs', desc: 'XHR, Fetch, GraphQL' },
            { label: 'WebSockets', desc: 'Real-time connections' },
            { label: 'Auth', desc: 'Cookies, Bearer, API Keys' },
            { label: 'Code Gen', desc: 'cURL, JS, Python, Node' },
            { label: 'Security', desc: 'CSP, CORS, HSTS scan' },
            { label: 'Export', desc: 'JSON, CSV, Postman' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-card border border-border">
              <div className="text-xs font-semibold text-primary">{item.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
