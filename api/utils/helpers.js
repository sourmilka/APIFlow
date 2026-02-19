/**
 * Helper utilities for API parsing — v4.0
 */

export const detectAuthentication = (headers) => {
  const authTypes = [];
  
  if (headers['authorization']) {
    if (headers['authorization'].startsWith('Bearer ')) {
      authTypes.push({ type: 'Bearer Token', value: headers['authorization'].substring(0, 20) + '...' });
    } else if (headers['authorization'].startsWith('Basic ')) {
      authTypes.push({ type: 'Basic Auth', value: 'Hidden' });
    } else {
      authTypes.push({ type: 'Custom Auth', value: headers['authorization'].substring(0, 20) + '...' });
    }
  }
  
  if (headers['x-api-key']) {
    authTypes.push({ type: 'API Key', header: 'x-api-key', value: headers['x-api-key'].substring(0, 15) + '...' });
  }
  
  if (headers['x-auth-token']) {
    authTypes.push({ type: 'Auth Token', header: 'x-auth-token', value: headers['x-auth-token'].substring(0, 15) + '...' });
  }
  
  if (headers['cookie']) {
    authTypes.push({ type: 'Cookies', value: 'Session cookies present' });
  }

  if (headers['x-csrf-token'] || headers['x-xsrf-token']) {
    authTypes.push({ type: 'CSRF Token', value: 'CSRF protection active' });
  }
  
  return authTypes.length > 0 ? authTypes : null;
};

export const parseGraphQL = (payload) => {
  if (!payload) return null;
  
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    
    if (parsed.query) {
      const query = parsed.query;
      const operationMatch = query.match(/(query|mutation|subscription)\s+(\w+)/);
      const operationType = operationMatch ? operationMatch[1] : 'query';
      const operationName = operationMatch ? operationMatch[2] : 'Anonymous';
      
      const fieldsMatch = query.match(/\{([^}]+)\}/);
      const fields = fieldsMatch ? fieldsMatch[1].trim().split('\n').map(f => f.trim()).filter(Boolean) : [];
      
      return {
        type: 'graphql',
        operationType,
        operationName,
        query: query.trim(),
        variables: parsed.variables || null,
        fields: fields.slice(0, 10)
      };
    }
  } catch (e) {
    return null;
  }
  
  return null;
};

export const explainAPI = (url, method, headers, payload) => {
  const explanations = [];
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('/auth') || lowerUrl.includes('/login') || lowerUrl.includes('/signin')) {
    explanations.push('🔐 Authentication endpoint - handles user login/authentication');
  }
  if (lowerUrl.includes('/register') || lowerUrl.includes('/signup')) {
    explanations.push('📝 Registration endpoint - creates new user accounts');
  }
  if (lowerUrl.includes('/user') || lowerUrl.includes('/profile') || lowerUrl.includes('/account')) {
    explanations.push('👤 User data endpoint - manages user information');
  }
  if (lowerUrl.includes('/token') || lowerUrl.includes('/refresh')) {
    explanations.push('🔑 Token endpoint - generates or refreshes authentication tokens');
  }
  if (lowerUrl.includes('/api/v') || lowerUrl.match(/\/v\d+\//)) {
    explanations.push('📌 Versioned API - using specific API version');
  }
  if (lowerUrl.includes('/graphql')) {
    explanations.push('🔷 GraphQL endpoint - flexible query language for APIs');
  }
  if (lowerUrl.includes('/payment') || lowerUrl.includes('/checkout') || lowerUrl.includes('/billing')) {
    explanations.push('💳 Payment endpoint - handles financial transactions');
  }
  if (lowerUrl.includes('/search') || lowerUrl.includes('/query') || lowerUrl.includes('/find')) {
    explanations.push('🔍 Search endpoint - performs data queries');
  }
  if (lowerUrl.includes('/upload') || lowerUrl.includes('/file') || lowerUrl.includes('/media')) {
    explanations.push('📁 File endpoint - handles file uploads or media');
  }
  if (lowerUrl.includes('/notification') || lowerUrl.includes('/alert') || lowerUrl.includes('/push')) {
    explanations.push('🔔 Notification endpoint - manages alerts and notifications');
  }
  if (lowerUrl.includes('/analytics') || lowerUrl.includes('/track') || lowerUrl.includes('/event')) {
    explanations.push('📈 Analytics endpoint - tracks user events and metrics');
  }
  if (lowerUrl.includes('/config') || lowerUrl.includes('/settings') || lowerUrl.includes('/preferences')) {
    explanations.push('⚙️ Config endpoint - manages application settings');
  }
  if (lowerUrl.includes('/webhook') || lowerUrl.includes('/hook') || lowerUrl.includes('/callback')) {
    explanations.push('🪝 Webhook endpoint - handles external callbacks');
  }
  if (lowerUrl.includes('/ws') || lowerUrl.includes('/socket') || lowerUrl.includes('/realtime')) {
    explanations.push('🔌 Realtime endpoint - WebSocket or realtime communication');
  }
  if (lowerUrl.includes('/health') || lowerUrl.includes('/status') || lowerUrl.includes('/ping')) {
    explanations.push('💚 Health check endpoint - monitors service status');
  }
  if (lowerUrl.includes('/batch') || lowerUrl.includes('/bulk')) {
    explanations.push('📦 Batch endpoint - processes multiple items at once');
  }
  if (lowerUrl.includes('/export') || lowerUrl.includes('/download') || lowerUrl.includes('/report')) {
    explanations.push('📥 Export endpoint - generates downloadable content');
  }
  
  if (method === 'POST' && !explanations.length) {
    explanations.push('➕ POST request - creating or submitting new data');
  }
  if (method === 'PUT') {
    explanations.push('✏️ PUT request - updating existing resource');
  }
  if (method === 'DELETE') {
    explanations.push('🗑️ DELETE request - removing a resource');
  }
  if (method === 'PATCH') {
    explanations.push('🔧 PATCH request - partially updating a resource');
  }
  if (method === 'GET' && !explanations.length) {
    explanations.push('📊 GET request - retrieving data from server');
  }
  
  if (headers['content-type']?.includes('application/json')) {
    explanations.push('📋 JSON data format - structured data exchange');
  }
  if (headers['content-type']?.includes('multipart/form-data')) {
    explanations.push('📎 Multipart form data - file upload or form submission');
  }
  if (headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    explanations.push('📝 URL-encoded form data - traditional form submission');
  }
  
  return explanations.length > 0 ? explanations : ['🌐 Standard API request'];
};

export const parseRateLimitHeaders = (headers) => {
  const rateLimit = {};
  
  const limit = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit'] || headers['ratelimit-limit'];
  const remaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'] || headers['ratelimit-remaining'];
  const reset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'] || headers['ratelimit-reset'];
  const retryAfter = headers['retry-after'];
  
  if (limit || remaining || reset || retryAfter) {
    rateLimit.limit = limit ? parseInt(limit) : null;
    rateLimit.remaining = remaining ? parseInt(remaining) : null;
    rateLimit.reset = reset ? parseInt(reset) : null;
    rateLimit.retryAfter = retryAfter ? parseInt(retryAfter) : null;
    rateLimit.isApproachingLimit = rateLimit.remaining !== null && rateLimit.limit !== null && 
      (rateLimit.remaining / rateLimit.limit) < 0.2;
  }
  
  return Object.keys(rateLimit).length > 0 ? rateLimit : null;
};

/**
 * Detect API version from URL
 */
export const detectApiVersion = (url) => {
  const match = url.match(/\/v(\d+(?:\.\d+)?)\//);
  return match ? `v${match[1]}` : null;
};

/**
 * Categorize endpoint by URL patterns
 */
export const categorizeEndpoint = (url, method) => {
  const path = url.toLowerCase();
  if (path.includes('/auth') || path.includes('/login') || path.includes('/token')) return 'Authentication';
  if (path.includes('/user') || path.includes('/profile') || path.includes('/account')) return 'User Management';
  if (path.includes('/payment') || path.includes('/billing') || path.includes('/checkout') || path.includes('/stripe')) return 'Payments';
  if (path.includes('/search') || path.includes('/query')) return 'Search';
  if (path.includes('/upload') || path.includes('/file') || path.includes('/media') || path.includes('/image')) return 'Media';
  if (path.includes('/notification') || path.includes('/email') || path.includes('/sms')) return 'Notifications';
  if (path.includes('/analytics') || path.includes('/track') || path.includes('/event') || path.includes('/log')) return 'Analytics';
  if (path.includes('/config') || path.includes('/setting') || path.includes('/preference')) return 'Configuration';
  if (path.includes('/graphql')) return 'GraphQL';
  if (path.includes('/health') || path.includes('/status') || path.includes('/ping')) return 'Health Check';
  if (path.includes('/webhook') || path.includes('/hook')) return 'Webhooks';
  if (path.includes('/admin') || path.includes('/manage')) return 'Admin';
  if (path.includes('/api')) return 'API';
  return 'General';
};

/**
 * Build analytics summary from scan results
 */
export const buildAnalytics = (apiCalls, webSockets, sseConnections) => {
  const methodDistribution = {};
  const statusDistribution = {};
  const contentTypeDistribution = {};
  const categoryDistribution = {};
  const hostDistribution = {};
  let totalResponseTime = 0;
  let responseTimeCount = 0;
  let authenticatedCount = 0;
  let graphqlCount = 0;
  let totalSize = 0;
  let sizeCount = 0;

  apiCalls.forEach(api => {
    // Method distribution
    methodDistribution[api.method] = (methodDistribution[api.method] || 0) + 1;

    // Status distribution
    if (api.response?.status) {
      const statusGroup = `${Math.floor(api.response.status / 100)}xx`;
      statusDistribution[statusGroup] = (statusDistribution[statusGroup] || 0) + 1;
    }

    // Content type distribution
    const ct = api.response?.contentType || api.contentType || 'unknown';
    const simpleCt = ct.split(';')[0].trim();
    contentTypeDistribution[simpleCt] = (contentTypeDistribution[simpleCt] || 0) + 1;

    // Category distribution
    if (api.category) {
      categoryDistribution[api.category] = (categoryDistribution[api.category] || 0) + 1;
    }

    // Host distribution
    if (api.hostname) {
      hostDistribution[api.hostname] = (hostDistribution[api.hostname] || 0) + 1;
    }

    // Response time
    if (api.response?.responseTime) {
      totalResponseTime += api.response.responseTime;
      responseTimeCount++;
    }

    // Size
    if (api.response?.size && api.response.size !== 'unknown') {
      totalSize += parseInt(api.response.size) || 0;
      sizeCount++;
    }

    if (api.authentication) authenticatedCount++;
    if (api.graphql) graphqlCount++;
  });

  // Sort APIs by response time (slowest first) for performance analysis
  const slowestApis = [...apiCalls]
    .filter(a => a.response?.responseTime)
    .sort((a, b) => b.response.responseTime - a.response.responseTime)
    .slice(0, 5)
    .map(a => ({ url: a.url, method: a.method, responseTime: a.response.responseTime }));

  return {
    totalApis: apiCalls.length,
    totalWebSockets: webSockets.length,
    totalSSE: sseConnections.length,
    methodDistribution,
    statusDistribution,
    contentTypeDistribution,
    categoryDistribution,
    hostDistribution,
    authenticatedCount,
    graphqlCount,
    avgResponseTime: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
    totalSize,
    slowestApis
  };
};
