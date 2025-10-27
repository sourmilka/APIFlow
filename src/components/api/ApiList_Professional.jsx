import React, { useState } from 'react';
import { Search, Filter, Download, ChevronRight, Globe, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Button } from '../ui/button';

const ApiList_Professional = ({ apis = [], onSelectApi, selectedApi }) => {
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
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-500/10';
    if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-500/10';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-500/10';
    return 'text-red-600 bg-red-500/10';
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

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">API Requests</h3>
            <p className="text-sm text-muted-foreground">{filteredApis.length} of {apis.length} requests</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search APIs by URL..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-lg border border-border">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-foreground"
            >
              {methods.map(method => (
                <option key={method} value={method}>{method.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-lg border border-border">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-foreground"
            >
              <option value="all">ALL</option>
              <option value="success">SUCCESS</option>
              <option value="error">ERROR</option>
            </select>
          </div>
        </div>
      </div>

      {/* API List */}
      <div className="space-y-2">
        {filteredApis.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Globe className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No APIs Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || methodFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start analyzing a website to see API requests'}
            </p>
          </div>
        ) : (
          filteredApis.map((api, index) => {
            const { domain, path } = formatUrl(api.url);
            const isSelected = selectedApi?.url === api.url;
            
            return (
              <div
                key={index}
                onClick={() => onSelectApi(api)}
                className={`group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/50 shadow-lg scale-[1.02]'
                    : 'bg-card border-border hover:bg-secondary/30 hover:border-primary/30 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Method Badge */}
                  <div className={`px-2.5 py-1 rounded-md border font-mono text-xs font-bold ${getMethodColor(api.request?.method || 'GET')}`}>
                    {api.request?.method || 'GET'}
                  </div>

                  {/* API Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{domain}</span>
                      {api.response?.status && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(api.response.status)}`}>
                          {api.response.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-foreground truncate mb-2">
                      {path}
                    </p>
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {api.response?.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{api.response.time}ms</span>
                        </div>
                      )}
                      {api.response?.size && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>{(api.response.size / 1024).toFixed(2)}KB</span>
                        </div>
                      )}
                      {api.authentication && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-medium">Auth</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                    isSelected ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'
                  }`} />
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-l-lg" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ApiList_Professional;
