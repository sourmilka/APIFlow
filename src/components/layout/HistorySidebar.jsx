import React, { useState, useEffect } from 'react';
import { Plus, Globe, Trash2, Clock, ChevronRight, Search, Settings, HelpCircle } from 'lucide-react';
import Logo from '../Logo';

const HistorySidebar = ({ onNewParse, onLoadSession, onSettingsClick, onHelpClick }) => {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredSession, setHoveredSession] = useState(null);

  // Load sessions from localStorage
  useEffect(() => {
    const loadSessions = () => {
      try {
        const saved = localStorage.getItem('apiflow-sessions');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Sort by timestamp, most recent first
          const sorted = parsed.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          );
          setSessions(sorted);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };

    loadSessions();
    
    // Listen for storage changes
    const handleStorage = () => loadSessions();
    window.addEventListener('storage', handleStorage);
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadSessions, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const deleteSession = (sessionId, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem('apiflow-sessions', JSON.stringify(updated));
  };

  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredSessions = sessions.filter(session =>
    session.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sessions by time periods
  const groupedSessions = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart - 86400000);
  const weekStart = new Date(now - 7 * 86400000);

  filteredSessions.forEach(session => {
    const sessionDate = new Date(session.timestamp);
    if (sessionDate >= todayStart) {
      groupedSessions.today.push(session);
    } else if (sessionDate >= yesterdayStart) {
      groupedSessions.yesterday.push(session);
    } else if (sessionDate >= weekStart) {
      groupedSessions.thisWeek.push(session);
    } else {
      groupedSessions.older.push(session);
    }
  });

  const SessionGroup = ({ title, sessions }) => {
    if (sessions.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <div className="space-y-0.5">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onLoadSession(session)}
              onMouseEnter={() => setHoveredSession(session.id)}
              onMouseLeave={() => setHoveredSession(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-all duration-200 group relative"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
              
              <div className="flex-1 min-w-0 text-left pr-8">
                <div className="text-sm font-medium text-foreground truncate">
                  {formatUrl(session.url)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatTime(session.timestamp)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {session.apis?.length || 0} APIs
                  </span>
                </div>
              </div>
              
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-64 border-r border-border bg-background">
      {/* Header with Logo */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <Logo size="md" showText={true} />
      </div>

      {/* New Parse Button */}
      <div className="flex-shrink-0 p-3">
        <button
          onClick={onNewParse}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          New Analysis
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-10 pr-3 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Session History */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Globe className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No history yet</p>
            <p className="text-xs text-muted-foreground/70">
              Start by analyzing a website
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Search className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No matches found</p>
          </div>
        ) : (
          <>
            <SessionGroup title="Today" sessions={groupedSessions.today} />
            <SessionGroup title="Yesterday" sessions={groupedSessions.yesterday} />
            <SessionGroup title="This Week" sessions={groupedSessions.thisWeek} />
            <SessionGroup title="Older" sessions={groupedSessions.older} />
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 p-2 border-t border-border space-y-1">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-foreground"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <button
          onClick={onHelpClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-foreground"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Help & Support</span>
        </button>
      </div>

    </div>
  );
};

export default HistorySidebar;
