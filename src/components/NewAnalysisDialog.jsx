import React, { useState } from 'react';
import { X, Search, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NewAnalysisDialog = ({ onClose, onAnalyze, onOpenSettings }) => {
  const [url, setUrl] = useState('');

  const handleAnalyze = () => {
    if (url.trim()) {
      onAnalyze(url);
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && url.trim()) {
      handleAnalyze();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full border border-border">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-lg shadow-blue-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">New Analysis</h2>
              <p className="text-sm text-muted-foreground">Enter a website URL to analyze</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Website URL
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://github.com"
                className="w-full pl-11 pr-4 py-3 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Examples */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'https://github.com',
                'https://www.reddit.com/',
                'https://api.github.com',
                'https://jsonplaceholder.typicode.com/'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setUrl(example)}
                  className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/70 rounded-md border border-border transition-colors text-blue-400 font-mono"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary/50 hover:bg-secondary border border-border rounded-lg transition-colors text-foreground"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Configuration</span>
          </button>

          {/* Help Text */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400">
              <strong>💡 Tip:</strong> APIFlow will automatically capture all API calls, WebSocket connections, and network requests from the website.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={!url.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg"
          >
            Start Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewAnalysisDialog;
