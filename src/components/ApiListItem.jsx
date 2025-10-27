import React, { memo } from 'react';
import { ArrowRight, CheckCircle, Clock, XCircle, Play, Copy, Download } from 'lucide-react';

const ApiListItem = memo(({ api, isSelected, onSelectApi, onTest, onCopy, onExport, style }) => {
  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
      POST: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
  PUT: 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700',
      DELETE: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
      PATCH: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
    };
    return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  };

  const getStatusIcon = (api) => {
    if (!api.response) {
      return <Clock className="w-3.5 h-3.5 text-gray-400" />;
    }
    if (api.response.status >= 200 && api.response.status < 300) {
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    }
    return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  };

  const truncateUrl = (url, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, maxLength - 15);
    const end = url.substring(url.length - 12);
    return `${start}...${end}`;
  };

  return (
    <div style={style}>
      <div
        onClick={() => onSelectApi(api)}
        className={`group relative p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md touch-manipulation ${
          isSelected
            ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30 shadow-md border-l-4'
            : 'border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-400'
        }`}
      >
        {/* Quick Action Buttons */}
        <div className={`absolute top-2 right-2 flex gap-1 md:gap-1.5 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTest(api);
            }}
            className="p-2 md:p-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm touch-manipulation"
            title="Test API"
            aria-label="Test API"
          >
            <Play className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(api);
            }}
            className="p-2 md:p-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm touch-manipulation"
            title="Copy cURL"
            aria-label="Copy cURL command"
          >
            <Copy className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(api);
            }}
            className="p-2 md:p-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm touch-manipulation"
            title="Export API"
            aria-label="Export API as JSON"
          >
            <Download className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getMethodColor(api.method)}`}>
                {api.method}
              </span>
              {getStatusIcon(api)}
              {api.response && (
                <span className={`text-xs font-medium ${
                  api.response.status >= 200 && api.response.status < 300
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {api.response.status}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all" title={api.url}>
              {truncateUrl(api.url)}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{api.type}</span>
              {api.response?.size && (
                <span>Size: {api.response.size}</span>
              )}
              {api.response?.responseTime && (
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {api.response.responseTime}ms
                </span>
              )}
            </div>
          </div>
          <ArrowRight className={`w-5 h-5 flex-shrink-0 transition-transform ${
            isSelected ? 'text-primary-600 dark:text-primary-400 transform translate-x-1' : 'text-gray-400 dark:text-gray-500'
          }`} />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  return (
    prevProps.api.id === nextProps.api.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.style === nextProps.style &&
    prevProps.onTest === nextProps.onTest &&
    prevProps.onCopy === nextProps.onCopy &&
    prevProps.onExport === nextProps.onExport
  );
});

ApiListItem.displayName = 'ApiListItem';

export default ApiListItem;
