import { Loader2, CheckCircle, Wifi, Globe, MousePointer, Package, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

function ProgressTracker({ onProgress }) {
  const [progress, setProgress] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);

  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('parsing-progress', (data) => {
      setProgress(prev => [...prev, data]);
      setCurrentStatus(data);
      if (onProgress) onProgress(data);
    });

    // Listen for error events
    socket.on('parsing-error', (data) => {
      setProgress(prev => [...prev, { ...data, status: 'error' }]);
      setCurrentStatus({ ...data, status: 'error' });
      if (onProgress) onProgress({ ...data, status: 'error' });
    });

    // Listen for retry events
    socket.on('parsing-retry', (data) => {
      setProgress(prev => [...prev, { ...data, status: 'retry' }]);
      setCurrentStatus({ ...data, status: 'retry' });
      if (onProgress) onProgress({ ...data, status: 'retry' });
    });

    return () => {
      socket.disconnect();
    };
  }, [onProgress]);

  if (progress.length === 0) return null;

  const getIcon = (status) => {
    switch (status) {
      case 'starting':
      case 'browser-ready':
        return <Globe className="w-4 h-4" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'scrolling':
      case 'interacting':
        return <MousePointer className="w-4 h-4" />;
      case 'websocket':
        return <Wifi className="w-4 h-4" />;
      case 'api-detected':
        return <Package className="w-4 h-4" />;
      case 'finalizing':
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'retry':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  const getColor = (status) => {
    switch (status) {
      case 'complete':
        return 'text-green-600 bg-green-500/10 border-green-500/30';
      case 'websocket':
        return 'text-purple-600 bg-purple-500/10 border-purple-500/30';
      case 'api-detected':
        return 'text-blue-600 bg-blue-500/10 border-blue-500/30';
      case 'error':
        return 'text-red-600 bg-red-500/10 border-red-500/30';
      case 'retry':
        return 'text-orange-600 bg-orange-500/10 border-orange-500/30';
      default:
        return 'text-muted-foreground bg-secondary/50 border-border';
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 shadow-lg backdrop-blur-sm overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Analyzing...</h3>
            <p className="text-[10px] text-muted-foreground">Live progress</p>
          </div>
        </div>
        {currentStatus?.count && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">
            <Package className="w-3 h-3" />
            <span className="text-xs font-bold">{currentStatus.count}</span>
          </div>
        )}
      </div>

      {/* Compact Progress Timeline */}
      <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        {progress.slice(-5).map((item, idx) => (
          <div
            key={idx}
            className={`group flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${getColor(item.status)}`}
          >
            <div className="flex-shrink-0 w-5 h-5 rounded-md bg-current/10 flex items-center justify-center">
              {getIcon(item.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium leading-tight truncate">{item.message}</p>
              {item.count && (
                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-current/20">
                  {item.count} API{item.count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {item.status === 'retry' && item.delaySeconds && (
              <div className="flex items-center gap-1 text-[10px] font-semibold">
                <Clock className="w-3 h-3" />
                <span>{item.delaySeconds}s</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Completion Banner */}
      {currentStatus?.status === 'complete' && (
        <div className="mx-3 mb-3 p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
              Complete! {currentStatus.count} APIs found
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
