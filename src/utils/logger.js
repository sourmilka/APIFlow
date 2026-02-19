/**
 * Frontend Logger — Structured logging with levels, timestamps, and viewer support
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MAX_LOGS = 500;

class Logger {
  constructor() {
    this.logs = [];
    this.level = LOG_LEVELS.debug;
    this.listeners = new Set();
  }

  _emit(level, message, data = null) {
    if (LOG_LEVELS[level] < this.level) return;
    const entry = {
      id: Date.now() + Math.random(),
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      time: performance.now()
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) this.logs = this.logs.slice(-MAX_LOGS);
    
    // Native console output
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(`[APIFlow:${level}] ${message}`, data || '');

    // Notify listeners
    this.listeners.forEach(fn => fn(entry));
    return entry;
  }

  debug(msg, data) { return this._emit('debug', msg, data); }
  info(msg, data) { return this._emit('info', msg, data); }
  warn(msg, data) { return this._emit('warn', msg, data); }
  error(msg, data) { return this._emit('error', msg, data); }

  // Scan lifecycle logging
  scanStart(url) { return this.info(`Scan started: ${url}`, { url }); }
  scanComplete(url, count, duration) { return this.info(`Scan complete: ${count} endpoints in ${duration}ms`, { url, count, duration }); }
  scanError(url, error) { return this.error(`Scan failed: ${error}`, { url, error }); }
  
  // Feature logging
  featureUsed(feature, detail) { return this.debug(`Feature: ${feature}`, detail); }
  exportDone(format) { return this.info(`Exported as ${format}`); }
  cookiesLoaded(count) { return this.info(`Loaded ${count} cookies`); }

  getLogs(filter = null) {
    if (!filter) return [...this.logs];
    return this.logs.filter(l => l.level === filter);
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(fn => fn(null));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setLevel(level) {
    this.level = LOG_LEVELS[level] ?? 0;
  }

  getStats() {
    return {
      total: this.logs.length,
      debug: this.logs.filter(l => l.level === 'debug').length,
      info: this.logs.filter(l => l.level === 'info').length,
      warn: this.logs.filter(l => l.level === 'warn').length,
      error: this.logs.filter(l => l.level === 'error').length,
    };
  }
}

// Singleton instance
export const logger = new Logger();
export default logger;
