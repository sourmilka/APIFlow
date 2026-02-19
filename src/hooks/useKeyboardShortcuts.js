import { useEffect } from 'react';

export default function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    function onKeyDown(e) {
      // Don't trigger when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'n') { e.preventDefault(); handlers.onNew?.(); }
      if (ctrl && e.key === 'e') { e.preventDefault(); handlers.onExport?.(); }
      if (ctrl && e.key === 'r') { e.preventDefault(); handlers.onRescan?.(); }
      if (e.key === 'Escape') { handlers.onEscape?.(); }
      if (ctrl && e.key === '/') { e.preventDefault(); handlers.onShortcuts?.(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
