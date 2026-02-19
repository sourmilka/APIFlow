import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
};

const borderColors = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
  warn: 'border-amber-500/30',
};

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`animate-slide-up flex items-center gap-2 px-4 py-3 rounded-lg border bg-card shadow-xl max-w-sm ${borderColors[t.type] || borderColors.info}`}
        >
          {icons[t.type] || icons.info}
          <span className="text-sm text-foreground flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
