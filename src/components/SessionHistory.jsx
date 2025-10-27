import { History, Trash2, Clock, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

function SessionHistory({ onLoadSession }) {
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const stored = localStorage.getItem('apiParserSessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    }
  };

  const saveSession = (sessionData) => {
    const stored = localStorage.getItem('apiParserSessions');
    let sessions = [];
    
    if (stored) {
      try {
        sessions = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored sessions:', error);
      }
    }

    // Add new session
    sessions.unshift({
      id: Date.now().toString(),
      ...sessionData,
      savedAt: new Date().toISOString()
    });

    // Keep only last 20 sessions
    sessions = sessions.slice(0, 20);

    localStorage.setItem('apiParserSessions', JSON.stringify(sessions));
    setSessions(sessions);
  };

  const deleteSession = (sessionId) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem('apiParserSessions', JSON.stringify(updated));
    setSessions(updated);
  };

  const clearAllSessions = () => {
    if (confirm('Are you sure you want to delete all session history?')) {
      localStorage.removeItem('apiParserSessions');
      setSessions([]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Expose saveSession method
  useEffect(() => {
    window.saveParsingSession = saveSession;
  }, []);

  if (sessions.length === 0) return null;

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold dark:text-white">Session History</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">({sessions.length})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            {showHistory ? 'Hide' : 'Show'}
          </button>
          {sessions.length > 0 && (
            <button
              onClick={clearAllSessions}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <a
                      href={session.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 truncate"
                      title={session.url}
                    >
                      {session.url}
                    </a>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(session.savedAt || session.timestamp)}
                    </span>
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {session.totalApis} API{session.totalApis !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onLoadSession(session)}
                    className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionHistory;
