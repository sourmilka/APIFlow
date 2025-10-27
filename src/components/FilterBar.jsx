import { Search, Filter, X, ChevronDown, ChevronUp, Save, Trash2, Clock, HardDrive, Globe } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { FILTER_PRESETS, extractDomain, parseResponseSize, saveFilterConfig, loadFilterConfig, getSavedFilterNames, deleteFilterConfig } from '../utils/filterUtils';
import FilterPresetButton from './FilterPresetButton';
import RangeFilter from './RangeFilter';
import DateTimeRangeFilter from './DateTimeRangeFilter';
import SaveFilterDialog from './SaveFilterDialog';

function FilterBar({ onFilterChange, totalApis, filteredCount, apis = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [responseTimeRange, setResponseTimeRange] = useState({ min: 0, max: 10000, enabled: false });
  const [responseSizeRange, setResponseSizeRange] = useState({ min: 0, max: 10000000, enabled: false });
  const [dateTimeRange, setDateTimeRange] = useState({ start: null, end: null, enabled: false });
  const [filterOperator, setFilterOperator] = useState('AND');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success (2xx)' },
    { value: 'error', label: 'Error (4xx, 5xx)' },
    { value: 'redirect', label: 'Redirect (3xx)' }
  ];

  // Load saved filters on mount
  useEffect(() => {
    const names = getSavedFilterNames();
    setSavedFilters(names);
  }, []);

  // Extract available domains from APIs
  const availableDomains = useMemo(() => {
    if (!apis || apis.length === 0) return [];
    const domains = new Set();
    apis.forEach(api => {
      const domain = extractDomain(api.url);
      if (domain && domain !== 'Invalid URL') {
        domains.add(domain);
      }
    });
    return Array.from(domains).sort();
  }, [apis]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    applyFilters(value, selectedMethods, selectedStatus, selectedDomains, responseTimeRange, responseSizeRange, dateTimeRange, filterOperator);
  };

  const handleMethodToggle = (method) => {
    const newMethods = selectedMethods.includes(method)
      ? selectedMethods.filter(m => m !== method)
      : [...selectedMethods, method];
    setSelectedMethods(newMethods);
    applyFilters(searchTerm, newMethods, selectedStatus, selectedDomains, responseTimeRange, responseSizeRange, dateTimeRange, filterOperator);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    applyFilters(searchTerm, selectedMethods, status, selectedDomains, responseTimeRange, responseSizeRange, dateTimeRange, filterOperator);
  };

  const handleDomainToggle = (domain) => {
    const newDomains = selectedDomains.includes(domain)
      ? selectedDomains.filter(d => d !== domain)
      : [...selectedDomains, domain];
    setSelectedDomains(newDomains);
    applyFilters(searchTerm, selectedMethods, selectedStatus, newDomains, responseTimeRange, responseSizeRange, dateTimeRange, filterOperator);
  };

  const handleResponseTimeChange = (range) => {
    const newRange = { ...responseTimeRange, ...range };
    setResponseTimeRange(newRange);
    applyFilters(searchTerm, selectedMethods, selectedStatus, selectedDomains, newRange, responseSizeRange, dateTimeRange, filterOperator);
  };

  const handleResponseSizeChange = (range) => {
    const newRange = { ...responseSizeRange, ...range };
    setResponseSizeRange(newRange);
    applyFilters(searchTerm, selectedMethods, selectedStatus, selectedDomains, responseTimeRange, newRange, dateTimeRange, filterOperator);
  };

  const handleDateTimeChange = (range) => {
    const newRange = { ...dateTimeRange, ...range };
    setDateTimeRange(newRange);
    applyFilters(searchTerm, selectedMethods, selectedStatus, selectedDomains, responseTimeRange, responseSizeRange, newRange, filterOperator);
  };

  const handleOperatorChange = (operator) => {
    setFilterOperator(operator);
    applyFilters(searchTerm, selectedMethods, selectedStatus, selectedDomains, responseTimeRange, responseSizeRange, dateTimeRange, operator);
  };

  const formatResponseSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  const activeFilterCount = [
    searchTerm ? 1 : 0,
    selectedMethods.length,
    selectedStatus !== 'all' ? 1 : 0,
    selectedDomains.length,
    responseTimeRange.enabled ? 1 : 0,
    responseSizeRange.enabled ? 1 : 0,
    dateTimeRange.enabled ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const applyFilters = (search, methods, status, domains, timeRange, sizeRange, dateRange, operator) => {
    onFilterChange({
      searchTerm: search,
      methods,
      status,
      domains,
      responseTimeRange: timeRange,
      responseSizeRange: sizeRange,
      dateTimeRange: dateRange,
      operator
    });
    setActivePreset(null);
  };

  const applyPreset = (presetName) => {
    const preset = FILTER_PRESETS[presetName];
    if (!preset) return;

    const config = preset.filterConfig;
    setSearchTerm(config.searchTerm);
    setSelectedMethods(config.methods);
    setSelectedStatus(config.status);
    setSelectedDomains(config.domains);
    setResponseTimeRange(config.responseTimeRange);
    setResponseSizeRange(config.responseSizeRange);
    setDateTimeRange(config.dateTimeRange);
    setFilterOperator(config.operator);
    setActivePreset(presetName);

    onFilterChange(config);
  };

  const handleSaveFilter = () => {
    const config = {
      searchTerm,
      methods: selectedMethods,
      status: selectedStatus,
      domains: selectedDomains,
      responseTimeRange,
      responseSizeRange,
      dateTimeRange,
      operator: filterOperator
    };

    if (saveFilterConfig(newFilterName, config)) {
      setSavedFilters([...savedFilters, newFilterName].sort());
      setShowSaveDialog(false);
      setNewFilterName('');
    }
  };

  const handleLoadFilter = (name) => {
    const config = loadFilterConfig(name);
    if (!config) return;

    setSearchTerm(config.searchTerm || '');
    setSelectedMethods(config.methods || []);
    setSelectedStatus(config.status || 'all');
    setSelectedDomains(config.domains || []);
    setResponseTimeRange(config.responseTimeRange || { min: 0, max: 10000, enabled: false });
    setResponseSizeRange(config.responseSizeRange || { min: 0, max: 10000000, enabled: false });
    setDateTimeRange(config.dateTimeRange || { start: null, end: null, enabled: false });
    setFilterOperator(config.operator || 'AND');
    setActivePreset(null);

    onFilterChange(config);
  };

  const handleDeleteFilter = (name) => {
    if (window.confirm(`Delete saved filter "${name}"?`)) {
      deleteFilterConfig(name);
      setSavedFilters(savedFilters.filter(f => f !== name));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMethods([]);
    setSelectedStatus('all');
    setSelectedDomains([]);
    setResponseTimeRange({ min: 0, max: 10000, enabled: false });
    setResponseSizeRange({ min: 0, max: 10000000, enabled: false });
    setDateTimeRange({ start: null, end: null, enabled: false });
    setFilterOperator('AND');
    setActivePreset(null);
    onFilterChange({
      searchTerm: '',
      methods: [],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    });
  };

  const hasActiveFilters = searchTerm || selectedMethods.length > 0 || selectedStatus !== 'all' ||
    selectedDomains.length > 0 || responseTimeRange.enabled || responseSizeRange.enabled ||
    dateTimeRange.enabled || filterOperator !== 'AND';

  return (
    <div className="space-y-2">
      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by URL, method, or status..."
            className="w-full px-4 py-1.5 pl-10 pr-10 border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative btn-secondary flex items-center gap-2 p-3 md:p-2 touch-manipulation ${showFilters ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary-600 text-white rounded-full px-1.5 py-0.5 text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Presets */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-3 md:p-4 border border-gray-200 space-y-3">
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory mobile-scroll">
              {Object.values(FILTER_PRESETS).map(preset => (
                <div key={preset.name} className="snap-start">
                  <FilterPresetButton
                    preset={preset}
                    isActive={activePreset === preset.name}
                    onApply={applyPreset}
                  />
                </div>
              ))}
              <div className="snap-start">
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 md:py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-all whitespace-nowrap
                           flex items-center gap-2 touch-manipulation"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Saved Filters
              </label>
              <div className="flex flex-wrap gap-1.5">
                {savedFilters.map(name => (
                  <div
                    key={name}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <button
                      onClick={() => handleLoadFilter(name)}
                      className="hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                    >
                      {name}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(name)}
                      className="ml-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label={`Delete ${name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Current Filters
          </button>

          {/* Basic Filters */}
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {/* Method Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                HTTP Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {methods.map(method => (
                  <button
                    key={method}
                    onClick={() => handleMethodToggle(method)}
                    className={`px-3 py-2 md:px-2.5 md:py-1 text-xs rounded-lg border transition-all touch-manipulation ${
                      selectedMethods.includes(method)
                        ? 'bg-primary-600 text-white border-primary-600 dark:bg-primary-500 dark:border-primary-500'
                        : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Response Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="input-field"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Domain Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Domains {selectedDomains.length > 0 && `(${selectedDomains.length})`}
              </label>
              <div className="max-h-24 md:max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 mobile-scroll">
                {availableDomains.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No domains available</p>
                ) : (
                  availableDomains.map(domain => (
                    <label key={domain} className="flex items-center gap-2 py-1.5 md:py-1 hover:bg-gray-50 dark:hover:bg-gray-600 px-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDomains.includes(domain)}
                        onChange={() => handleDomainToggle(domain)}
                        className="w-5 h-5 md:w-4 md:h-4 text-primary-600 rounded focus:ring-primary-500 touch-manipulation"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={domain}>
                        {domain}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Filters
          </button>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="space-y-3 animate-fadeIn">
              <RangeFilter
                label="Response Time"
                icon={Clock}
                enabled={responseTimeRange.enabled}
                min={responseTimeRange.min}
                max={responseTimeRange.max}
                unit="ms"
                helperText="Filter APIs by response time (milliseconds)"
                onEnabledChange={(enabled) => handleResponseTimeChange({ enabled })}
                onRangeChange={handleResponseTimeChange}
                presets={[
                  { label: '< 100ms', min: 0, max: 100 },
                  { label: '100-500ms', min: 100, max: 500 },
                  { label: '500-1000ms', min: 500, max: 1000 },
                  { label: '> 1000ms', min: 1000, max: 10000 }
                ]}
              />

              <RangeFilter
                label="Response Size"
                icon={HardDrive}
                enabled={responseSizeRange.enabled}
                min={responseSizeRange.min}
                max={responseSizeRange.max}
                unit="bytes"
                helperText="Filter APIs by response size"
                onEnabledChange={(enabled) => handleResponseSizeChange({ enabled })}
                onRangeChange={handleResponseSizeChange}
                formatValue={formatResponseSize}
                presets={[
                  { label: '< 10KB', min: 0, max: 10240 },
                  { label: '10-100KB', min: 10240, max: 102400 },
                  { label: '100KB-1MB', min: 102400, max: 1048576 },
                  { label: '> 1MB', min: 1048576, max: 10000000 }
                ]}
              />

              <DateTimeRangeFilter
                enabled={dateTimeRange.enabled}
                startDate={dateTimeRange.start}
                endDate={dateTimeRange.end}
                onEnabledChange={(enabled) => handleDateTimeChange({ enabled })}
                onRangeChange={handleDateTimeChange}
              />
            </div>
          )}

          {/* Filter Operator */}
          {activeFilterCount > 1 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Combine filters using:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="radio"
                    name="operator"
                    value="AND"
                    checked={filterOperator === 'AND'}
                    onChange={(e) => handleOperatorChange(e.target.value)}
                    className="w-5 h-5 md:w-4 md:h-4 text-primary-600 focus:ring-primary-500 touch-manipulation"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    AND (match all)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="radio"
                    name="operator"
                    value="OR"
                    checked={filterOperator === 'OR'}
                    onChange={(e) => handleOperatorChange(e.target.value)}
                    className="w-5 h-5 md:w-4 md:h-4 text-primary-600 focus:ring-primary-500 touch-manipulation"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    OR (match any)
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {filterOperator === 'AND' 
                  ? 'APIs must match all active filters'
                  : 'APIs must match at least one active filter'}
              </p>
            </div>
          )}

          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearFilters}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Clear all filters ({activeFilterCount} active)
              </button>
            </div>
          )}
        </div>
      )}

      <SaveFilterDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveFilter}
        existingNames={savedFilters}
      />

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold">{filteredCount}</span> of{' '}
          <span className="font-semibold">{totalApis}</span> APIs
        </div>
      )}
    </div>
  );
}

export default FilterBar;
