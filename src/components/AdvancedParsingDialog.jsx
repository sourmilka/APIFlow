import React, { useState, useEffect } from 'react';
import { Settings, Shield, Zap, Target, Bug, Globe, Server, X, Check } from 'lucide-react';

const AdvancedParsingDialog = ({ isOpen, onClose, onParse, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [profile, setProfile] = useState('default');
  const [profiles, setProfiles] = useState({});
  const [useProxy, setUseProxy] = useState(false);
  const [proxies, setProxies] = useState('');
  const [customOptions, setCustomOptions] = useState({
    timeout: 30000,
    maxRetries: 3,
    captureScreenshot: false,
    stealth: true,
    headless: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/parsing/profiles');
      const data = await response.json();
      if (data.success) {
        setProfiles(data.profileDetails);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleProfileChange = (newProfile) => {
    setProfile(newProfile);
    if (profiles[newProfile]) {
      setCustomOptions({
        timeout: profiles[newProfile].timeout,
        maxRetries: profiles[newProfile].maxRetries,
        captureScreenshot: profiles[newProfile].captureScreenshot,
        stealth: profiles[newProfile].stealth,
        headless: profiles[newProfile].headless
      });
    }
  };

  const handleParse = async () => {
    if (!url) return;

    setLoading(true);
    try {
      const proxyList = useProxy && proxies 
        ? proxies.split('\n').map(p => p.trim()).filter(p => p) 
        : [];

      await onParse({
        url,
        profile,
        customOptions,
        useProxy,
        proxies: proxyList
      });
    } finally {
      setLoading(false);
    }
  };

  const profileIcons = {
    default: Settings,
    fast: Zap,
    complete: Target,
    stealth: Shield,
    debug: Bug,
    spa: Globe,
    apiHeavy: Server,
    geoRestricted: Globe
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-7 h-7 text-blue-400" />
              Advanced Parsing Configuration
            </h2>
            <p className="text-slate-400 mt-1">Configure professional parsing options for difficult websites</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Website URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
            />
          </div>

          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Parsing Profile
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(profiles).map((profileName) => {
                const Icon = profileIcons[profileName] || Settings;
                const isSelected = profile === profileName;
                return (
                  <button
                    key={profileName}
                    onClick={() => handleProfileChange(profileName)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <div className={`text-sm font-medium ${isSelected ? 'text-blue-400' : 'text-slate-300'}`}>
                      {profileName}
                    </div>
                  </button>
                );
              })}
            </div>
            {profiles[profile] && (
              <div className="mt-3 p-3 bg-slate-700/30 rounded-lg">
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Profile Details:</strong> 
                  {' '}{profiles[profile].timeout}ms timeout, 
                  {' '}{profiles[profile].maxRetries} retries, 
                  {' '}{profiles[profile].stealth ? 'Stealth enabled' : 'Stealth disabled'}
                </p>
              </div>
            )}
          </div>

          {/* Custom Options */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Custom Options
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  value={customOptions.timeout}
                  onChange={(e) => setCustomOptions({...customOptions, timeout: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Retries</label>
                <input
                  type="number"
                  value={customOptions.maxRetries}
                  onChange={(e) => setCustomOptions({...customOptions, maxRetries: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customOptions.stealth}
                  onChange={(e) => setCustomOptions({...customOptions, stealth: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-300">Stealth Mode</span>
                  <p className="text-xs text-slate-400">Avoid bot detection with anti-fingerprinting</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customOptions.captureScreenshot}
                  onChange={(e) => setCustomOptions({...customOptions, captureScreenshot: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-300">Capture Screenshot</span>
                  <p className="text-xs text-slate-400">Save a screenshot of the parsed page</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!customOptions.headless}
                  onChange={(e) => setCustomOptions({...customOptions, headless: !e.target.checked})}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-300">Show Browser (Debug)</span>
                  <p className="text-xs text-slate-400">Show browser window for debugging</p>
                </div>
              </label>
            </div>
          </div>

          {/* Proxy Configuration */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-300">Use Proxy Rotation</span>
                <p className="text-xs text-slate-400">Rotate through proxies to bypass restrictions</p>
              </div>
            </label>

            {useProxy && (
              <div>
                <textarea
                  value={proxies}
                  onChange={(e) => setProxies(e.target.value)}
                  placeholder="http://proxy1.example.com:8080&#10;http://proxy2.example.com:8080&#10;http://username:password@proxy3.example.com:8080"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 text-sm font-mono"
                  rows="4"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter one proxy per line. Format: protocol://host:port or protocol://user:pass@host:port
                </p>
              </div>
            )}
          </div>

          {/* Feature Highlights */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Professional Features Enabled
            </h3>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>✓ Anti-bot detection & fingerprint evasion</li>
              <li>✓ Automatic retry with exponential backoff</li>
              <li>✓ Smart resource blocking for faster parsing</li>
              <li>✓ JavaScript error capture & console logging</li>
              <li>✓ Request/Response interception</li>
              <li>✓ Site-specific configuration detection</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleParse}
            disabled={loading || !url}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Parsing...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Parse with Advanced Mode
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedParsingDialog;
