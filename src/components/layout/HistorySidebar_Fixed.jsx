import React, { useState, useEffect } from 'react';
import { Plus, Globe, Trash2, Clock, Search, Settings, HelpCircle, Sparkles } from 'lucide-react';
import Logo from '../Logo';

const HistorySidebar_Fixed = ({ onNewParse, onLoadSession, onSettingsClick, onHelpClick }) => {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Load sessions from localStorage
  useEffect(() => {
    const loadSessions = () => {
      try {
        const saved = localStorage.getItem('apiflow-sessions');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Remove duplicates based on ID
          const uniqueSessions = Array.from(
            new Map(parsed.map(s => [s.id, s])).values()
          );
          // Sort by timestamp, most recent first
          const sorted = uniqueSessions.sort((a, b) => 
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
    e.preventDefault();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem('apiflow-sessions', JSON.stringify(updated));
  };

  const handleLoadSession = (session, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent duplicate creation by marking session as loaded from history
    const sessionWithId = { ...session, id: session.id, loadedFromHistory: true };
    setActiveSessionId(session.id);
    onLoadSession(sessionWithId);
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
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const groupSessionsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const week = new Date(today);
    week.setDate(week.getDate() - 7);

    return {
      today: sessions.filter(s => new Date(s.timestamp) >= today),
      yesterday: sessions.filter(s => {
        const date = new Date(s.timestamp);
        return date >= yesterday && date < today;
      }),
      thisWeek: sessions.filter(s => {
        const date = new Date(s.timestamp);
        return date >= week && date < yesterday;
      }),
      older: sessions.filter(s => new Date(s.timestamp) < week)
    };
  };

  const filteredSessions = sessions.filter(s => 
    s.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SessionItem = ({ session }) => (
    <button
      onClick={(e) => handleLoadSession(session, e)}
      className={`relative w-full text-left p-2 rounded-lg transition-all duration-200 group ${
        activeSessionId === session.id
          ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/15 shadow-md ring-1 ring-blue-500/30'
          : 'hover:bg-secondary/60 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Modern Icon */}
        <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          activeSessionId === session.id
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
            : 'bg-gradient-to-br from-secondary to-secondary/50 group-hover:from-blue-500/20 group-hover:to-purple-500/20'
        }`}>
          <Globe className={`w-4 h-4 ${
            activeSessionId === session.id ? 'text-white' : 'text-muted-foreground group-hover:text-blue-500'
          }`} />
          {activeSessionId === session.id && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-background animate-pulse" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold truncate mb-0.5 ${
            activeSessionId === session.id ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground'
          }`}>
            {formatUrl(session.url)}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <Clock className="w-2.5 h-2.5" />
            <span>{formatTime(session.timestamp)}</span>
            <span className="text-[6px]">●</span>
            <span className="font-semibold text-blue-500">{session.apis?.length || 0}</span>
          </div>
        </div>
        
        {/* Delete Button - Improved */}
        <button
          onClick={(e) => deleteSession(session.id, e)}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
          title="Delete"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </button>
  );

  const grouped = groupSessionsByDate();

  return (
    <div className="flex flex-col h-screen w-64 border-r border-border bg-gradient-to-b from-background via-background to-secondary/20 backdrop-blur-sm">
      {/* Header with Logo */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10">
        <Logo variant="sidebar" />
      </div>

      {/* New Analysis Button - Enhanced */}
      <div className="p-3">
        <button
          onClick={onNewParse}
          className="relative w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-600 hover:from-blue-600 hover:via-purple-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-xl shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97] overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Plus className="w-4 h-4 relative z-10" />
          <span className="text-sm relative z-10">New Analysis</span>
          <Sparkles className="w-3.5 h-3.5 relative z-10 animate-pulse" />
        </button>
      </div>

      {/* Search - Enhanced */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-secondary/60 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* History Groups - Modern Scroll */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4 custom-scrollbar">
        {grouped.today.length > 0 && (
          <div>
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <div className="w-1 h-3 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              Today
            </h4>
            <div className="space-y-1.5">
              {grouped.today.map(session => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
        
        {grouped.yesterday.length > 0 && (
          <div>
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <div className="w-1 h-3 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
              Yesterday
            </h4>
            <div className="space-y-1.5">
              {grouped.yesterday.map(session => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {grouped.thisWeek.length > 0 && (
          <div>
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <div className="w-1 h-3 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
              This Week
            </h4>
            <div className="space-y-1.5">
              {grouped.thisWeek.map(session => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {grouped.older.length > 0 && (
          <div>
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <div className="w-1 h-3 bg-gradient-to-b from-orange-500 to-red-600 rounded-full" />
              Older
            </h4>
            <div className="space-y-1.5">
              {grouped.older.map(session => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No history yet</p>
            <p className="text-[10px] mt-1">Start analyzing websites!</p>
          </div>
        )}
      </div>

      {/* Footer Actions - Modern */}
      <div className="border-t border-border/50 p-3 space-y-1.5 bg-gradient-to-t from-secondary/30 to-transparent">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-200 text-foreground group"
        >
          <div className="w-6 h-6 rounded-md bg-secondary group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
            <Settings className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-xs font-semibold">Settings</span>
        </button>
        
        <button
          onClick={onHelpClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-200 text-foreground group"
        >
          <div className="w-6 h-6 rounded-md bg-secondary group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
            <HelpCircle className="w-3.5 h-3.5 group-hover:text-purple-500 transition-colors" />
          </div>
          <span className="text-xs font-semibold">Help & Support</span>
        </button>
      </div>
    </div>
  );
};

export default HistorySidebar_Fixed;
