import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader2, Globe, Server, Clock } from 'lucide-react';

const DnsChecker = () => {
  const [url, setUrl] = useState('https://ge.movie/');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const checkDNS = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:3001/api/dns/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to check DNS');
      }
    } catch (err) {
      setError(`Error: ${err.message}. Make sure the server is running on port 3001.`);
    } finally {
      setLoading(false);
    }
  };

  const getDNSStatusColor = (working) => {
    return working ? 'text-green-500' : 'text-red-500';
  };

  const getDNSStatusIcon = (working) => {
    return working ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DNS Blocking Detector
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Detect DNS blocking and find working DNS servers automatically
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Website URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                onKeyPress={(e) => e.key === 'Enter' && checkDNS()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={checkDNS}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Check DNS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400 mb-1">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className={`rounded-2xl shadow-2xl p-6 border ${
              results.isBlocked 
                ? 'bg-red-500/10 border-red-500/50' 
                : 'bg-green-500/10 border-green-500/50'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  results.isBlocked ? 'bg-red-500/20' : 'bg-green-500/20'
                }`}>
                  {results.isBlocked ? (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold mb-2 ${
                    results.isBlocked ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {results.isBlocked ? 'DNS Blocking Detected!' : 'No Blocking Detected'}
                  </h2>
                  <p className="text-slate-300 mb-3">{results.recommendation}</p>
                  
                  {results.workingDNS && (
                    <div className="bg-slate-800/50 rounded-lg p-4 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold text-blue-400">Recommended DNS:</span>
                      </div>
                      <div className="text-white">
                        <div className="font-bold">{results.workingDNS.name}</div>
                        <div className="text-sm text-slate-400">
                          {results.workingDNS.servers?.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                DNS Test Results
              </h3>
              
              <div className="space-y-3">
                {results.checks.map((check, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      check.working
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={getDNSStatusColor(check.working)}>
                          {getDNSStatusIcon(check.working)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{check.dnsProvider}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              check.working 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {check.working ? 'Working' : 'Failed'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-slate-400 space-y-1">
                            <div className="flex items-center gap-2">
                              <Server className="w-4 h-4" />
                              <span>{check.dnsServers.join(', ')}</span>
                            </div>
                            
                            {check.dnsResolution.success ? (
                              <div className="text-green-400">
                                ✓ DNS: {check.dnsResolution.message}
                              </div>
                            ) : (
                              <div className="text-red-400">
                                ✗ DNS: {check.dnsResolution.message}
                              </div>
                            )}
                            
                            {check.httpAccess && (
                              <div className={check.httpAccess.success ? 'text-green-400' : 'text-red-400'}>
                                {check.httpAccess.success ? '✓' : '✗'} HTTP: {check.httpAccess.message}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{check.duration}ms</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {results.isBlocked && results.workingDNS && (
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-3">
                  How to Change Your DNS Settings
                </h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p><strong>Windows:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Open Control Panel → Network and Sharing Center</li>
                    <li>Click on your connection → Properties</li>
                    <li>Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties</li>
                    <li>Choose "Use the following DNS server addresses"</li>
                    <li>Enter: Preferred DNS: {results.workingDNS.servers[0]}, Alternate DNS: {results.workingDNS.servers[1]}</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DnsChecker;
