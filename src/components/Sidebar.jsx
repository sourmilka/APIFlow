import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import {
  LayoutDashboard,
  Database,
  Wifi,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  Activity,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

// Navigation items configuration
const navigationItems = [
  { icon: LayoutDashboard, label: 'Overview', sectionId: 'overview' },
  { icon: Database, label: 'APIs', sectionId: 'apis' },
  { icon: Wifi, label: 'WebSockets', sectionId: 'websockets' },
  { icon: History, label: 'History', sectionId: 'history' },
  { icon: Settings, label: 'Settings', sectionId: 'settings' }
];

// Navigation sections configuration
const navigationSections = [
  {
    title: 'Main',
    items: ['overview', 'apis', 'websockets'],
    defaultExpanded: true
  },
  {
    title: 'Data',
    items: ['history'],
    defaultExpanded: true
  },
  {
    title: 'Configuration',
    items: ['settings'],
    defaultExpanded: true
  }
];

// NavItem sub-component
const NavItem = ({ icon: Icon, label, sectionId, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-xl
        transition-all duration-200 touch-manipulation relative
        ${isActive
          ? 'bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/30 dark:to-transparent text-primary-700 dark:text-primary-300 shadow-sm border-l-4 border-primary-600'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
      `}
    >
      <div className={`p-2 rounded-lg ${
        isActive 
          ? 'bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-md' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
};

// CollapsibleSection sub-component
const CollapsibleSection = ({ title, children, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="sidebar-section">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 md:py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors touch-manipulation"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <span>{title}</span>
      </button>
      <div
        className={`
          overflow-hidden transition-all duration-300
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="mt-1 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Main Sidebar component
const Sidebar = ({ stats, onLoadSession, onNewParse }) => {
  const { activeSection, setActiveSection, closeSidebar } = useNavigation();

  // Recent sessions for horizontal history strip
  const [recentSessions, setRecentSessions] = useState([]);

  const loadRecent = () => {
    try {
      const stored = localStorage.getItem('apiParserSessions');
      if (!stored) return setRecentSessions([]);
      const parsed = JSON.parse(stored || '[]');
      setRecentSessions(parsed.slice(0, 12));
    } catch (err) {
      console.error('Failed to load recent sessions for sidebar:', err);
      setRecentSessions([]);
    }
  };

  useEffect(() => {
    loadRecent();
    const onStorage = (e) => {
      if (e.key === 'apiParserSessions') loadRecent();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleNavItemClick = (sectionId) => {
    setActiveSection(sectionId);
    closeSidebar();
    // Scroll to top of main content area
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Branding Area */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-lg">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl shadow-md">
              <Database className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">APIFlow</h1>
              <button
                onClick={() => onNewParse && onNewParse()}
                title="New parse"
                className="ml-auto p-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Analyze any site and capture APIs</p>
          </div>
        </div>

        {/* Horizontal recent sessions strip (AI-chat style) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Recent Parses</span>
            <button
              onClick={() => {
                localStorage.removeItem('apiParserSessions');
                setRecentSessions([]);
              }}
              className="text-xs text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => onNewParse && onNewParse()}
              className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md text-sm font-medium shrink-0"
              title="New parse"
            >
              <span className="text-lg">+</span>
              New
            </button>
            {recentSessions.length === 0 ? (
              <div className="text-xs text-muted-foreground px-2">No recent parses</div>
            ) : (
              recentSessions.map((s) => (
                <button
                  key={s.id || s.savedAt || s.timestamp}
                  onClick={() => onLoadSession && onLoadSession(s)}
                  className="flex-shrink-0 max-w-[160px] text-left px-3 py-2 bg-card border border-border rounded-md hover:shadow-sm"
                  title={s.url}
                >
                  <div className="truncate text-sm font-medium text-primary-700 dark:text-primary-300">{s.url}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.savedAt || s.timestamp).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        </div>

        </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto px-4 mobile-scroll">
        {navigationSections.map((section) => {
          const sectionItems = navigationItems.filter((item) =>
            section.items.includes(item.sectionId)
          );

          return (
            <CollapsibleSection
              key={section.title}
              title={section.title}
              defaultExpanded={section.defaultExpanded}
            >
              {sectionItems.map((item) => (
                <NavItem
                  key={item.sectionId}
                  icon={item.icon}
                  label={item.label}
                  sectionId={item.sectionId}
                  isActive={activeSection === item.sectionId}
                  onClick={() => handleNavItemClick(item.sectionId)}
                />
              ))}
            </CollapsibleSection>
          );
        })}
      </nav>

      {/* Quick Stats Summary Panel */}
      {stats && (stats.total > 0 || stats.total === 0) && (
        <div className="mt-auto border-t-2 border-primary-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 shadow-inner">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            {/* Total APIs */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.total || 0}
              </span>
            </div>

            {/* Successful */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.successful || 0}
              </span>
            </div>

            {/* Failed */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Failed</span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.failed || 0}
              </span>
            </div>

            {/* Average Response Time */}
            {stats.avgResponseTime !== undefined && stats.avgResponseTime !== null && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Time</span>
                </div>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {stats.avgResponseTime}ms
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
