import React, { useState } from 'react';
import { Search, ChevronRight, Clock, Zap, Shield, Copy, Play, Download, MoreVertical, CheckCircle, AlertCircle } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';

const ApiList_Complete = ({ 
  apis = [], 
  onSelectApi, 
  selectedApi,
  selectedApis = [],
  onCheckApi,
  onCopy,
  onTest,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get unique methods
  const methods = ['all', ...new Set(apis.map(api => api.request?.method || 'GET'))];
  
  // Filter APIs
  const filteredApis = apis.filter(api => {
    const matchesSearch = api.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || api.request?.method === methodFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && api.response?.status >= 200 && api.response?.status < 300) ||
      (statusFilter === 'error' && (api.response?.status < 200 || api.response?.status >= 300));
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getMethodColor = (method) => {
    const colors = {
      'GET': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      'POST': 'bg-green-500/10 text-green-600 border-green-500/30',
      'PUT': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      'DELETE': 'bg-red-500/10 text-red-600 border-red-500/30',
      'PATCH': 'bg-purple-500/10 text-purple-600 border-purple-500/30'
    };
    return colors[method] || 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-500/10 border-green-500/30';
    if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-500/10 border-blue-500/30';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-600 bg-red-500/10 border-red-500/30';
  };

  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname,
        path: urlObj.pathname + urlObj.search
      };
    } catch {
      return { domain: '', path: url };
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Compact Header with Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 p-3 bg-card border border-border rounded-lg">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search APIs..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2 py-1.5 text-xs bg-secondary/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {methods.map(method => (
              <option key={method} value={method}>{method.toUpperCase()}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-xs bg-secondary/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">ALL STATUS</option>
            <option value="success">SUCCESS</option>
            <option value="error">ERROR</option>
          </select>
        </div>
      </div>

      {/* Compact Results Counter */}
      <div className="px-3 py-1.5 bg-secondary/30 border border-border rounded text-xs font-medium text-muted-foreground">
        Showing {filteredApis.length} of {apis.length} requests
      </div>

      {/* API List - Super Compact & Functional */}
      <div className="space-y-1.5">
        {filteredApis.map((api, index) => {
          const { domain, path } = formatUrl(api.url);
          const isSelected = selectedApi?.url === api.url;
          const isChecked = selectedApis.includes(api.url);
          
          return (
            <div
              key={index}
              className={`group relative p-2.5 rounded-lg border transition-all duration-150 ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/40 shadow-sm'
                  : 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-l-lg" />
              )}

              <div className="flex items-start gap-2">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-0.5">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => onCheckApi(api, checked)}
                  />
                </div>

                {/* Method Badge */}
                <div className={`flex-shrink-0 px-1.5 py-0.5 rounded border font-mono text-[10px] font-bold ${getMethodColor(api.request?.method || 'GET')}`}>
                  {api.request?.method || 'GET'}
                </div>

                {/* API Info */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelectApi(api)}
                >
                  {/* Domain & Status */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground truncate">
                      {domain}
                    </span>
                    {api.response?.status && (
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${getStatusColor(api.response.status)}`}>
                        {api.response.status}
                      </span>
                    )}
                    {api.authentication && (
                      <Shield className="w-3 h-3 text-yellow-500" title="Has Authentication" />
                    )}
                  </div>

                  {/* Path */}
                  <div className="text-xs font-mono text-foreground mb-1">
                    <div className="break-all line-clamp-2 max-w-full">
                      {path}
                    </div>
                  </div>
                  
                  {/* Meta Info - Compact */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    {api.response?.time && (
                      <div className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{api.response.time}ms</span>
                      </div>
                    )}
                    {api.response?.size && (
                      <div className="flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        <span>{formatSize(api.response.size)}</span>
                      </div>
                    )}
                    {api.response?.status >= 200 && api.response?.status < 300 && (
                      <div className="flex items-center gap-0.5 text-green-600">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span className="font-medium">Success</span>
                      </div>
                    )}
                    {api.response?.status >= 400 && (
                      <div className="flex items-center gap-0.5 text-red-600">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span className="font-medium">Error</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Compact */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopy(api);
                    }}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                    title="Copy as cURL"
                  >
                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTest(api);
                    }}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                    title="Test API"
                  >
                    <Play className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(api);
                    }}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                    title="Export"
                  >
                    <Download className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                {/* Chevron */}
                <ChevronRight className={`flex-shrink-0 w-4 h-4 text-muted-foreground transition-transform ${
                  isSelected ? 'rotate-90 text-primary' : 'group-hover:translate-x-0.5'
                }`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiList_Complete;
