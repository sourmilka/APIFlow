import { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CODE_LANGUAGES, WS_LANGUAGES, generateSSEClient } from '@/utils/codeGen';

function CodeBlock({ code, onCopy }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="text-[11px] font-mono bg-background rounded-md p-3 overflow-auto max-h-72 whitespace-pre-wrap break-all border border-border">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-muted/80 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function CodeGenerator({ api, ws, sse, onCopy, type = 'api' }) {
  const [selectedLang, setSelectedLang] = useState(0);

  if (type === 'sse' && sse) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">SSE Client Code</span>
        </div>
        <CodeBlock code={generateSSEClient(sse)} onCopy={onCopy} />
      </div>
    );
  }

  if (type === 'websocket' && ws) {
    const langs = WS_LANGUAGES;
    const code = langs[selectedLang]?.generator(ws) || '';
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">WebSocket Client Code</span>
        </div>
        <div className="flex gap-1">
          {langs.map((lang, i) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(i)}
              className={`px-2 py-1 text-[10px] font-medium rounded border transition-colors ${
                selectedLang === i ? 'bg-primary/15 text-primary border-primary/30' : 'text-muted-foreground border-transparent hover:bg-accent'
              }`}
            >
              <span className="mr-1">{lang.icon}</span>
              {lang.name}
            </button>
          ))}
        </div>
        <CodeBlock code={code} onCopy={onCopy} />
      </div>
    );
  }

  if (!api) return null;

  const langs = CODE_LANGUAGES;
  let code = '';
  try {
    code = langs[selectedLang]?.generator(api) || '';
  } catch {
    code = '// Error generating code for this endpoint';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">Code Snippet</span>
      </div>
      <div className="flex gap-1">
        {langs.map((lang, i) => (
          <button
            key={lang.id}
            onClick={() => setSelectedLang(i)}
            className={`px-2 py-1 text-[10px] font-medium rounded border transition-colors ${
              selectedLang === i ? 'bg-primary/15 text-primary border-primary/30' : 'text-muted-foreground border-transparent hover:bg-accent'
            }`}
          >
            <span className="mr-1">{lang.icon}</span>
            {lang.name}
          </button>
        ))}
      </div>
      <CodeBlock code={code} onCopy={onCopy} />
    </div>
  );
}
