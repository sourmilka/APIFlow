/**
 * Centralized error handling utility
 * Provides error categorization, formatting, and retry strategy determination
 */

// Error type constants
export const ERROR_TYPES = {
  CORS: 'cors',
  DNS: 'dns',
  TIMEOUT: 'timeout',
  CONNECTION: 'connection',
  SSL: 'ssl',
  NETWORK: 'network',
  SERVER: 'server',
  CLIENT: 'client',
  REDIRECT: 'redirect',
  PROXY: 'proxy',
  PAGE_ERROR: 'page_error',
  DNS_BLOCKED: 'dns_blocked',
  UNKNOWN: 'unknown'
};

// Error patterns for detection
const ERROR_PATTERNS = {
  [ERROR_TYPES.CORS]: [
    'CORS',
    'Cross-Origin',
    'blocked by CORS policy',
    'No \'Access-Control-Allow-Origin\'',
    'CORS header',
    'cross-origin'
  ],
  [ERROR_TYPES.SSL]: [
    'SSL',
    'certificate',
    'ERR_CERT',
    'HTTPS',
    'TLS',
    'ERR_SSL',
    'NET::ERR_CERT',
    'certificate verify failed'
  ],
  [ERROR_TYPES.DNS]: [
    'ERR_NAME_NOT_RESOLVED',
    'ENOTFOUND',
    'DNS',
    'getaddrinfo',
    'name resolution failed'
  ],
  [ERROR_TYPES.CONNECTION]: [
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_CLOSED',
    'ECONNREFUSED',
    'ECONNRESET',
    'connection refused',
    'connection reset'
  ],
  [ERROR_TYPES.TIMEOUT]: [
    'timeout',
    'ERR_TIMED_OUT',
    'ETIMEDOUT',
    'Navigation timeout',
    'exceeded',
    'timed out'
  ],
  [ERROR_TYPES.NETWORK]: [
    'ERR_NETWORK_CHANGED',
    'ERR_INTERNET_DISCONNECTED',
    'network error',
    'Network request failed',
    'Failed to fetch'
  ],
  [ERROR_TYPES.PROXY]: [
    'ERR_PROXY_CONNECTION_FAILED',
    'proxy',
    'ERR_TUNNEL_CONNECTION_FAILED'
  ],
  [ERROR_TYPES.REDIRECT]: [
    'ERR_TOO_MANY_REDIRECTS',
    'too many redirects',
    'redirect loop'
  ],
  [ERROR_TYPES.PAGE_ERROR]: [
    'require is not defined',
    'ReferenceError',
    'SyntaxError',
    'page error',
    'script error',
    'Uncaught',
    'is not defined'
  ],
  [ERROR_TYPES.DNS_BLOCKED]: [
    'blocked',
    'censored',
    'filtered',
    'NXDOMAIN',
    'dns block'
  ]
};

// User-friendly messages and suggestions for each error type
const ERROR_MESSAGES = {
  [ERROR_TYPES.CORS]: {
    title: 'CORS Error',
    message: 'The website is blocking cross-origin requests',
    suggestions: [
      'The target website needs to enable CORS headers',
      'Try using a CORS proxy service',
      'Check the browser console for specific CORS errors',
      'Contact the website administrator to enable CORS'
    ],
    retryable: false
  },
  [ERROR_TYPES.DNS]: {
    title: 'DNS Resolution Failed',
    message: 'Unable to resolve the website address',
    suggestions: [
      'Verify the URL is correct and properly formatted',
      'Check if the website is currently online',
      'Try accessing the website directly in your browser',
      'Check your DNS settings or try a different DNS server'
    ],
    retryable: true
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The website took too long to respond',
    suggestions: [
      'The website may be slow or experiencing high traffic',
      'Try again in a few moments',
      'Check your internet connection speed',
      'The website server might be overloaded'
    ],
    retryable: true
  },
  [ERROR_TYPES.CONNECTION]: {
    title: 'Connection Failed',
    message: 'Unable to establish connection to the website',
    suggestions: [
      'Check your internet connection',
      'Verify the website is online and accessible',
      'The website server might be down',
      'Check if a firewall is blocking the connection'
    ],
    retryable: true
  },
  [ERROR_TYPES.SSL]: {
    title: 'SSL/TLS Error',
    message: 'Secure connection could not be established',
    suggestions: [
      'The website\'s SSL certificate may be invalid or expired',
      'Try accessing the website directly to see the certificate error',
      'The website may have security configuration issues',
      'Contact the website administrator'
    ],
    retryable: false
  },
  [ERROR_TYPES.NETWORK]: {
    title: 'Network Error',
    message: 'A network error occurred',
    suggestions: [
      'Check your internet connection',
      'Try disabling VPN or proxy if you\'re using one',
      'Check if your network settings have changed',
      'Try again in a few moments'
    ],
    retryable: true
  },
  [ERROR_TYPES.PROXY]: {
    title: 'Proxy Error',
    message: 'Proxy connection failed',
    suggestions: [
      'Check your proxy settings',
      'Verify the proxy server is online',
      'Try disabling the proxy temporarily',
      'Contact your network administrator'
    ],
    retryable: true
  },
  [ERROR_TYPES.REDIRECT]: {
    title: 'Too Many Redirects',
    message: 'The website has too many redirects',
    suggestions: [
      'The website may have a redirect loop',
      'Clear your browser cookies and cache',
      'Try accessing the website directly',
      'Contact the website administrator'
    ],
    retryable: false
  },
  [ERROR_TYPES.SERVER]: {
    title: 'Server Error',
    message: 'The website server encountered an error',
    suggestions: [
      'The website may be experiencing technical difficulties',
      'Try again in a few moments',
      'Check if the website is reporting any outages',
      'Contact the website administrator'
    ],
    retryable: true
  },
  [ERROR_TYPES.CLIENT]: {
    title: 'Client Error',
    message: 'Invalid request',
    suggestions: [
      'Verify the URL is correct',
      'Check if the page exists',
      'Try accessing the website directly',
      'The requested resource may not be available'
    ],
    retryable: false
  },
  [ERROR_TYPES.PAGE_ERROR]: {
    title: 'Target Website Has Errors',
    message: 'The website has JavaScript errors, but we may have captured some APIs',
    suggestions: [
      'Check the API list - we captured what we could',
      'The website may use incompatible code (CommonJS in browser)',
      'Try a different page from the same website',
      'APIs were likely still captured despite the error'
    ],
    retryable: false
  },
  [ERROR_TYPES.DNS_BLOCKED]: {
    title: 'Website May Be Blocked',
    message: 'Unable to resolve domain - it may be blocked by your DNS or network',
    suggestions: [
      'Try using a different DNS server (Google DNS: 8.8.8.8)',
      'The website might be blocked in your region',
      'Try accessing via VPN',
      'Check if you can access the website in your browser'
    ],
    retryable: true
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred',
    suggestions: [
      'Try again in a few moments',
      'Check your internet connection',
      'Verify the URL is correct',
      'Contact support if the problem persists'
    ],
    retryable: true
  }
};

/**
 * Categorize an error based on its message and properties
 * @param {Error|Object} error - The error to categorize
 * @returns {string} The error type
 */
export function categorizeError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const errorString = JSON.stringify({
    message: error.message || '',
    code: error.code || '',
    name: error.name || '',
    stack: error.stack || ''
  }).toLowerCase();

  // Check each error pattern
  for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some(pattern => errorString.includes(pattern.toLowerCase()))) {
      return type;
    }
  }

  // Check HTTP status codes if available
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    if (status >= 500) return ERROR_TYPES.SERVER;
    if (status >= 400) return ERROR_TYPES.CLIENT;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Get retry strategy for an error type
 * @param {string} errorType - The error type
 * @returns {Object} Retry strategy with retryable flag and configuration
 */
export function getRetryStrategy(errorType) {
  const errorConfig = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  
  return {
    retryable: errorConfig.retryable,
    maxRetries: errorConfig.retryable ? 3 : 0,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };
}

/**
 * Format an error for display to the user
 * @param {Error|Object} error - The error to format
 * @param {string} [customMessage] - Optional custom message
 * @returns {Object} Formatted error object
 */
export function formatErrorForDisplay(error, customMessage) {
  const errorType = categorizeError(error);
  const errorConfig = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  const retryStrategy = getRetryStrategy(errorType);

  return {
    type: errorType,
    title: errorConfig.title,
    message: customMessage || errorConfig.message,
    suggestions: errorConfig.suggestions,
    retryable: retryStrategy.retryable,
    originalError: {
      message: error.message || 'Unknown error',
      code: error.code,
      name: error.name,
      stack: error.stack
    }
  };
}

/**
 * Check if an error is a CORS error
 * @param {Error|Object} error - The error to check
 * @returns {boolean} True if it's a CORS error
 */
export function isCorsError(error) {
  return categorizeError(error) === ERROR_TYPES.CORS;
}

/**
 * Check if an error is retryable
 * @param {Error|Object} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
export function isRetryableError(error) {
  const errorType = categorizeError(error);
  const strategy = getRetryStrategy(errorType);
  return strategy.retryable;
}

/**
 * Get CORS-specific guidance
 * @returns {Object} CORS guidance information
 */
export function getCorsGuidance() {
  return {
    explanation: 'CORS (Cross-Origin Resource Sharing) is a security feature that restricts web pages from making requests to a different domain than the one serving the page.',
    commonSolutions: [
      'Enable CORS on the target server by adding appropriate Access-Control-Allow-Origin headers',
      'Use a CORS proxy service to bypass CORS restrictions',
      'Check the browser console for detailed CORS error messages',
      'If you control the server, configure it to allow cross-origin requests'
    ],
    documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'
  };
}
