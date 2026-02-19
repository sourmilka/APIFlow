import { Download, FileJson, FileSpreadsheet, FileCode, FileText, BookOpen } from 'lucide-react';
import { EXPORT_FORMATS, downloadFile } from '@/utils/exporters';
import { useState, useRef, useEffect } from 'react';

const FORMAT_ICONS = {
  json: FileJson,
  csv: FileSpreadsheet,
  curl: FileCode,
  postman: FileJson,
  markdown: BookOpen,
};

export default function ExportMenu({ session, onExport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = (format) => {
    if (!session) return;
    try {
      const content = format.fn(session);
      let hostname = 'export';
      try { hostname = new URL(session.url).hostname; } catch {}
      const filename = `apiflow-${hostname}-${new Date().toISOString().slice(0, 10)}.${format.ext}`;
      downloadFile(content, filename, format.mime);
      onExport?.(format.id);
    } catch (e) {
      console.error('Export error:', e);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-7 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Export results"
      >
        <Download className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-xl z-50 animate-slide-up overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[11px] font-medium text-muted-foreground">Export As</p>
          </div>
          {EXPORT_FORMATS.map(format => {
            const Icon = FORMAT_ICONS[format.id] || FileText;
            return (
              <button
                key={format.id}
                onClick={() => handleExport(format)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <div>
                  <div className="text-xs font-medium">{format.name}</div>
                  <div className="text-[10px] text-muted-foreground">.{format.ext} file</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
