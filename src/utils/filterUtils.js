// Filter Preset Definitions
export const FILTER_PRESETS = {
  'Slow APIs': {
    name: 'Slow APIs',
    description: 'APIs with response time > 1000ms',
    icon: '🐌',
    filterConfig: {
      searchTerm: '',
      methods: [],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 1000, max: 10000, enabled: true },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    }
  },
  'Large Responses': {
    name: 'Large Responses',
    description: 'APIs with response size > 100KB',
    icon: '📦',
    filterConfig: {
      searchTerm: '',
      methods: [],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 100000, max: 10000000, enabled: true },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    }
  },
  'Failed Requests': {
    name: 'Failed Requests',
    description: 'APIs with status >= 400',
    icon: '❌',
    filterConfig: {
      searchTerm: '',
      methods: [],
      status: 'error',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    }
  },
  'Recent APIs': {
    name: 'Recent APIs',
    description: 'APIs from the last 5 minutes',
    icon: '⏰',
    filterConfig: {
      searchTerm: '',
      methods: [],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { 
        start: new Date(Date.now() - 5 * 60 * 1000).toISOString(), 
        end: new Date().toISOString(), 
        enabled: true 
      },
      operator: 'AND'
    }
  },
  'GraphQL Queries': {
    name: 'GraphQL Queries',
    description: 'APIs with URL containing "graphql"',
    icon: '🔷',
    filterConfig: {
      searchTerm: 'graphql',
      methods: [],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    }
  },
  'POST Requests': {
    name: 'POST Requests',
    description: 'APIs with POST method',
    icon: '📮',
    filterConfig: {
      searchTerm: '',
      methods: ['POST'],
      status: 'all',
      domains: [],
      responseTimeRange: { min: 0, max: 10000, enabled: false },
      responseSizeRange: { min: 0, max: 10000000, enabled: false },
      dateTimeRange: { start: null, end: null, enabled: false },
      operator: 'AND'
    }
  }
};

// Domain Extraction Function
export const extractDomain = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return 'Invalid URL';
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return 'Invalid URL';
  }
};

// Filter Validation Functions
export const isValidResponseTime = (value) => {
  return typeof value === 'number' && value >= 0;
};

export const isValidResponseSize = (value) => {
  return typeof value === 'number' && value >= 0;
};

export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start instanceof Date && end instanceof Date && 
         !isNaN(start.getTime()) && !isNaN(end.getTime()) && 
         start <= end;
};

// Parse Response Size
export const parseResponseSize = (sizeString) => {
  if (typeof sizeString === 'number') {
    return sizeString;
  }
  
  if (typeof sizeString !== 'string') {
    return 0;
  }
  
  const sizeStr = sizeString.trim().toUpperCase();
  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/);
  
  if (!match) {
    return 0;
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'B';
  
  const multipliers = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  return value * (multipliers[unit] || 1);
};

// Filter Application Function
export const applyFilters = (apis, filterConfig, operator = 'AND') => {
  if (!apis || !Array.isArray(apis)) {
    return [];
  }
  
  return apis.filter(api => {
    const checks = [];
    
    // Search term filter
    if (filterConfig.searchTerm && filterConfig.searchTerm.trim() !== '') {
      const searchLower = filterConfig.searchTerm.toLowerCase();
      const matchesSearch = 
        api.url?.toLowerCase().includes(searchLower) ||
        api.method?.toLowerCase().includes(searchLower) ||
        api.type?.toLowerCase().includes(searchLower) ||
        JSON.stringify(api.response?.data || {}).toLowerCase().includes(searchLower);
      checks.push({ active: true, passes: matchesSearch });
    }
    
    // Method filter
    if (filterConfig.methods && filterConfig.methods.length > 0) {
      const matchesMethod = filterConfig.methods.includes(api.method);
      checks.push({ active: true, passes: matchesMethod });
    }
    
    // Status filter
    if (filterConfig.status && filterConfig.status !== 'all') {
      let matchesStatus = false;
      const status = api.response?.status;
      
      if (filterConfig.status === 'success' && status >= 200 && status < 300) {
        matchesStatus = true;
      } else if (filterConfig.status === 'error' && status >= 400) {
        matchesStatus = true;
      } else if (filterConfig.status === 'redirect' && status >= 300 && status < 400) {
        matchesStatus = true;
      }
      
      checks.push({ active: true, passes: matchesStatus });
    }
    
    // Domain filter
    if (filterConfig.domains && filterConfig.domains.length > 0) {
      const apiDomain = extractDomain(api.url);
      const matchesDomain = filterConfig.domains.includes(apiDomain);
      checks.push({ active: true, passes: matchesDomain });
    }
    
    // Response time filter
    if (filterConfig.responseTimeRange?.enabled) {
      const responseTime = api.response?.responseTime;
      const matchesResponseTime = 
        responseTime !== undefined &&
        responseTime >= filterConfig.responseTimeRange.min &&
        responseTime <= filterConfig.responseTimeRange.max;
      checks.push({ active: true, passes: matchesResponseTime });
    }
    
    // Response size filter
    if (filterConfig.responseSizeRange?.enabled) {
      const responseSize = parseResponseSize(api.response?.size);
      const matchesResponseSize = 
        responseSize >= filterConfig.responseSizeRange.min &&
        responseSize <= filterConfig.responseSizeRange.max;
      checks.push({ active: true, passes: matchesResponseSize });
    }
    
    // Date/time range filter
    if (filterConfig.dateTimeRange?.enabled && filterConfig.dateTimeRange.start && filterConfig.dateTimeRange.end) {
      const apiTimestamp = new Date(api.timestamp);
      const startDate = new Date(filterConfig.dateTimeRange.start);
      const endDate = new Date(filterConfig.dateTimeRange.end);
      
      const matchesDateTime = 
        apiTimestamp >= startDate && apiTimestamp <= endDate;
      checks.push({ active: true, passes: matchesDateTime });
    }
    
    // Apply operator logic
    const activeChecks = checks.filter(c => c.active);
    
    if (activeChecks.length === 0) {
      return true; // No filters active, show all
    }
    
    if (operator === 'OR') {
      return activeChecks.some(c => c.passes);
    } else {
      // AND operator (default)
      return activeChecks.every(c => c.passes);
    }
  });
};

// LocalStorage Functions
const STORAGE_PREFIX = 'api-parser-filter-';

export const saveFilterConfig = (name, config) => {
  try {
    const key = `${STORAGE_PREFIX}${name}`;
    localStorage.setItem(key, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving filter configuration:', error);
    return false;
  }
};

export const loadFilterConfig = (name) => {
  try {
    const key = `${STORAGE_PREFIX}${name}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading filter configuration:', error);
    return null;
  }
};

export const getSavedFilterNames = () => {
  try {
    const names = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        names.push(key.substring(STORAGE_PREFIX.length));
      }
    }
    return names.sort();
  } catch (error) {
    console.error('Error getting saved filter names:', error);
    return [];
  }
};

export const deleteFilterConfig = (name) => {
  try {
    const key = `${STORAGE_PREFIX}${name}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error deleting filter configuration:', error);
    return false;
  }
};
