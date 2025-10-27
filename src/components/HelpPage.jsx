import React from 'react';
import { X, Zap, Shield, Globe, Database, Wifi, TrendingUp, Clock, Search, Settings, HelpCircle } from 'lucide-react';

const HelpPage = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <HelpCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Welcome to APIFlow</h2>
              <p className="text-sm text-muted-foreground">Professional API Discovery & Analysis Platform</p>
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
        <div className="p-6 space-y-8">
          {/* What is APIFlow */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-foreground">What is APIFlow?</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              APIFlow is a professional platform that helps developers discover, analyze, and understand APIs from any website. 
              Simply enter a website URL, and APIFlow will automatically capture all API calls, requests, responses, and 
              WebSocket connections happening on that page.
            </p>
          </section>

          {/* How to Use */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-foreground">How to Use</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Enter Website URL</h4>
                  <p className="text-sm text-muted-foreground">Type or paste any website URL into the search bar (e.g., https://github.com)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Click Analyze</h4>
                  <p className="text-sm text-muted-foreground">APIFlow will launch a headless browser and capture all network activity</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">View Results</h4>
                  <p className="text-sm text-muted-foreground">Explore captured APIs, filter by method, status, or search for specific endpoints</p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-foreground">Features</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
                <Database className="w-6 h-6 text-blue-500 mb-2" />
                <h4 className="font-semibold text-foreground mb-1">Real-time API Capture</h4>
                <p className="text-sm text-muted-foreground">Automatically detects and captures all API calls</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                <Wifi className="w-6 h-6 text-purple-500 mb-2" />
                <h4 className="font-semibold text-foreground mb-1">WebSocket Monitoring</h4>
                <p className="text-sm text-muted-foreground">Track real-time WebSocket connections and messages</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
                <Shield className="w-6 h-6 text-green-500 mb-2" />
                <h4 className="font-semibold text-foreground mb-1">Authentication Detection</h4>
                <p className="text-sm text-muted-foreground">Identifies API keys, tokens, and auth headers</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/30">
                <TrendingUp className="w-6 h-6 text-orange-500 mb-2" />
                <h4 className="font-semibold text-foreground mb-1">Advanced Filtering</h4>
                <p className="text-sm text-muted-foreground">Search, filter, and sort APIs by multiple criteria</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/30">
                <Clock className="w-6 h-6 text-cyan-500 mb-2" />
                <h4 className="font-semibold text-foreground mb-1">Session History</h4>
                <p className="text-sm text-muted-foreground">Access past analyses with automatic saving</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/30">
                <Globe className="w-6 h-6 text-pink-500 mb-2" />
                <h4 className="font-semibold text-foreground mb-1">Bot Evasion</h4>
                <p className="text-sm text-muted-foreground">Stealth mode to bypass anti-bot detection</p>
              </div>
            </div>
          </section>

          {/* Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-foreground">Advanced Configuration</h3>
            </div>
            <p className="text-muted-foreground mb-3">
              Click the <strong className="text-foreground">Settings</strong> button in the left sidebar to configure:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong className="text-foreground">Custom Headers:</strong> Add authentication tokens, API keys</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong className="text-foreground">Cookies:</strong> Import session cookies for authenticated pages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong className="text-foreground">User Agent:</strong> Customize browser user agent string</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong className="text-foreground">Parsing Profiles:</strong> Use stealth, fast, or complete modes</span>
              </li>
            </ul>
          </section>

          {/* Tips */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-foreground">Pro Tips</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <strong className="text-blue-400">💡 Tip:</strong> Use the search bar in the history sidebar to quickly find past analyses
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <strong className="text-green-400">💡 Tip:</strong> Click on any API in the list to view detailed request/response information
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <strong className="text-purple-400">💡 Tip:</strong> For difficult sites, enable stealth mode in Settings
              </div>
            </div>
          </section>

          {/* Recommended Sites */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-foreground">Recommended Test Sites</h3>
            </div>
            <p className="text-muted-foreground mb-3">Try analyzing these popular websites:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <code className="px-3 py-2 bg-secondary rounded text-sm text-blue-400 font-mono">https://github.com</code>
              <code className="px-3 py-2 bg-secondary rounded text-sm text-blue-400 font-mono">https://www.reddit.com/</code>
              <code className="px-3 py-2 bg-secondary rounded text-sm text-blue-400 font-mono">https://api.github.com</code>
              <code className="px-3 py-2 bg-secondary rounded text-sm text-blue-400 font-mono">https://jsonplaceholder.typicode.com/</code>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-semibold text-white transition-all"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
