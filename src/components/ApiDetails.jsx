import { useState, useMemo, useCallback, lazy, Suspense, memo, useEffect } from 'react';
import { Copy, Check, X, Code } from 'lucide-react';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import ApiExplanation from './ApiExplanation';
import ApiTester from './ApiTester';
import RateLimitInfo from './RateLimitInfo';
import Section from './Section';

const GraphQLViewer = lazy(() => import('./GraphQLViewer'));
const SchemaViewer = lazy(() => import('./SchemaViewer'));

function ApiDetails({ api, isOpen, onClose }) {
  const [copiedSection, setCopiedSection] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    request: true,
    response: true,
    headers: false,
  });
  
  // Swipe gesture for closing panel (swipe right to close)
  const { handlers, isDragging } = useSwipeGesture({
    onSwipeRight: onClose,
  });

  const copyToClipboard = useCallback((text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const formatJson = useCallback((obj) => {
    if (!obj) return 'null';
    if (typeof obj === 'string') {
      try {
        return JSON.stringify(JSON.parse(obj), null, 2);
      } catch {
        return obj;
      }
    }
    return JSON.stringify(obj, null, 2);
  }, []);

  const formattedResponseData = useMemo(() => 
    formatJson(api.response?.data), 
    [api.response?.data, formatJson]
  );

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn touch-none"
        onClick={onClose}
      />
      
      {/* Slide-out Panel */}
      <div 
        {...handlers}
        className={`fixed top-0 right-0 h-screen w-full md:w-[600px] lg:w-[700px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 touch-pan-y will-change-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isDragging ? 'opacity-95' : ''}`}
      >
        {/* Panel Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">API Details</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                  api.method === 'GET' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700' :
                  api.method === 'POST' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700' :
                  api.method === 'PUT' ? 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700' :
                  api.method === 'DELETE' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700' :
                  api.method === 'PATCH' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700' :
                  'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}>
                  {api.method}
                </span>
                {api.response && (
                  <span className={`text-xs font-medium ${
                    api.response.status >= 200 && api.response.status < 300
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {api.response.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="overflow-y-auto h-full px-6 py-4 pb-20 space-y-4">
      {/* API Explanation */}
      <ApiExplanation api={api} />
      
      {/* GraphQL Viewer */}
      {api.graphql && (
        <Suspense fallback={
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 animate-pulse">
            <div className="h-32 bg-indigo-100 rounded"></div>
          </div>
        }>
          <GraphQLViewer graphql={api.graphql} />
        </Suspense>
      )}
      
      {/* API Tester */}
      <ApiTester api={api} />
      
      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint URL</label>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <code className="text-sm break-all text-gray-800 dark:text-gray-200">{api.url}</code>
        </div>
      </div>

      {/* Method & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Method</label>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{api.method}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <span className={`font-semibold ${
              api.response?.status >= 200 && api.response?.status < 300
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {api.response?.status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Request Headers */}
      <Section 
        title="Request Headers" 
        sectionKey="headers"
        copyText={formatJson(api.headers)}
        isExpanded={expandedSections.headers}
        onToggle={toggleSection}
        onCopy={copyToClipboard}
        isCopied={copiedSection === 'headers'}
      >
        <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-300 p-3 rounded overflow-x-auto border dark:border-gray-700">
          {formatJson(api.headers)}
        </pre>
      </Section>

      {/* Request Payload */}
      {api.payload && (
        <Section 
          title="Request Payload" 
          sectionKey="request"
          copyText={api.payload}
          isExpanded={expandedSections.request}
          onToggle={toggleSection}
          onCopy={copyToClipboard}
          isCopied={copiedSection === 'request'}
        >
          <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-300 p-3 rounded overflow-x-auto border dark:border-gray-700">
            {formatJson(api.payload)}
          </pre>
        </Section>
      )}

      {/* Schema Viewer */}
      {api.response && api.response.data && (
        <Suspense fallback={
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4 animate-pulse">
            <div className="h-48 bg-teal-100 rounded"></div>
          </div>
        }>
          <SchemaViewer response={api.response} />
        </Suspense>
      )}

      {/* Response */}
      {api.response && (
        <Section 
          title={`Response (${api.response.status} ${api.response.statusText})`}
          sectionKey="response"
          copyText={formattedResponseData}
          isExpanded={expandedSections.response}
          onToggle={toggleSection}
          onCopy={copyToClipboard}
          isCopied={copiedSection === 'response'}
        >
          {api.response.data ? (
            <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-300 p-3 rounded overflow-x-auto border dark:border-gray-700">
              {formattedResponseData}
            </pre>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No response data available</p>
          )}
        </Section>
      )}

      {/* Response Headers */}
      {api.response?.headers && (
        <Section 
          title="Response Headers" 
          sectionKey="responseHeaders"
          copyText={formatJson(api.response.headers)}
          isExpanded={expandedSections.responseHeaders}
          onToggle={toggleSection}
          onCopy={copyToClipboard}
          isCopied={copiedSection === 'responseHeaders'}
        >
          <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-300 p-3 rounded overflow-x-auto border dark:border-gray-700">
            {formatJson(api.response.headers)}
          </pre>
        </Section>
      )}

      {/* Metadata */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Metadata</h4>
        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <p><span className="font-medium">Type:</span> {api.type}</p>
          <p><span className="font-medium">Timestamp:</span> {new Date(api.timestamp).toLocaleString()}</p>
          {api.response?.responseTime && (
            <p><span className="font-medium">Response Time:</span> {api.response.responseTime}ms</p>
          )}
          {api.response?.size && (
            <p><span className="font-medium">Response Size:</span> {api.response.size} bytes</p>
          )}
          {api.response?.rateLimit && (
              <p>
              <span className="font-medium">Rate Limit:</span>{' '}
              <span className={api.response.rateLimit.isApproachingLimit ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-green-600 dark:text-green-400'}>
                {api.response.rateLimit.remaining}/{api.response.rateLimit.limit}
              </span>
              {api.response.rateLimit.isApproachingLimit && ' ⚠️'}
            </p>
          )}
        </div>
      </div>

          {/* Rate Limit Information */}
          {api.response?.rateLimit && (
            <RateLimitInfo rateLimit={api.response.rateLimit} />
          )}
        </div>
      </div>
    </>
  );
}

const areEqual = (prevProps, nextProps) => {
  return prevProps.api?.id === nextProps.api?.id &&
         prevProps.isOpen === nextProps.isOpen &&
         prevProps.onClose === nextProps.onClose;
};

export default memo(ApiDetails, areEqual);
