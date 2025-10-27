/**
 * Retry handler utility with exponential backoff
 * Implements retry logic for transient failures
 */

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attemptNumber - Current attempt number (0-indexed)
 * @param {number} initialDelay - Initial delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @param {number} backoffMultiplier - Multiplier for exponential backoff
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attemptNumber, initialDelay, maxDelay, backoffMultiplier) {
  // Calculate exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attemptNumber);
  
  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Add jitter (randomness) to prevent thundering herd
  // Jitter is between 0% and 25% of the delay
  const jitter = cappedDelay * 0.25 * Math.random();
  
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<void>}
 */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timeout = setTimeout(resolve, ms);
    
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      });
    }
  });
}

/**
 * Default retry condition - checks if error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} True if should retry
 */
function defaultShouldRetry(error) {
  // Import here to avoid circular dependency
  const { isRetryableError } = require('./errorHandler');
  return isRetryableError(error);
}

/**
 * Retry an async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.initialDelay=1000] - Initial delay in milliseconds
 * @param {number} [options.maxDelay=10000] - Maximum delay in milliseconds
 * @param {number} [options.backoffMultiplier=2] - Multiplier for exponential backoff
 * @param {Function} [options.shouldRetry] - Function to determine if should retry
 * @param {Function} [options.onRetry] - Callback called before each retry
 * @param {AbortSignal} [options.signal] - Abort signal to cancel retries
 * @returns {Promise<any>} Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
    onRetry = null,
    signal = null
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if aborted before attempting
      if (signal?.aborted) {
        throw new Error('Retry aborted');
      }

      // Execute the function
      const result = await fn();
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Check if we should abort
      if (signal?.aborted) {
        throw new Error('Retry aborted');
      }
      
      // If this was the last attempt, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateBackoffDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffMultiplier
      );
      
      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry({
          attempt: attempt + 1,
          maxRetries,
          delay,
          error
        });
      }
      
      // Wait before retrying
      await sleep(delay, signal);
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Retry with custom retry condition
 * @param {Function} fn - Async function to retry
 * @param {Function} shouldRetry - Custom retry condition
 * @param {Object} options - Additional retry options
 * @returns {Promise<any>} Result of the function
 */
export async function retryIf(fn, shouldRetry, options = {}) {
  return retryWithBackoff(fn, {
    ...options,
    shouldRetry
  });
}

/**
 * Retry only on specific error types
 * @param {Function} fn - Async function to retry
 * @param {string[]} errorTypes - Array of error types to retry on
 * @param {Object} options - Additional retry options
 * @returns {Promise<any>} Result of the function
 */
export async function retryOnErrorTypes(fn, errorTypes, options = {}) {
  const { categorizeError } = require('./errorHandler');
  
  return retryWithBackoff(fn, {
    ...options,
    shouldRetry: (error) => {
      const errorType = categorizeError(error);
      return errorTypes.includes(errorType);
    }
  });
}

/**
 * Retry only on network-related errors
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Additional retry options
 * @returns {Promise<any>} Result of the function
 */
export async function retryOnNetworkError(fn, options = {}) {
  return retryOnErrorTypes(fn, ['timeout', 'network', 'dns', 'connection'], options);
}

/**
 * Create a retry wrapper for a function
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Retry options
 * @returns {Function} Wrapped function with retry logic
 */
export function withRetry(fn, options = {}) {
  return async (...args) => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Get retry info for display
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum retries
 * @param {number} delay - Delay until next retry
 * @returns {Object} Retry info
 */
export function getRetryInfo(attempt, maxRetries, delay) {
  return {
    attempt,
    maxRetries,
    delay,
    delaySeconds: Math.ceil(delay / 1000),
    isLastAttempt: attempt >= maxRetries,
    attemptsRemaining: maxRetries - attempt
  };
}

export default retryWithBackoff;
