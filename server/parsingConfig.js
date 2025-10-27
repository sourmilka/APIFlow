/**
 * Professional Parsing Configuration Profiles
 */

export const PARSING_PROFILES = {
  // Default profile - balanced performance and reliability
  default: {
    timeout: 30000,
    waitUntil: 'networkidle2',
    retryOnError: true,
    maxRetries: 3,
    captureScreenshot: false,
    bypassCSP: true,
    blockResources: ['image', 'stylesheet', 'font', 'media'],
    stealth: true,
    headless: true
  },

  // Fast profile - quick parsing, minimal waiting
  fast: {
    timeout: 15000,
    waitUntil: 'domcontentloaded',
    retryOnError: false,
    maxRetries: 1,
    captureScreenshot: false,
    bypassCSP: true,
    blockResources: ['image', 'stylesheet', 'font', 'media'],
    stealth: false,
    headless: true
  },

  // Complete profile - capture everything, slower but thorough
  complete: {
    timeout: 60000,
    waitUntil: 'networkidle0',
    retryOnError: true,
    maxRetries: 5,
    captureScreenshot: true,
    bypassCSP: true,
    blockResources: [],
    stealth: true,
    headless: true
  },

  // Stealth profile - maximum evasion for difficult sites
  stealth: {
    timeout: 45000,
    waitUntil: 'networkidle2',
    retryOnError: true,
    maxRetries: 3,
    captureScreenshot: false,
    bypassCSP: true,
    blockResources: ['image', 'font'],
    stealth: true,
    headless: true,
    randomDelay: true,
    rotateUserAgent: true
  },

  // Debug profile - visible browser, all resources
  debug: {
    timeout: 60000,
    waitUntil: 'networkidle2',
    retryOnError: false,
    maxRetries: 1,
    captureScreenshot: true,
    bypassCSP: false,
    blockResources: [],
    stealth: false,
    headless: false
  },

  // SPA (Single Page Application) profile
  spa: {
    timeout: 45000,
    waitUntil: 'networkidle0',
    retryOnError: true,
    maxRetries: 3,
    captureScreenshot: false,
    bypassCSP: true,
    blockResources: ['image', 'font'],
    stealth: true,
    headless: true,
    waitForSelector: null, // Override per site
    additionalWaitTime: 3000
  },

  // API-heavy sites profile
  apiHeavy: {
    timeout: 40000,
    waitUntil: 'networkidle2',
    retryOnError: true,
    maxRetries: 3,
    captureScreenshot: false,
    bypassCSP: true,
    blockResources: ['image', 'stylesheet', 'font', 'media'],
    stealth: true,
    headless: true,
    captureAllRequests: true
  },

  // Geo-restricted sites profile (use with proxy)
  geoRestricted: {
    timeout: 45000,
    waitUntil: 'networkidle2',
    retryOnError: true,
    maxRetries: 5,
    captureScreenshot: false,
    bypassCSP: true,
    blockResources: ['image', 'font'],
    stealth: true,
    headless: true,
    useProxy: true,
    rotateProxy: true
  }
};

/**
 * Site-specific configurations for known difficult sites
 */
export const SITE_SPECIFIC_CONFIGS = {
  'ge.movie': {
    profile: 'stealth',
    customHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    waitForSelector: 'body',
    additionalWaitTime: 5000,
    executeScripts: [
      // Inject custom scripts if needed
      `console.log('Page loaded successfully');`
    ]
  },
  
  'netflix.com': {
    profile: 'stealth',
    waitForSelector: '.lolomoRow',
    blockResources: ['image', 'media']
  },

  'youtube.com': {
    profile: 'spa',
    waitForSelector: 'ytd-app',
    additionalWaitTime: 2000
  },

  'twitter.com': {
    profile: 'spa',
    waitForSelector: '[data-testid="primaryColumn"]',
    additionalWaitTime: 3000
  },

  'instagram.com': {
    profile: 'stealth',
    waitForSelector: 'article',
    additionalWaitTime: 2000
  }
};

/**
 * Get parsing configuration for a URL
 */
export function getConfigForUrl(url, customProfile = null) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // Check for site-specific config
    for (const [domain, config] of Object.entries(SITE_SPECIFIC_CONFIGS)) {
      if (hostname.includes(domain)) {
        const profile = PARSING_PROFILES[config.profile] || PARSING_PROFILES.default;
        return {
          ...profile,
          ...config,
          detectedSite: domain
        };
      }
    }
    
    // Use custom profile or default
    const profileName = customProfile || 'default';
    return {
      ...PARSING_PROFILES[profileName],
      detectedSite: null
    };
  } catch {
    return PARSING_PROFILES.default;
  }
}

/**
 * Merge custom options with profile
 */
export function mergeParsingOptions(baseConfig, customOptions = {}) {
  return {
    ...baseConfig,
    ...customOptions,
    // Ensure critical options aren't overridden unsafely
    timeout: customOptions.timeout || baseConfig.timeout,
    maxRetries: Math.min(customOptions.maxRetries || baseConfig.maxRetries, 10)
  };
}

export default {
  PARSING_PROFILES,
  SITE_SPECIFIC_CONFIGS,
  getConfigForUrl,
  mergeParsingOptions
};
