import React from 'react';
import { Search, Settings, HelpCircle, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';

const TopNav = ({ url, setUrl, loading, onParse, onSettingsClick, onHelpClick }) => {
  const { theme, toggleTheme } = useTheme();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && url) {
      onParse();
    }
  };

  return (
    <div className="flex-shrink-0 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="h-full px-6 flex items-center gap-4">
        {/* Search Bar - takes most space */}
        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter website URL to analyze... (e.g., https://github.com)"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
              disabled={loading}
            />
          </div>
        </div>

        {/* Parse Button */}
        <Button
          onClick={onParse}
          disabled={loading || !url}
          className="px-6 h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="h-9 w-9"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onHelpClick}
            className="h-9 w-9"
            title="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
