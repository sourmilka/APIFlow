import { useState, useCallback, useMemo, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Toolbar from '@/components/layout/Toolbar';
import EmptyState from '@/components/EmptyState';
import ApiList from '@/components/ApiList';
import ApiDetailPanel from '@/components/ApiDetailPanel';
import StatsBar from '@/components/StatsBar';
import ScanDialog from '@/components/ScanDialog';
import ShortcutsDialog from '@/components/ShortcutsDialog';
import ToastContainer from '@/components/ToastContainer';
import { useToast } from '@/hooks/useToast';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import { endpoints, apiPost } from '@/config/api';
import { loadSessions, saveSessions } from '@/constants/brand';

export default function App() {
  // ── State ─────────────────────────────────────────────────
  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [selectedApiId, setSelectedApiId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const abortRef = useRef(null);
  const { toasts, toast, removeToast } = useToast();

  // ── Derived ───────────────────────────────────────────────
  const activeSession = useMemo(
    () => sessions.find((s) => s.sessionId === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const filteredApis = useMemo(() => {
    if (!activeSession) return [];
    let list = activeSession.apis || [];
    if (filterMethod) list = list.filter((a) => a.method === filterMethod);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.url.toLowerCase().includes(q) || a.method.toLowerCase().includes(q));
    }
    return list;
  }, [activeSession, filterMethod, searchQuery]);

  const selectedApi = useMemo(
    () => (activeSession?.apis || []).find((a) => a.id === selectedApiId) || null,
    [activeSession, selectedApiId]
  );

  // ── Actions ───────────────────────────────────────────────
  const persistSessions = useCallback((next) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  const handleScan = useCallback(async ({ url, userAgent, customHeaders }) => {
    setScanning(true);
    abortRef.current = new AbortController();
    try {
      console.log(`[APIFlow] Scanning: ${url}`);
      const data = await apiPost(endpoints.parse, { url, userAgent, customHeaders }, abortRef.current.signal);
      console.log(`[APIFlow] Found ${data.totalApis} APIs in ${data.duration}ms`);

      const session = {
        sessionId: data.sessionId,
        url: data.url,
        apis: data.apis || [],
        webSockets: data.webSockets || [],
        totalApis: data.totalApis || 0,
        duration: data.duration,
        timestamp: new Date().toISOString(),
      };

      const next = [session, ...sessions.filter((s) => s.sessionId !== session.sessionId)];
      persistSessions(next);
      setActiveSessionId(session.sessionId);
      setSelectedApiId(null);
      setSearchQuery('');
      setFilterMethod('');
      setScanDialogOpen(false);
      toast.success(`Found ${session.totalApis} API endpoint${session.totalApis !== 1 ? 's' : ''}`);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[APIFlow] Scan error:', err);
      toast.error(err.message || 'Scan failed');
    } finally {
      setScanning(false);
      abortRef.current = null;
    }
  }, [sessions, persistSessions, toast]);

  const handleRescan = useCallback(() => {
    if (!activeSession) return;
    setScanDialogOpen(false);
    handleScan({ url: activeSession.url });
  }, [activeSession, handleScan]);

  const handleNew = useCallback(() => {
    setScanDialogOpen(true);
  }, []);

  const handleDeleteSession = useCallback((id) => {
    const next = sessions.filter((s) => s.sessionId !== id);
    persistSessions(next);
    if (activeSessionId === id) {
      setActiveSessionId(next[0]?.sessionId || null);
      setSelectedApiId(null);
    }
    toast.info('Session deleted');
  }, [sessions, activeSessionId, persistSessions, toast]);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied to clipboard'),
      () => toast.error('Failed to copy')
    );
  }, [toast]);

  const handleExport = useCallback(() => {
    if (!activeSession) return;
    const blob = new Blob([JSON.stringify(activeSession, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    let hostname = 'export';
    try { hostname = new URL(activeSession.url).hostname; } catch {}
    a.download = `apiflow-${hostname}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported JSON');
  }, [activeSession, toast]);

  // ── Keyboard ──────────────────────────────────────────────
  useKeyboardShortcuts({
    onNew: handleNew,
    onExport: handleExport,
    onRescan: handleRescan,
    onEscape: () => {
      if (selectedApiId) setSelectedApiId(null);
      else if (scanDialogOpen && !scanning) setScanDialogOpen(false);
      else if (shortcutsOpen) setShortcutsOpen(false);
    },
    onShortcuts: () => setShortcutsOpen(true),
  });

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={(id) => { setActiveSessionId(id); setSelectedApiId(null); setSearchQuery(''); setFilterMethod(''); }}
        onNew={handleNew}
        onDelete={handleDeleteSession}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeSession ? (
          <>
            <StatsBar apis={activeSession.apis || []} url={activeSession.url} duration={activeSession.duration} />
            <Toolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalApis={filteredApis.length}
              filterMethod={filterMethod}
              onFilterMethod={setFilterMethod}
              onExport={handleExport}
              onRescan={handleRescan}
              onShowShortcuts={() => setShortcutsOpen(true)}
            />
            <div className="flex flex-1 min-h-0">
              <ApiList
                apis={filteredApis}
                selectedId={selectedApiId}
                onSelect={(id) => setSelectedApiId(selectedApiId === id ? null : id)}
                onCopy={handleCopy}
              />
              {selectedApi && (
                <ApiDetailPanel
                  api={selectedApi}
                  onClose={() => setSelectedApiId(null)}
                  onCopy={handleCopy}
                />
              )}
            </div>
          </>
        ) : (
          <EmptyState onNew={handleNew} />
        )}
      </main>

      {/* Dialogs */}
      <ScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onScan={handleScan}
        loading={scanning}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
