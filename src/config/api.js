/**
 * API Configuration - Environment-aware endpoint
 */

// Determine the API base URL based on environment
export const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // In production (Vercel), use relative URLs to hit the same domain's /api routes
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  PARSE: `${API_BASE_URL}/api/parse`,
  SESSION: (sessionId) => `${API_BASE_URL}/api/session/${sessionId}`,
  CANCEL: (sessionId) => `${API_BASE_URL}/api/cancel/${sessionId}`,
  DNS_CHECK: `${API_BASE_URL}/api/dns/check`,
  PARSING_PROFILES: `${API_BASE_URL}/api/parsing/profiles`,
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_ENDPOINTS;
