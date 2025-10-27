/**
 * Helper utilities for API parsing
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
  if (lowerUrl.includes('/user') || lowerUrl.includes('/profile')) {
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
  if (lowerUrl.includes('/payment') || lowerUrl.includes('/checkout')) {
    explanations.push('💳 Payment endpoint - handles financial transactions');
  }
  if (lowerUrl.includes('/search')) {
    explanations.push('🔍 Search endpoint - performs data queries');
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
  if (method === 'GET' && !explanations.length) {
    explanations.push('📊 GET request - retrieving data from server');
  }
  
  if (headers['content-type']?.includes('application/json')) {
    explanations.push('📋 JSON data format - structured data exchange');
  }
  
  return explanations.length > 0 ? explanations : ['🌐 Standard API request'];
};

export const parseRateLimitHeaders = (headers) => {
  const rateLimit = {};
  
  // Common rate limit headers
  const limit = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit'];
  const remaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'];
  const reset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'];
  
  if (limit || remaining || reset) {
    rateLimit.limit = limit ? parseInt(limit) : null;
    rateLimit.remaining = remaining ? parseInt(remaining) : null;
    rateLimit.reset = reset ? parseInt(reset) : null;
    rateLimit.isApproachingLimit = rateLimit.remaining !== null && rateLimit.limit !== null && 
      (rateLimit.remaining / rateLimit.limit) < 0.2;
  }
  
  return Object.keys(rateLimit).length > 0 ? rateLimit : null;
};
