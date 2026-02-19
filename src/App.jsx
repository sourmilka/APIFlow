import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Toolbar from '@/components/layout/Toolbar';
import EmptyState from '@/components/EmptyState';
import ApiList from '@/components/ApiList';
import ApiDetailPanel from '@/components/ApiDetailPanel';
import StatsBar from '@/components/StatsBar';
import ScanDialog from '@/components/ScanDialog';
import ShortcutsDialog from '@/components/ShortcutsDialog';
import ToastContainer from '@/components/ToastContainer';
import { WebSocketList, WebSocketDetailPanel } from '@/components/WebSocketPanel';
import SecurityPanel from '@/components/SecurityPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import LogViewer from '@/components/LogViewer';
import CookieViewer from '@/components/CookieViewer';
import WaterfallTimeline from '@/components/WaterfallTimeline';
import { useToast } from '@/hooks/useToast';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import { endpoints, apiPost } from '@/config/api';
import { loadSessions, saveSessions } from '@/constants/brand';
import { EXPORT_FORMATS, downloadFile } from '@/utils/exporters';
import { logger } from '@/utils/logger';

/**
 * APIFlow v5.0 — 70 Features
 * ─────────────────────────────────────────
 *  1-50. All v4.0 features (scan, auth, capture, code gen, export, etc.)
 *  51. JSON Tree Viewer (collapsible response body viewer)
 *  52. API Replay / Try It (execute API call from browser)
 *  53. Request Waterfall Timeline (visual timing chart)
 *  54. Duplicate API Detection (same-path badge)
 *  55. Pin/Bookmark APIs (star & pin to top)
 *  56. HAR Export (HTTP Archive format)
 *  57. Response Body Search (search in payloads)
 *  58. Group By Host toggle (collapsible host groups)
 *  59. Copy All Endpoints (batch copy URLs)
 *  60. Share Session (copy compressed session data)
 *  61. Cookie Viewer (page cookies panel)
 *  62. Response Size Indicator (visual bars)
 *  63. Dark/Light Theme Toggle
 *  64. Inline Response Preview (preview in API list)
 *  65. Connection Info Display (server, CDN, cf-ray)
 *  66. URL Path Breakdown (visual segments)
 *  67. CORS Deep Validator (wildcard + credential warnings)
 *  68. WebSocket Frame Stats (sent/received/sizes/rates)
 *  69. URL Auto-suggest (popular sites dropdown)
 *  70. Real-time Scan Progress (step-by-step indicator)
 */

export default function App() {
  // ── State ─────────────────────────────────────────────────
  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [selectedApiId, setSelectedApiId] = useState(null);
  const [selectedWsId, setSelectedWsId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [activeTab, setActiveTab] = useState('apis');
  const [rightPanel, setRightPanel] = useState(null); // 'analytics', 'security', 'logs', 'waterfall', 'cookies'
  const [pinnedIds, setPinnedIds] = useState([]);
  const [groupByHost, setGroupByHost] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('apiflow-theme') || 'dark');
  const abortRef = useRef(null);
  const { toasts, toast, removeToast } = useToast();

  // ── Theme effect ─────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('apiflow-theme', theme);
  }, [theme]);

  // ── Derived ───────────────────────────────────────────────
  const activeSession = useMemo(
    () => sessions.find((s) => s.sessionId === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const filteredApis = useMemo(() => {
    if (!activeSession) return [];
    let list = activeSession.apis || [];
    if (filterMethod) list = list.filter((a) => a.method === filterMethod);
    if (filterStatus) {
      list = list.filter(a => {
        if (!a.response?.status) return false;
        return `${Math.floor(a.response.status / 100)}xx` === filterStatus;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.url.toLowerCase().includes(q) || a.method.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) || a.explanations?.some(e => e.toLowerCase().includes(q)) ||
        a.hostname?.toLowerCase().includes(q) ||
        // Response body search (Feature 57)
        (a.response?.data && JSON.stringify(a.response.data).toLowerCase().includes(q))
      );
    }
    // Sort
    if (sortBy === 'time-asc') list = [...list].sort((a, b) => (a.response?.responseTime || 0) - (b.response?.responseTime || 0));
    else if (sortBy === 'time-desc') list = [...list].sort((a, b) => (b.response?.responseTime || 0) - (a.response?.responseTime || 0));
    else if (sortBy === 'url') list = [...list].sort((a, b) => a.url.localeCompare(b.url));
    else if (sortBy === 'status') list = [...list].sort((a, b) => (a.response?.status || 0) - (b.response?.status || 0));
    return list;
  }, [activeSession, filterMethod, filterStatus, searchQuery, sortBy]);

  const selectedApi = useMemo(
    () => (activeSession?.apis || []).find((a) => a.id === selectedApiId) || null,
    [activeSession, selectedApiId]
  );

  const selectedWs = useMemo(
    () => (activeSession?.webSockets || []).find((w) => w.id === selectedWsId) || null,
    [activeSession, selectedWsId]
  );

  // ── Actions ───────────────────────────────────────────────
  const persistSessions = useCallback((next) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  const handleScan = useCallback(async ({ url, userAgent, customHeaders, cookies, options }) => {
    setScanning(true);
    abortRef.current = new AbortController();
    logger.scanStart(url);
    try {
      const data = await apiPost(endpoints.parse, { url, userAgent, customHeaders, cookies, options }, abortRef.current.signal);
      logger.scanComplete(url, data.totalApis, data.duration);

      const session = {
        sessionId: data.sessionId,
        url: data.url,
        name: null, // Feature 42: renamable session
        apis: data.apis || [],
        webSockets: data.webSockets || [],
        sse: data.sse || [],
        analytics: data.analytics || null,
        securityHeaders: data.securityHeaders || null,
        pageInfo: data.pageInfo || null,
        pageResources: data.pageResources || null,
        pageCookies: data.pageCookies || [],
        redirectChain: data.redirectChain || [],
        consoleMessages: data.consoleMessages || [],
        pageErrors: data.pageErrors || [],
        serverLogs: data.logs || [],
        totalApis: data.totalApis || 0,
        totalWebSockets: data.totalWebSockets || 0,
        totalSSE: data.totalSSE || 0,
        duration: data.duration,
        timestamp: new Date().toISOString(),
      };

      const next = [session, ...sessions.filter((s) => s.sessionId !== session.sessionId)];
      persistSessions(next);
      setActiveSessionId(session.sessionId);
      setSelectedApiId(null);
      setSelectedWsId(null);
      setSearchQuery('');
      setFilterMethod('');
      setFilterStatus('');
      setSortBy('');
      setActiveTab('apis');
      setRightPanel(null);
      setScanDialogOpen(false);

      const parts = [`${session.totalApis} API${session.totalApis !== 1 ? 's' : ''}`];
      if (session.totalWebSockets > 0) parts.push(`${session.totalWebSockets} WebSocket${session.totalWebSockets !== 1 ? 's' : ''}`);
      if (session.totalSSE > 0) parts.push(`${session.totalSSE} SSE`);
      toast.success(`Found ${parts.join(', ')}`);
    } catch (err) {
      if (err.name === 'AbortError') return;
      logger.scanError(url, err.message);
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
      setSelectedWsId(null);
    }
    toast.info('Session deleted');
    logger.info('Session deleted', { id });
  }, [sessions, activeSessionId, persistSessions, toast]);

  // Feature 42: Rename session
  const handleRenameSession = useCallback((id, name) => {
    const next = sessions.map(s => s.sessionId === id ? { ...s, name } : s);
    persistSessions(next);
    logger.featureUsed('rename-session', { id, name });
  }, [sessions, persistSessions]);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(
      () => { toast.success('Copied to clipboard'); logger.featureUsed('copy'); },
      () => toast.error('Failed to copy')
    );
  }, [toast]);

  // Feature 59: Copy All Endpoints
  const handleCopyAll = useCallback(() => {
    if (!activeSession) return;
    const urls = (activeSession.apis || []).map(a => a.url).join('\n');
    navigator.clipboard.writeText(urls).then(
      () => { toast.success(`Copied ${activeSession.apis.length} URLs`); logger.featureUsed('copy-all'); },
      () => toast.error('Failed to copy')
    );
  }, [activeSession, toast]);

  // Feature 55: Pin/Bookmark APIs
  const handlePin = useCallback((apiId) => {
    setPinnedIds(prev => prev.includes(apiId) ? prev.filter(id => id !== apiId) : [...prev, apiId]);
    logger.featureUsed('pin-api', { apiId });
  }, []);

  // Feature 60: Share Session
  const handleShareSession = useCallback(() => {
    if (!activeSession) return;
    const shareData = {
      url: activeSession.url,
      totalApis: activeSession.totalApis,
      totalWebSockets: activeSession.totalWebSockets,
      apis: (activeSession.apis || []).map(a => ({
        method: a.method, url: a.url, status: a.response?.status,
        responseTime: a.response?.responseTime, category: a.category
      })),
      timestamp: activeSession.timestamp
    };
    const json = JSON.stringify(shareData);
    const encoded = btoa(json);
    navigator.clipboard.writeText(encoded).then(
      () => toast.success('Session data copied! Share this encoded string with others.'),
      () => toast.error('Failed to copy')
    );
    logger.featureUsed('share-session');
  }, [activeSession, toast]);

  // Feature 63: Theme Toggle
  const handleToggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    logger.featureUsed('toggle-theme');
  }, []);

  const handleExport = useCallback((formatId) => {
    if (!activeSession) return;
    if (formatId) {
      // Called from ExportMenu with specific format
      logger.exportDone(formatId);
      toast.success(`Exported as ${formatId}`);
      return;
    }
    // Default JSON export (backward compat for keyboard shortcut)
    const format = EXPORT_FORMATS[0]; // JSON
    const content = format.fn(activeSession);
    let hostname = 'export';
    try { hostname = new URL(activeSession.url).hostname; } catch {}
    downloadFile(content, `apiflow-${hostname}-${new Date().toISOString().slice(0, 10)}.json`, format.mime);
    logger.exportDone('json');
    toast.success('Exported JSON');
  }, [activeSession, toast]);

  // ── Keyboard ──────────────────────────────────────────────
  useKeyboardShortcuts({
    onNew: handleNew,
    onExport: () => handleExport(),
    onRescan: handleRescan,
    onEscape: () => {
      if (rightPanel) setRightPanel(null);
      else if (selectedApiId) setSelectedApiId(null);
      else if (selectedWsId) setSelectedWsId(null);
      else if (scanDialogOpen && !scanning) setScanDialogOpen(false);
      else if (shortcutsOpen) setShortcutsOpen(false);
    },
    onShortcuts: () => setShortcutsOpen(true),
  });

  // ── Right panel rendering ────────────────────────────────
  const renderRightPanel = () => {
    if (rightPanel === 'analytics') return (
      <div className="w-[420px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">Analytics</span>
          <button onClick={() => setRightPanel(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <AnalyticsPanel analytics={activeSession?.analytics} apis={activeSession?.apis} />
        </div>
      </div>
    );
    if (rightPanel === 'waterfall') return (
      <div className="w-[500px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">Request Waterfall</span>
          <button onClick={() => setRightPanel(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <WaterfallTimeline apis={activeSession?.apis} />
        </div>
      </div>
    );
    if (rightPanel === 'security') return (
      <div className="w-[420px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">Security</span>
          <button onClick={() => setRightPanel(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <SecurityPanel securityHeaders={activeSession?.securityHeaders} apis={activeSession?.apis} />
        </div>
      </div>
    );
    if (rightPanel === 'cookies') return (
      <CookieViewer cookies={activeSession?.pageCookies} onClose={() => setRightPanel(null)} />
    );
    if (rightPanel === 'logs') return (
      <div className="w-[420px] border-l border-border bg-card flex flex-col h-full animate-slide-right">
        <LogViewer serverLogs={activeSession?.serverLogs || []} />
      </div>
    );
    return null;
  };

  // ── Main content area ─────────────────────────────────────
  const renderMainContent = () => {
    if (activeTab === 'websockets') {
      return (
        <div className="flex flex-1 min-h-0">
          <WebSocketList
            webSockets={activeSession?.webSockets || []}
            selectedId={selectedWsId}
            onSelect={(id) => { setSelectedWsId(selectedWsId === id ? null : id); setRightPanel(null); }}
            onCopy={handleCopy}
          />
          {selectedWs && (
            <WebSocketDetailPanel ws={selectedWs} onClose={() => setSelectedWsId(null)} onCopy={handleCopy} />
          )}
          {!selectedWs && renderRightPanel()}
        </div>
      );
    }

    if (activeTab === 'sse') {
      const sseList = activeSession?.sse || [];
      return (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            {sseList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">No SSE connections detected.</div>
            ) : (
              <div className="divide-y divide-border">
                {sseList.map(sse => (
                  <div key={sse.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded border bg-violet-500/15 text-violet-400 border-violet-500/30 shrink-0">SSE</span>
                      <span className="text-xs font-mono truncate flex-1 text-foreground/80">{sse.url}</span>
                      <button onClick={() => handleCopy(sse.url)} className="p-1 rounded hover:bg-muted"><span className="text-[10px]">📋</span></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {renderRightPanel()}
        </div>
      );
    }

    // Default: APIs tab
    return (
      <div className="flex flex-1 min-h-0">
        <ApiList
          apis={filteredApis}
          selectedId={selectedApiId}
          onSelect={(id) => { setSelectedApiId(selectedApiId === id ? null : id); setSelectedWsId(null); setRightPanel(null); }}
          onCopy={handleCopy}
          pinnedIds={pinnedIds}
          onPin={handlePin}
          groupByHost={groupByHost}
        />
        {selectedApi && !rightPanel && (
          <ApiDetailPanel
            api={selectedApi}
            onClose={() => setSelectedApiId(null)}
            onCopy={handleCopy}
          />
        )}
        {!selectedApi && renderRightPanel()}
        {selectedApi && rightPanel && renderRightPanel()}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={(id) => { setActiveSessionId(id); setSelectedApiId(null); setSelectedWsId(null); setSearchQuery(''); setFilterMethod(''); setFilterStatus(''); setSortBy(''); setActiveTab('apis'); setRightPanel(null); setPinnedIds([]); }}
        onNew={handleNew}
        onDelete={handleDeleteSession}
        onRename={handleRenameSession}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeSession ? (
          <>
            <StatsBar
              apis={activeSession.apis || []}
              webSockets={activeSession.webSockets}
              sse={activeSession.sse}
              url={activeSession.url}
              duration={activeSession.duration}
              pageInfo={activeSession.pageInfo}
            />
            <Toolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalApis={filteredApis.length}
              filterMethod={filterMethod}
              onFilterMethod={setFilterMethod}
              filterStatus={filterStatus}
              onFilterStatus={setFilterStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onExport={handleExport}
              onRescan={handleRescan}
              onShowShortcuts={() => setShortcutsOpen(true)}
              session={activeSession}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              wsCount={activeSession.webSockets?.length || 0}
              sseCount={activeSession.sse?.length || 0}
              onShowAnalytics={() => setRightPanel(rightPanel === 'analytics' ? null : 'analytics')}
              onShowWaterfall={() => setRightPanel(rightPanel === 'waterfall' ? null : 'waterfall')}
              onShowSecurity={() => setRightPanel(rightPanel === 'security' ? null : 'security')}
              onShowCookies={() => setRightPanel(rightPanel === 'cookies' ? null : 'cookies')}
              onShowLogs={() => setRightPanel(rightPanel === 'logs' ? null : 'logs')}
              onCopyAll={handleCopyAll}
              groupByHost={groupByHost}
              onToggleGroupByHost={() => setGroupByHost(!groupByHost)}
              onShareSession={handleShareSession}
            />
            {renderMainContent()}
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
