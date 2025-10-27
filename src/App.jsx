import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Globe, Database, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyFilters } from './utils/filterUtils';
import PaginationControls from './components/PaginationControls';
import { useTheme } from './contexts/ThemeContext';
import ApiList_Complete from './components/api/ApiList_Complete';
import Toolbar_Professional from './components/layout/Toolbar_Professional';
import FilterBar_Compact from './components/api/FilterBar_Compact';
import ApiDetailsSheet from './components/api/ApiDetailsSheet';
import HistorySidebar_Fixed from './components/layout/HistorySidebar_Fixed';
import CustomHeaders from './components/CustomHeaders';
import MainContent from './components/layout/MainContent';
import Statistics_Compact from './components/Statistics_Compact';
import LoadingState from './components/LoadingState';
import WebSocketList from './components/WebSocketList';
import ProgressTracker_New from './components/ProgressTracker_New';
import GroupedApiList from './components/GroupedApiList';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.jsx';
import HelpPage from './components/HelpPage';
import NewAnalysisDialog from './components/NewAnalysisDialog';
import { retryWithBackoff } from './utils/retryHandler';
import { categorizeError, formatErrorForDisplay } from './utils/errorHandler';
import ErrorDisplay from './components/ErrorDisplay';
import PerformanceMetrics from './components/PerformanceMetrics';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Now stores structured error objects
  const [result, setResult] = useState(null);
  const [selectedApi, setSelectedApi] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    methods: [],
    status: 'all',
    domains: [],
    responseTimeRange: { min: 0, max: 10000, enabled: false },
    responseSizeRange: { min: 0, max: 10000000, enabled: false },
    dateTimeRange: { start: null, end: null, enabled: false },
    operator: 'AND'
  });
  const [customConfig, setCustomConfig] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list or grouped
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryDelay, setRetryDelay] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const urlInputRef = useRef(null);
  const exportMenuRef = useRef(null);
  const apiListRef = useRef(null);
  const { toggleTheme } = useTheme();
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [showMetrics, setShowMetrics] = useState(false);
  const metricsBufferRef = useRef({});
  const updateTimerRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedApis, setSelectedApis] = useState([]);

  const handleCheckApi = (api, checked) => {
    if (checked) {
      setSelectedApis(prev => [...prev, api.url]);
    } else {
      setSelectedApis(prev => prev.filter(url => url !== api.url));
    }
  };

  // Enhanced Export Function
  const handleExportApis = (format = 'json') => {
    const apisToExport = selectedApis.length > 0 
      ? result.apis.filter(api => selectedApis.includes(api.url))
      : result.apis;

    let dataStr, fileName, mimeType;

    switch (format) {
      case 'json':
        dataStr = JSON.stringify(apisToExport, null, 2);
        fileName = `api-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        // CSV export
        const headers = ['Method', 'URL', 'Status', 'Response Time', 'Size'];
        const rows = apisToExport.map(api => [
          api.request?.method || 'GET',
          api.url,
          api.response?.status || '',
          api.response?.time || '',
          api.response?.size || ''
        ]);
        dataStr = [headers, ...rows].map(row => row.join(',')).join('\n');
        fileName = `api-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case 'curl':
        // Export all as cURL commands
        dataStr = apisToExport.map(api => {
          const headers = api.headers ? Object.entries(api.headers)
            .map(([key, value]) => `-H "${key}: ${value}"`)
            .join(' ') : '';
          const payload = api.payload ? `-d '${typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload)}'` : '';
          return `curl -X ${api.request?.method || 'GET'} "${api.url}" ${headers} ${payload}`.trim();
        }).join('\n\n');
        fileName = `api-export-${Date.now()}.sh`;
        mimeType = 'text/plain';
        break;
      default:
        dataStr = JSON.stringify(apisToExport, null, 2);
        fileName = `api-export-${Date.now()}.json`;
        mimeType = 'application/json';
    }

    const dataBlob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Delete selected APIs
  const handleDeleteApis = () => {
    if (selectedApis.length === 0) return;
    
    const updatedApis = result.apis.filter(api => !selectedApis.includes(api.url));
    setResult({ ...result, apis: updatedApis });
    setSelectedApis([]);
  };

  // Collections feature
  const handleAddToCollection = () => {
    // For now, save to localStorage
    const collections = JSON.parse(localStorage.getItem('api-collections') || '[]');
    const newCollection = {
      id: Date.now().toString(),
      name: `Collection ${collections.length + 1}`,
      timestamp: new Date().toISOString(),
      apis: result.apis.filter(api => selectedApis.includes(api.url))
    };
    collections.push(newCollection);
    localStorage.setItem('api-collections', JSON.stringify(collections));
    alert(`Added ${selectedApis.length} APIs to collection!`);
  };

  // Replay All Selected
  const handleReplayAll = async () => {
    const apisToReplay = result.apis.filter(api => selectedApis.includes(api.url));
    
    for (const api of apisToReplay) {
      try {
        const response = await fetch(api.url, {
          method: api.request?.method || 'GET',
          headers: api.headers,
          body: api.payload ? JSON.stringify(api.payload) : undefined
        });
        console.log(`Replayed ${api.url}: ${response.status}`);
      } catch (err) {
        console.error(`Failed to replay ${api.url}:`, err);
      }
    }
    alert('Replay completed! Check console for details.');
  };

  // Compare Selected APIs
  const handleCompareApis = () => {
    if (selectedApis.length < 2) {
      alert('Please select at least 2 APIs to compare');
      return;
    }
    
    const apisToCompare = result.apis.filter(api => selectedApis.includes(api.url));
    const comparison = {
      apis: apisToCompare.map(api => ({
        url: api.url,
        method: api.request?.method,
        status: api.response?.status,
        time: api.response?.time,
        size: api.response?.size
      }))
    };
    
    console.table(comparison.apis);
    alert('Comparison data logged to console!');
  };

  // Test All Selected
  const handleTestAllApis = async () => {
    const apisToTest = result.apis.filter(api => selectedApis.includes(api.url));
    const results = [];
    
    for (const api of apisToTest) {
      try {
        const startTime = Date.now();
        const response = await fetch(api.url, {
          method: api.request?.method || 'GET',
          headers: api.headers
        });
        const endTime = Date.now();
        
        results.push({
          url: api.url,
          status: response.status,
          time: endTime - startTime,
          success: response.ok
        });
      } catch (err) {
        results.push({
          url: api.url,
          error: err.message,
          success: false
        });
      }
    }
    
    console.table(results);
    alert(`Tested ${apisToTest.length} APIs. Results in console!`);
  };

  // Generate Documentation
  const handleGenerateDocs = () => {
    const apisToDocument = selectedApis.length > 0
      ? result.apis.filter(api => selectedApis.includes(api.url))
      : result.apis;

    const markdown = `# API Documentation
Generated: ${new Date().toLocaleString()}
Total Endpoints: ${apisToDocument.length}

## Endpoints

${apisToDocument.map(api => `
### ${api.request?.method || 'GET'} ${api.url}

**Status:** ${api.response?.status || 'N/A'}
**Response Time:** ${api.response?.time || 'N/A'}ms
**Size:** ${api.response?.size || 'N/A'} bytes

**Headers:**
\`\`\`json
${JSON.stringify(api.headers, null, 2)}
\`\`\`

${api.payload ? `**Payload:**
\`\`\`json
${JSON.stringify(api.payload, null, 2)}
\`\`\`
` : ''}

---
`).join('\n')}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-docs-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy All as cURL
  const handleCopyAllCurl = () => {
    const apisToCopy = selectedApis.length > 0
      ? result.apis.filter(api => selectedApis.includes(api.url))
      : result.apis;

    const curlCommands = apisToCopy.map(api => {
      const headers = api.headers ? Object.entries(api.headers)
        .map(([key, value]) => `-H "${key}: ${value}"`)
        .join(' ') : '';
      const payload = api.payload ? `-d '${typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload)}'` : '';
      return `curl -X ${api.request?.method || 'GET'} "${api.url}" ${headers} ${payload}`.trim();
    }).join('\n\n');

    navigator.clipboard.writeText(curlCommands)
      .then(() => alert(`Copied ${apisToCopy.length} cURL commands to clipboard!`))
      .catch(err => console.error('Failed to copy:', err));
  };

  const handleParse = async () => {
    if (!url) {
      const simpleError = formatErrorForDisplay({ message: 'Please enter a URL' });
      setError(simpleError);
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      const simpleError = formatErrorForDisplay({ message: 'Please enter a valid URL (include http:// or https://)' });
      setError(simpleError);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedApi(null);
    setRetryCount(0);
    setIsRetrying(false);

    try {
      const requestBody = { url };
      if (customConfig) {
        requestBody.customHeaders = customConfig.headers;
        requestBody.cookies = customConfig.cookies;
        requestBody.userAgent = customConfig.userAgent;
      }

      // Wrap fetch with retry logic
      const data = await retryWithBackoff(
        async () => {
          const response = await fetch('http://localhost:3001/api/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json();
            // Create error object with server response data
            const error = new Error(errorData.message || 'Failed to parse website');
            error.status = response.status;
            error.type = errorData.type;
            error.suggestions = errorData.suggestions;
            error.retryable = errorData.retryable;
            error.originalError = errorData.originalError;
            throw error;
          }

          return await response.json();
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 8000,
          backoffMultiplier: 2,
          shouldRetry: (error) => {
            // Retry on network errors, timeouts, and 5xx server errors
            const errorType = categorizeError(error);
            return ['timeout', 'network', 'dns', 'connection'].includes(errorType) || 
                   (error.status >= 500 && error.status < 600);
          },
          onRetry: async (retryInfo) => {
            const { attempt, maxRetries, delay } = retryInfo;
            setIsRetrying(true);
            setRetryCount(attempt);
            setRetryDelay(delay);
            console.log(`Retrying API call... Attempt ${attempt}/${maxRetries}`);
          }
        }
      );

      setCurrentSessionId(data.sessionId);
      setResult(data);
      setIsRetrying(false);
      setRetryCount(0);
      
      if (data.apis.length === 0) {
        const noApiError = formatErrorForDisplay(
          { message: 'No API calls detected' },
          'No API calls detected on this page. Try a different URL or ensure the page makes API requests.'
        );
        setError(noApiError);
      } else {
        // Save to session history
        if (window.saveParsingSession) {
          window.saveParsingSession(data);
        }
      }
    } catch (err) {
      // Format error for display with categorization
      let formattedError;
      if (err.type && err.suggestions) {
        // Server already formatted the error
        formattedError = {
          type: err.type,
          title: err.message,
          message: err.message,
          suggestions: err.suggestions,
          retryable: err.retryable,
          originalError: err.originalError || { message: err.message }
        };
      } else {
        // Client-side error, categorize it
        formattedError = formatErrorForDisplay(err);
      }
      setError(formattedError);
      setIsRetrying(false);
      setRetryCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = (session) => {
    setResult(session);
    setUrl(session.url);
    setError(null);
    setSelectedApi(null);
    setFilters({
      searchTerm: '',
      methods: [],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    });
  };

  const handleNewParse = () => {
    setShowNewAnalysis(true);
  };

  const handleAnalyzeFromDialog = async (newUrl) => {
    setShowNewAnalysis(false);
    setUrl(newUrl);
    setResult(null);
    setSelectedApi(null);
    setError(null);
    
    // Use URL directly since state update is async
    if (!newUrl) {
      const simpleError = formatErrorForDisplay({ message: 'Please enter a URL' });
      setError(simpleError);
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl);
    } catch {
      const simpleError = formatErrorForDisplay({ message: 'Please enter a valid URL (include http:// or https://)' });
      setError(simpleError);
      return;
    }

    setLoading(true);
    setRetryCount(0);
    setIsRetrying(false);

    try {
      const requestBody = { url: newUrl };
      if (customConfig) {
        requestBody.customHeaders = customConfig.headers;
        requestBody.cookies = customConfig.cookies;
        requestBody.userAgent = customConfig.userAgent;
      }

      const data = await retryWithBackoff(
        async () => {
          const response = await fetch('http://localhost:3001/api/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.message || 'Failed to parse website');
            error.status = response.status;
            error.type = errorData.type;
            error.suggestions = errorData.suggestions;
            error.retryable = errorData.retryable;
            error.originalError = errorData.originalError;
            throw error;
          }

          return await response.json();
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 8000,
          backoffMultiplier: 2,
          shouldRetry: (error) => {
            const errorType = categorizeError(error);
            return ['timeout', 'network', 'dns', 'connection'].includes(errorType) || 
                   (error.status >= 500 && error.status < 600);
          },
          onRetry: async (retryInfo) => {
            const { attempt, maxRetries, delay } = retryInfo;
            setIsRetrying(true);
            setRetryCount(attempt);
            setRetryDelay(delay);
          }
        }
      );

      setCurrentSessionId(data.sessionId);
      setResult(data);
      setIsRetrying(false);
      setRetryCount(0);
      
      if (data.apis.length === 0) {
        const noApiError = formatErrorForDisplay(
          { message: 'No API calls detected' },
          'No API calls detected on this page. Try a different URL or ensure the page makes API requests.'
        );
        setError(noApiError);
      }
    } catch (err) {
      let formattedError;
      if (err.type && err.suggestions) {
        formattedError = {
          type: err.type,
          title: err.message,
          message: err.message,
          suggestions: err.suggestions,
          retryable: err.retryable,
          originalError: err.originalError || { message: err.message }
        };
      } else {
        formattedError = formatErrorForDisplay(err);
      }
      setError(formattedError);
      setIsRetrying(false);
      setRetryCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Save session to localStorage (prevent duplicates)
  useEffect(() => {
    // Don't save if:
    // 1. No result or no APIs
    // 2. Session was loaded from history (has id or loadedFromHistory flag)
    if (!result || !result.apis || result.apis.length === 0) return;
    if (result.id || result.loadedFromHistory) return;
    
    try {
      const sessions = JSON.parse(localStorage.getItem('apiflow-sessions') || '[]');
      
      // Check if this exact URL was already analyzed recently (within last 10 seconds)
      const recentDuplicate = sessions.find(s => 
        s.url === result.url && 
        (Date.now() - new Date(s.timestamp).getTime()) < 10000
      );
      
      if (!recentDuplicate) {
        const newSession = {
          id: Date.now().toString(),
          url: result.url,
          timestamp: new Date().toISOString(),
          apis: result.apis,
          totalApis: result.apis.length
        };
        sessions.push(newSession);
        // Keep only last 50 sessions
        if (sessions.length > 50) {
          sessions.splice(0, sessions.length - 50);
        }
        localStorage.setItem('apiflow-sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [result]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
    setRetryDelay(0);
    handleParse();
  };

  const handleDismissError = () => {
    setError(null);
  };

  // Quick action handlers
  const handleTestApi = useCallback((api) => {
    setSelectedApi(api);
    setIsDetailsOpen(true);
  }, []);

  const handleCopyApi = useCallback((api) => {
    // Generate cURL command
    const headers = api.headers ? Object.entries(api.headers)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(' ') : '';
    
    const payload = api.payload ? `-d '${typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload)}'` : '';
    
    const curlCommand = `curl -X ${api.method} "${api.url}" ${headers} ${payload}`.trim();
    
    navigator.clipboard.writeText(curlCommand)
      .then(() => {
        // Could add a toast notification here
        console.log('cURL command copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  }, []);

  const handleExportApi = useCallback((api) => {
    const dataStr = JSON.stringify(api, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-${api.method}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleSelectApi = useCallback((api) => {
    setSelectedApi(api);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  const handleCancel = async () => {
    if (!currentSessionId) return;
    
    try {
      await fetch(`http://localhost:3001/api/cancel/${currentSessionId}`, {
        method: 'POST'
      });
      setLoading(false);
      setCurrentSessionId(null);
      setError(formatErrorForDisplay({ message: 'Parsing cancelled by user' }));
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const handleCustomHeadersSave = (config) => {
    setCustomConfig(config);
  };

  const onRenderCallback = useCallback((id, phase, actualDuration) => {
    // Buffer the metrics update to prevent infinite loops
    const existing = metricsBufferRef.current[id] || { renderCount: 0, totalTime: 0, renders: [] };
    metricsBufferRef.current[id] = {
      componentName: id,
      renderCount: existing.renderCount + 1,
      totalTime: existing.totalTime + actualDuration,
      averageTime: (existing.totalTime + actualDuration) / (existing.renderCount + 1),
      lastRenderTime: actualDuration,
      phase,
      renders: [...existing.renders.slice(-9), { time: actualDuration, timestamp: Date.now() }]
    };

    // Debounce state updates to prevent infinite loops
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    updateTimerRef.current = setTimeout(() => {
      setPerformanceMetrics({ ...metricsBufferRef.current });
    }, 100);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => urlInputRef.current?.focus(),
    onExport: () => exportMenuRef.current?.click(),
    onRetry: () => error && handleRetry(),
    onHelp: () => setShowHelp(true),
    onEscape: () => {
      if (isDetailsOpen) {
        handleCloseDetails();
      } else {
        setShowHelp(false);
      }
    },
    onEnter: () => !loading && url && handleParse(),
    onDarkMode: toggleTheme,
    onMetrics: () => setShowMetrics(prev => !prev)
  });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleParse();
    }
  };

  // Filter APIs based on search and filters using utility function
  const filteredApis = useMemo(() => {
    if (!result?.apis) return [];
    return applyFilters(result.apis, filters, filters.operator);
  }, [result, filters]);

  // Calculate sidebar stats
  const sidebarStats = useMemo(() => {
    if (!result?.apis) return null;
    
    const total = result.apis.length;
    const successful = result.apis.filter(api => {
      const status = api.response?.status;
      return status >= 200 && status < 300;
    }).length;
    const failed = result.apis.filter(api => {
      const status = api.response?.status;
      return status >= 400;
    }).length;
    
    // Calculate average response time
    const apisWithTime = result.apis.filter(api => 
      api.response?.responseTime !== undefined && api.response?.responseTime !== null
    );
    const avgResponseTime = apisWithTime.length > 0
      ? Math.round(apisWithTime.reduce((sum, api) => sum + api.response.responseTime, 0) / apisWithTime.length)
      : null;
    
    return {
      total,
      successful,
      failed,
      avgResponseTime
    };
  }, [result]);

  // Reset pagination when filters or URL change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters, url]);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('api-parser-last-filters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        setFilters(parsed);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, []);

  // Save filters to localStorage when they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('api-parser-last-filters', JSON.stringify(filters));
      } catch (error) {
        console.error('Error saving filters:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Compute paginated APIs for list view
  const paginatedApis = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredApis.slice(startIndex, endIndex);
  }, [filteredApis, currentPage, pageSize]);

  // Page change handler
  const handlePageChange = useCallback((newPage) => {
    setIsPageTransitioning(true);
    setCurrentPage(newPage);
    setTimeout(() => {
      setIsPageTransitioning(false);
    }, 300);
  }, []);

  // Page size change handler
  const handlePageSizeChange = useCallback((newPageSize) => {
    const topItemIndex = currentPage * pageSize;
    const newPage = Math.floor(topItemIndex / newPageSize);
    setPageSize(newPageSize);
    setCurrentPage(newPage);
    setIsPageTransitioning(true);
    setTimeout(() => {
      setIsPageTransitioning(false);
    }, 300);
  }, [currentPage, pageSize]);

  // Cleanup performance metrics timer on unmount
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  // Ensure selected API remains visible
  useEffect(() => {
    if (!selectedApi || !filteredApis.length || viewMode !== 'list') return;
    
    const index = filteredApis.findIndex(api => api.id === selectedApi.id);
    if (index === -1) return;
    
    const targetPage = Math.floor(index / pageSize);
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      // Scroll to item within the page after a short delay
      setTimeout(() => {
        const indexInPage = index % pageSize;
        apiListRef.current?.scrollToItem(indexInPage, 'center');
      }, 100);
    } else {
      // Already on correct page, just scroll to item
      const indexInPage = index % pageSize;
      apiListRef.current?.scrollToItem(indexInPage, 'center');
    }
  }, [selectedApi, filteredApis, pageSize, currentPage, viewMode]);

  return (
    <div className="flex h-screen bg-background">
      {/* Fixed History Sidebar - No Duplicates */}
      <HistorySidebar_Fixed
        onNewParse={handleNewParse}
        onLoadSession={handleLoadSession}
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
      />
      
      {/* Main Container - No TopNav! */}
      <div className="flex-1 flex flex-col">
        {/* New Analysis Dialog */}
        {showNewAnalysis && (
          <NewAnalysisDialog
            onClose={() => setShowNewAnalysis(false)}
            onAnalyze={handleAnalyzeFromDialog}
            onOpenSettings={() => {
              setShowNewAnalysis(false);
              setShowSettings(true);
            }}
          />
        )}
        
        {/* Custom Headers Dialog (Settings) */}
        {showSettings && (
          <CustomHeaders
            onClose={() => setShowSettings(false)}
            onSave={(config) => {
              handleCustomHeadersSave(config);
              setShowSettings(false);
            }}
          />
        )}
        
        {/* Help Page */}
        {showHelp && <HelpPage onClose={() => setShowHelp(false)} />}
        
        {/* Main Content - NO URL BAR! */}
        <MainContent>
        {/* Error Display */}
        {error && (
          <div className="mb-4">
            <ErrorDisplay 
              error={error}
              onRetry={error.retryable ? handleRetry : null}
              onDismiss={handleDismissError}
            />
          </div>
        )}

        {/* COMPACT STATISTICS WITH MORE INFO */}
        {result?.apis?.length > 0 && (
          <Statistics_Compact 
            stats={{
              totalApis: result.apis.length,
              successRate: (result.apis.filter(api => api.response?.status >= 200 && api.response?.status < 300).length / result.apis.length) * 100,
              avgResponseTime: result.apis.reduce((sum, api) => sum + (api.response?.time || 0), 0) / result.apis.length,
              methods: result.apis.reduce((acc, api) => {
                const method = api.request?.method || 'GET';
                acc[method] = (acc[method] || 0) + 1;
                return acc;
              }, {}),
              domains: new Set(result.apis.map(api => {
                try { return new URL(api.url).hostname; } catch { return 'unknown'; }
              })).size,
              totalSize: result.apis.reduce((sum, api) => sum + (api.response?.size || 0), 0),
              websockets: result.webSockets?.length || 0
            }}
          />
        )}

        {/* PROFESSIONAL API LIST WITH ALL FUNCTIONS RESTORED */}
        {result?.apis?.length > 0 && (
          <div className="space-y-4">
            {/* Professional Toolbar with ALL Actions */}
            <Toolbar_Professional
              selectedApis={selectedApis}
              totalApis={result.apis.length}
              onSelectAll={() => setSelectedApis(filteredApis.map(api => api.url))}
              onClearSelection={() => setSelectedApis([])}
              onExport={() => handleExportApis('json')}
              onDelete={handleDeleteApis}
              onAddToCollection={handleAddToCollection}
              onReplayAll={handleReplayAll}
              onCompare={handleCompareApis}
              onTestAll={handleTestAllApis}
              onGenerateDocs={handleGenerateDocs}
              onCopyAll={handleCopyAllCurl}
              viewMode={viewMode}
              onViewModeChange={() => setViewMode(viewMode === 'list' ? 'grouped' : 'list')}
            />

            {/* Compact Filter Bar */}
            <FilterBar_Compact
              onFilterChange={setFilters}
              totalApis={result.apis.length}
              filteredCount={filteredApis.length}
              apis={result.apis}
            />

            {/* Pagination Controls */}
            {viewMode === 'list' && (
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredApis.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isPageTransitioning}
              />
            )}

            {/* Complete API List with ALL Functions */}
            {viewMode === 'list' ? (
              <ApiList_Complete
                apis={paginatedApis}
                selectedApi={selectedApi}
                onSelectApi={handleSelectApi}
                selectedApis={selectedApis}
                onCheckApi={handleCheckApi}
                onCopy={handleCopyApi}
                onTest={handleTestApi}
                onExport={handleExportApi}
              />
            ) : (
              <GroupedApiList
                apis={filteredApis}
                selectedApi={selectedApi}
                onSelectApi={handleSelectApi}
              />
            )}
          </div>
        )}

        {/* Beautiful Progress Tracker */}
        {loading && <ProgressTracker_New />}

        {/* Loading State */}
        {loading && (
          <LoadingState 
            isRetrying={isRetrying}
            retryAttempt={retryCount}
            retryDelay={retryDelay}
          />
        )}

        {/* WebSocket Connections */}
        {result && result.webSockets && result.webSockets.length > 0 && (
          <WebSocketList webSockets={result.webSockets} />
        )}

        {/* PROFESSIONAL EMPTY STATE */}
        {!result && !loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-2xl px-4">
              <div className="mb-6 inline-flex p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <Globe className="w-16 h-16 text-blue-500" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Ready to Discover APIs
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Click <strong className="text-blue-500">+ New Analysis</strong> in the sidebar to start analyzing any website's API endpoints, requests, and responses in real-time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-lg bg-card border border-border">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Real-time Capture</h4>
                  <p className="text-sm text-muted-foreground">Automatically detects all API calls</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                    <Database className="w-5 h-5 text-purple-500" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Complete Analysis</h4>
                  <p className="text-sm text-muted-foreground">Headers, payloads, and responses</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Easy Export</h4>
                  <p className="text-sm text-muted-foreground">Download in multiple formats</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <PerformanceMetrics
          metrics={performanceMetrics}
          isVisible={showMetrics}
          onToggle={() => setShowMetrics(prev => !prev)}
        />
        </MainContent>
      </div>

      {/* API Details Slide-out Panel */}
      <ApiDetailsSheet 
        api={selectedApi}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
}

export default App;
