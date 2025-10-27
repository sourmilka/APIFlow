import { useEffect } from 'react';

export const useKeyboardShortcuts = (handlers) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const modifier = ctrlKey || metaKey;

      // Ctrl/Cmd + K - Search
      if (modifier && key === 'k') {
        event.preventDefault();
        handlers.onSearch?.();
      }

      // Ctrl/Cmd + E - Export
      if (modifier && key === 'e') {
        event.preventDefault();
        handlers.onExport?.();
      }

      // Ctrl/Cmd + R - Retry/Refresh
      if (modifier && key === 'r') {
        event.preventDefault();
        handlers.onRetry?.();
      }

      // Ctrl/Cmd + H - Custom Headers
      if (modifier && key === 'h') {
        event.preventDefault();
        handlers.onHeaders?.();
      }

      // Ctrl/Cmd + T - Test API
      if (modifier && key === 't') {
        event.preventDefault();
        handlers.onTest?.();
      }

      // Ctrl/Cmd + D - Dark Mode
      if (modifier && key === 'd') {
        event.preventDefault();
        handlers.onDarkMode?.();
      }

      // Ctrl/Cmd + / - Help
      if (modifier && key === '/') {
        event.preventDefault();
        handlers.onHelp?.();
      }

      // Ctrl/Cmd + Shift + P - Performance Metrics
      if (modifier && shiftKey && key === 'P') {
        event.preventDefault();
        handlers.onMetrics?.();
      }

      // Escape - Close/Cancel
      if (key === 'Escape') {
        handlers.onEscape?.();
      }

      // Arrow keys for navigation
      if (key === 'ArrowUp' && !modifier) {
        event.preventDefault();
        handlers.onNavigateUp?.();
      }

      if (key === 'ArrowDown' && !modifier) {
        event.preventDefault();
        handlers.onNavigateDown?.();
      }

      // Enter - Select/Confirm
      if (key === 'Enter' && !modifier) {
        handlers.onEnter?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
};

// Keyboard shortcuts help component
export const KeyboardShortcutsHelp = ({ onClose }) => {
  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Focus search' },
    { keys: ['Ctrl', 'E'], description: 'Export data' },
    { keys: ['Ctrl', 'R'], description: 'Retry parsing' },
    { keys: ['Ctrl', 'H'], description: 'Custom headers' },
    { keys: ['Ctrl', 'T'], description: 'Test selected API' },
    { keys: ['Ctrl', 'D'], description: 'Toggle dark mode' },
    { keys: ['Ctrl', '/'], description: 'Show this help' },
    { keys: ['Ctrl', 'Shift', 'P'], description: 'Toggle performance metrics' },
    { keys: ['Esc'], description: 'Close/Cancel' },
    { keys: ['↑', '↓'], description: 'Navigate APIs' },
    { keys: ['Enter'], description: 'Select API' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h3>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {shortcuts.map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{shortcut.description}</span>
                <div className="flex gap-1 items-center">
                  {shortcut.keys.map((key, kidx) => (
                    <div key={kidx} className="flex items-center gap-1">
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded shadow-sm">
                        {key}
                      </kbd>
                      {kidx < shortcut.keys.length - 1 && (
                        <span className="text-muted-foreground text-xs">+</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 h-9 bg-primary hover:bg-primary/90 text-black rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
