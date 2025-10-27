/**
 * Utility module for parsing rate limit headers from various API formats
 */

/**
 * Helper function to normalize header keys (case-insensitive lookup)
 */
const normalizeHeaderKey = (headers, possibleKeys) => {
  for (const key of possibleKeys) {
    const lowerKey = key.toLowerCase();
    if (headers[lowerKey] !== undefined) {
      return headers[lowerKey];
    }
  }
  return null;
};

/**
 * Parse reset time from various formats (epoch seconds or HTTP-date)
 */
const parseResetTime = (resetValue) => {
  if (!resetValue) return null;
  
  // Try parsing as number (epoch seconds)
  const numValue = Number(resetValue);
  if (!isNaN(numValue)) {
    // Assume seconds if < 10000000000, otherwise milliseconds
    return numValue < 10000000000 ? numValue : Math.floor(numValue / 1000);
  }
  
  // Try parsing as HTTP-date string
  const dateValue = new Date(resetValue);
  if (!isNaN(dateValue.getTime())) {
    return Math.floor(dateValue.getTime() / 1000);
  }
  
  return null;
};

/**
 * Parse Retry-After header (delay-seconds or HTTP-date)
 */
const parseRetryAfter = (value) => {
  if (!value) return null;
  
  // Try parsing as number (delay-seconds)
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    return numValue;
  }
  
  // Try parsing as HTTP-date
  const dateValue = new Date(value);
  if (!isNaN(dateValue.getTime())) {
    const now = Date.now();
    const diffSeconds = Math.floor((dateValue.getTime() - now) / 1000);
    return Math.max(0, diffSeconds);
  }
  
  return null;
};

/**
 * Calculate human-readable time until reset
 */
export const calculateTimeUntilReset = (resetValue) => {
  if (!resetValue) return null;
  
  let resetTime;
  if (typeof resetValue === 'number') {
    // Assume seconds if < 10000000000, otherwise milliseconds
    resetTime = resetValue < 10000000000 ? resetValue * 1000 : resetValue;
  } else if (resetValue instanceof Date) {
    resetTime = resetValue.getTime();
  } else {
    return null;
  }
  
  const now = Date.now();
  const diffMs = resetTime - now;
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 0) {
    return { seconds: 0, formatted: 'expired', isPast: true };
  }
  
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  
  let formatted = '';
  if (hours > 0) {
    formatted = `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) formatted += ` ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    formatted = `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    formatted = `in ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  return { seconds: diffSeconds, formatted, isPast: false };
};

/**
 * Parse rate limit headers from various API formats
 * @param {Object} headers - Response headers object (lowercase keys)
 * @returns {Object|null} Rate limit information or null if not found
 */
export const parseRateLimitHeaders = (headers) => {
  if (!headers || typeof headers !== 'object') {
    return null;
  }
  
  let limit = null;
  let remaining = null;
  let reset = null;
  let retryAfter = null;
  let policy = null;
  let limitType = 'unknown';
  
  // 1. Try legacy X-RateLimit-* headers (most common)
  const xRateLimitLimit = normalizeHeaderKey(headers, [
    'x-ratelimit-limit',
    'x-rate-limit-limit'
  ]);
  const xRateLimitRemaining = normalizeHeaderKey(headers, [
    'x-ratelimit-remaining',
    'x-rate-limit-remaining'
  ]);
  const xRateLimitReset = normalizeHeaderKey(headers, [
    'x-ratelimit-reset',
    'x-rate-limit-reset'
  ]);
  
  if (xRateLimitLimit || xRateLimitRemaining) {
    limit = xRateLimitLimit ? parseInt(xRateLimitLimit, 10) : null;
    remaining = xRateLimitRemaining ? parseInt(xRateLimitRemaining, 10) : null;
    reset = parseResetTime(xRateLimitReset);
    limitType = 'x-ratelimit';
  }
  
  // 2. Try IETF RateLimit header (emerging standard)
  const rateLimitHeader = normalizeHeaderKey(headers, ['ratelimit']);
  if (rateLimitHeader && !limit) {
    // Parse format: "limit=100, remaining=20, reset=30"
    const parts = rateLimitHeader.split(/[,;]/).map(p => p.trim());
    for (const part of parts) {
      const [key, value] = part.split('=').map(s => s.trim());
      if (key === 'limit') limit = parseInt(value, 10);
      if (key === 'remaining') remaining = parseInt(value, 10);
      if (key === 'reset') reset = parseInt(value, 10);
    }
    if (limit || remaining) {
      limitType = 'ratelimit';
    }
  }
  
  // 3. Try RateLimit-Policy header
  const rateLimitPolicy = normalizeHeaderKey(headers, ['ratelimit-policy']);
  if (rateLimitPolicy) {
    policy = rateLimitPolicy;
    // Parse format: "100;w=60" (100 requests per 60 seconds)
    const match = rateLimitPolicy.match(/(\d+);w=(\d+)/);
    if (match) {
      policy = `${match[1]} requests per ${match[2]} seconds`;
    }
  }
  
  // 4. Try Retry-After header (RFC 9110 standard)
  const retryAfterHeader = normalizeHeaderKey(headers, ['retry-after']);
  if (retryAfterHeader) {
    retryAfter = parseRetryAfter(retryAfterHeader);
    if (!limit && !remaining && retryAfter !== null) {
      limitType = 'retry-after';
    }
  }
  
  // Return null if no rate limit headers found
  if (limit === null && remaining === null && retryAfter === null) {
    return null;
  }
  
  // Calculate percentage and warning status
  let percentage = null;
  let isApproachingLimit = false;
  if (limit !== null && remaining !== null && limit > 0) {
    percentage = Math.round((remaining / limit) * 100);
    isApproachingLimit = percentage < 20;
  }
  
  // Format reset time
  let resetFormatted = null;
  if (reset !== null) {
    try {
      resetFormatted = new Date(reset * 1000).toLocaleString();
    } catch (e) {
      resetFormatted = 'Invalid date';
    }
  }
  
  // Calculate time until reset
  const timeUntilReset = calculateTimeUntilReset(reset);
  
  return {
    limit,
    remaining,
    reset,
    resetFormatted,
    retryAfter,
    policy,
    percentage,
    isApproachingLimit,
    limitType,
    timeUntilReset
  };
};
