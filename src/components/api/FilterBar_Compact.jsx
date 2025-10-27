import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';

const FilterBar_Compact = ({ onFilterChange, totalApis, filteredCount, apis = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    methods: [],
    status: 'all',
    domains: [],
    responseTimeRange: { min: 0, max: 10000, enabled: false },
    responseSizeRange: { min: 0, max: 10000000, enabled: false },
    dateTimeRange: { start: null, end: null, enabled: false },
    operator: 'AND'
  });

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  const domains = [...new Set(apis.map(api => {
    try { return new URL(api.url).hostname; } catch { return 'unknown'; }
  }))];

  const handleFilterUpdate = (updates) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const activeFiltersCount = 
    filters.methods.length +
    (filters.status !== 'all' ? 1 : 0) +
    filters.domains.length +
    (filters.responseTimeRange.enabled ? 1 : 0) +
    (filters.responseSizeRange.enabled ? 1 : 0);

  const toggleMethod = (method) => {
    const newMethods = filters.methods.includes(method)
      ? filters.methods.filter(m => m !== method)
      : [...filters.methods, method];
    handleFilterUpdate({ methods: newMethods });
  };

  const toggleDomain = (domain) => {
    const newDomains = filters.domains.includes(domain)
      ? filters.domains.filter(d => d !== domain)
      : [...filters.domains, domain];
    handleFilterUpdate({ domains: newDomains });
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: '',
      methods: [],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-2.5 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-[10px]"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Expandable Filter Options */}
      {isExpanded && (
        <div className="p-3 space-y-3 border-t border-border">
          {/* HTTP Methods */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">HTTP Methods</label>
            <div className="flex flex-wrap gap-1">
              {methods.map(method => (
                <button
                  key={method}
                  onClick={() => toggleMethod(method)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    filters.methods.includes(method)
                      ? 'bg-primary text-white'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterUpdate({ status: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-secondary/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success (2xx)</option>
              <option value="redirect">Redirect (3xx)</option>
              <option value="client-error">Client Error (4xx)</option>
              <option value="server-error">Server Error (5xx)</option>
            </select>
          </div>

          {/* Domains */}
          {domains.length > 1 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Domains</label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {domains.map(domain => (
                  <button
                    key={domain}
                    onClick={() => toggleDomain(domain)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      filters.domains.includes(domain)
                        ? 'bg-primary text-white'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground">Response Time (ms)</label>
              <input
                type="checkbox"
                checked={filters.responseTimeRange.enabled}
                onChange={(e) => handleFilterUpdate({
                  responseTimeRange: { ...filters.responseTimeRange, enabled: e.target.checked }
                })}
                className="w-3 h-3"
              />
            </div>
            {filters.responseTimeRange.enabled && (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.responseTimeRange.min}
                  onChange={(e) => handleFilterUpdate({
                    responseTimeRange: { ...filters.responseTimeRange, min: Number(e.target.value) }
                  })}
                  className="w-full px-2 py-1 text-xs bg-secondary/50 border border-border rounded"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.responseTimeRange.max}
                  onChange={(e) => handleFilterUpdate({
                    responseTimeRange: { ...filters.responseTimeRange, max: Number(e.target.value) }
                  })}
                  className="w-full px-2 py-1 text-xs bg-secondary/50 border border-border rounded"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="px-2.5 py-1.5 bg-secondary/20 border-t border-border text-[10px] text-muted-foreground text-center">
        {filteredCount} of {totalApis} APIs match filters
      </div>
    </div>
  );
};

export default FilterBar_Compact;
