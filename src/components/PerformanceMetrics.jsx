import { useState } from 'react';
import { Activity, ChevronDown, ChevronRight, Download, RotateCcw, X } from 'lucide-react';

function PerformanceMetrics({ metrics, isVisible, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('renderCount');

  // Only show in development
  if (!import.meta.env.DEV) return null;
  if (!isVisible) return null;

  const metricsArray = Object.values(metrics).filter(m => m.renderCount > 5);
  
  // Sort metrics
  const sortedMetrics = [...metricsArray].sort((a, b) => {
    switch (sortBy) {
      case 'renderCount':
        return b.renderCount - a.renderCount;
      case 'totalTime':
        return b.totalTime - a.totalTime;
      case 'averageTime':
        return b.averageTime - a.averageTime;
      default:
        return 0;
    }
  });

  const totalRenders = metricsArray.reduce((sum, m) => sum + m.renderCount, 0);
  const totalTime = metricsArray.reduce((sum, m) => sum + m.totalTime, 0);

  const getStatusColor = (avgTime) => {
    if (avgTime < 16) return 'text-green-600 dark:text-green-400';
    if (avgTime < 33) return 'text-primary-600 dark:text-primary-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (avgTime) => {
    if (avgTime < 16) return '✅';
    if (avgTime < 33) return '⚠️';
    return '🔴';
  };

  const exportMetrics = () => {
    const data = JSON.stringify(metrics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMetrics = () => {
    navigator.clipboard.writeText(JSON.stringify(metrics, null, 2));
  };

  const resetMetrics = () => {
    if (window.confirm('Reset all performance metrics?')) {
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
          <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            ⚡ Performance: {totalRenders} renders, {Math.round(totalTime)}ms total
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={exportMetrics}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <button
              onClick={copyMetrics}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded transition-colors"
            >
              Copy
            </button>
            <button
              onClick={resetMetrics}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Metrics Table */}
          {sortedMetrics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th 
                      className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setSortBy('componentName')}
                    >
                      Component
                    </th>
                    <th 
                      className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setSortBy('renderCount')}
                    >
                      Renders
                    </th>
                    <th 
                      className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setSortBy('totalTime')}
                    >
                      Total
                    </th>
                    <th 
                      className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setSortBy('averageTime')}
                    >
                      Avg
                    </th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                      Last
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMetrics.map((metric) => (
                    <tr 
                      key={metric.componentName}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-2 px-2 font-mono text-gray-900 dark:text-gray-100">
                        {metric.componentName}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-300">
                        {metric.renderCount}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-300">
                        {Math.round(metric.totalTime)}ms
                      </td>
                      <td className={`py-2 px-2 text-right font-semibold ${getStatusColor(metric.averageTime)}`}>
                        {metric.averageTime.toFixed(1)}ms
                      </td>
                      <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-300">
                        {metric.lastRenderTime.toFixed(1)}ms
                      </td>
                      <td className="py-2 px-2 text-center">
                        {getStatusIcon(metric.averageTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No metrics available. Interact with the app to collect data.
            </p>
          )}

          {/* Legend */}
          <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Performance Guide:</p>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              <p>✅ Green: &lt;16ms (60fps) - Excellent</p>
              <p>⚠️ Caution: 16-33ms (30fps) - Acceptable</p>
              <p>🔴 Red: &gt;33ms - Needs optimization</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceMetrics;
