import { Wifi, WifiOff, MessageSquare } from 'lucide-react';
import { useState } from 'react';

function WebSocketList({ webSockets }) {
  const [selectedWs, setSelectedWs] = useState(null);

  if (!webSockets || webSockets.length === 0) return null;

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-xl font-semibold dark:text-white">WebSocket Connections ({webSockets.length})</h2>
      </div>

      <div className="space-y-2">
        {webSockets.map((ws) => (
          <div
            key={ws.id}
            className="p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedWs(selectedWs?.id === ws.id ? null : ws)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {ws.status === 'connected' ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    ws.status === 'connected' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {ws.status}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {ws.frames.length} messages
                  </span>
                </div>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                  {ws.url}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Connected: {new Date(ws.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* WebSocket Messages */}
            {selectedWs?.id === ws.id && ws.frames.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm dark:text-white">Messages</h4>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ws.frames.map((frame, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-xs ${
                        frame.direction === 'sent'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500 dark:border-blue-400'
                          : 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500 dark:border-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${
                          frame.direction === 'sent' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'
                        }`}>
                          {frame.direction === 'sent' ? '→ Sent' : '← Received'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(frame.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all font-mono">
                        {frame.data}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WebSocketList;
