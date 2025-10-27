import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { categorizeError, formatErrorForDisplay, getRetryStrategy } from '../src/utils/errorHandler.js';
import { retryWithBackoff } from '../src/utils/retryHandler.js';
import { parseRateLimitHeaders } from '../src/utils/rateLimitParser.js';
import { checkWithDNSFallback, quickDNSCheck, getCurrentDNS, DNS_SERVERS } from './dnsChecker.js';
import { AdvancedParser } from './advancedParser.js';
import { ProxyManager } from './proxyManager.js';
import { PARSING_PROFILES, getConfigForUrl, mergeParsingOptions } from './parsingConfig.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;

// Session Management Configuration
const SESSION_TTL_MS = 3600000; // 1 hour in milliseconds
const MAX_SESSIONS = 100; // Maximum number of sessions to store
const CLEANUP_INTERVAL_MS = 900000; // 15 minutes in milliseconds
const SESSION_SIZE_WARNING_THRESHOLD = 50; // Log warnings when approaching max sessions

// Initialize advanced features
const advancedParser = new AdvancedParser();
const proxyManager = new ProxyManager();

app.use(cors());
app.use(express.json());

// Store for active parsing sessions
const parsingSessions = new Map();

// Helper function to detect authentication
const detectAuthentication = (headers) => {
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

// Helper function to parse GraphQL queries
const parseGraphQL = (payload) => {
  if (!payload) return null;
  
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    
    if (parsed.query) {
      const query = parsed.query;
      const operationMatch = query.match(/(query|mutation|subscription)\s+(\w+)/);
      const operationType = operationMatch ? operationMatch[1] : 'query';
      const operationName = operationMatch ? operationMatch[2] : 'Anonymous';
      
      // Extract fields
      const fieldsMatch = query.match(/\{([^}]+)\}/);
      const fields = fieldsMatch ? fieldsMatch[1].trim().split('\n').map(f => f.trim()).filter(Boolean) : [];
      
      return {
        type: 'graphql',
        operationType,
        operationName,
        query: query.trim(),
        variables: parsed.variables || null,
        fields: fields.slice(0, 10) // Limit to first 10 fields
      };
    }
  } catch (e) {
    return null;
  }
  
  return null;
};

// Helper function to explain API purpose
const explainAPI = (url, method, headers, payload) => {
  const explanations = [];
  const lowerUrl = url.toLowerCase();
  
  // Analyze URL patterns
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
  if (lowerUrl.includes('/webhook')) {
    explanations.push('🔔 Webhook endpoint - receives event notifications');
  }
  if (lowerUrl.includes('/payment') || lowerUrl.includes('/checkout')) {
    explanations.push('💳 Payment endpoint - handles financial transactions');
  }
  if (lowerUrl.includes('/search')) {
    explanations.push('🔍 Search endpoint - performs data queries');
  }
  if (lowerUrl.includes('/upload')) {
    explanations.push('📤 Upload endpoint - handles file uploads');
  }
  if (lowerUrl.includes('/download')) {
    explanations.push('📥 Download endpoint - serves file downloads');
  }
  
  // Analyze by method
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
  
  // Analyze content type
  if (headers['content-type']?.includes('application/json')) {
    explanations.push('📋 JSON data format - structured data exchange');
  }
  if (headers['content-type']?.includes('multipart/form-data')) {
    explanations.push('📎 Form data - likely includes file uploads');
  }
  
  return explanations.length > 0 ? explanations : ['🌐 Standard API request'];
};

// Store for cancellation
const activeParsing = new Map();

// Cleanup function to remove expired sessions
const cleanupExpiredSessions = () => {
  const now = Date.now();
  let removed = 0;
  let oldestSessionAge = 0;
  
  for (const [sessionId, session] of parsingSessions.entries()) {
    const age = now - session.createdAt;
    
    if (age > SESSION_TTL_MS) {
      parsingSessions.delete(sessionId);
      removed++;
    } else {
      // Track oldest remaining session
      if (age > oldestSessionAge) {
        oldestSessionAge = age;
      }
    }
  }
  
  const remaining = parsingSessions.size;
  const oldestAgeMinutes = Math.round(oldestSessionAge / 60000);
  
  if (removed > 0) {
    console.log(`🧹 [${new Date().toISOString()}] Session cleanup: Removed ${removed} expired session(s), ${remaining} remaining, oldest session age: ${oldestAgeMinutes} minutes`);
  }
  
  return {
    removed,
    remaining,
    oldestSessionAge: oldestAgeMinutes
  };
};

// Enforce session size limits with LRU eviction
const enforceSessionSizeLimit = () => {
  if (parsingSessions.size <= MAX_SESSIONS) {
    return { evicted: 0, reason: 'within_limit' };
  }
  
  // Convert to array and sort by lastAccessedAt (LRU)
  const sessions = Array.from(parsingSessions.entries());
  sessions.sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
  
  // Calculate how many to remove
  const toRemove = parsingSessions.size - MAX_SESSIONS;
  let evicted = 0;
  
  console.log(`⚠️  [${new Date().toISOString()}] Session size limit reached (${parsingSessions.size}/${MAX_SESSIONS}), evicting ${toRemove} oldest session(s)`);
  
  for (let i = 0; i < toRemove; i++) {
    const [sessionId, session] = sessions[i];
    const age = Math.round((Date.now() - session.createdAt) / 60000);
    console.log(`   Evicting session ${sessionId}: age=${age}min, accessCount=${session.accessCount}, url=${session.url}`);
    parsingSessions.delete(sessionId);
    evicted++;
  }
  
  console.log(`✅ Evicted ${evicted} session(s), ${parsingSessions.size} remaining`);
  
  return {
    evicted,
    reason: 'size_limit'
  };
};

app.post('/api/parse', async (req, res) => {
  const { url, customHeaders, cookies, userAgent } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const sessionId = Date.now().toString();
  const apiCalls = [];
  const webSocketConnections = [];
  let browser = null;
  
  try {
    // Emit progress update
    io.emit('parsing-progress', { sessionId, status: 'starting', message: 'Launching browser...' });
    
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    // Store for cancellation
    activeParsing.set(sessionId, { browser, cancelled: false });
    
    const page = await browser.newPage();
    
    // Set custom user agent or default
    const finalUserAgent = userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await page.setUserAgent(finalUserAgent);
    
    // Set custom headers if provided
    if (customHeaders && Object.keys(customHeaders).length > 0) {
      await page.setExtraHTTPHeaders(customHeaders);
    }
    
    // Set cookies if provided
    if (cookies) {
      const cookieArray = cookies.split(';').map(c => {
        const [name, value] = c.trim().split('=');
        return { name, value, domain: new URL(url).hostname };
      });
      await page.setCookie(...cookieArray);
    }
    
    // Monitor WebSocket connections
    const cdpSession = await page.target().createCDPSession();
    await cdpSession.send('Network.enable');
    
    cdpSession.on('Network.webSocketCreated', ({ requestId, url: wsUrl }) => {
      console.log('WebSocket created:', wsUrl);
      webSocketConnections.push({
        id: webSocketConnections.length + 1,
        requestId,
        url: wsUrl,
        type: 'websocket',
        timestamp: new Date().toISOString(),
        frames: [],
        status: 'connected'
      });
      io.emit('parsing-progress', { sessionId, status: 'websocket', message: `WebSocket detected: ${wsUrl}` });
    });
    
    cdpSession.on('Network.webSocketFrameSent', ({ requestId, timestamp, response }) => {
      const ws = webSocketConnections.find(w => w.requestId === requestId);
      if (ws) {
        ws.frames.push({
          direction: 'sent',
          data: response.payloadData,
          timestamp: new Date(timestamp * 1000).toISOString()
        });
      }
    });
    
    cdpSession.on('Network.webSocketFrameReceived', ({ requestId, timestamp, response }) => {
      const ws = webSocketConnections.find(w => w.requestId === requestId);
      if (ws) {
        ws.frames.push({
          direction: 'received',
          data: response.payloadData,
          timestamp: new Date(timestamp * 1000).toISOString()
        });
      }
    });
    
    cdpSession.on('Network.webSocketClosed', ({ requestId }) => {
      const ws = webSocketConnections.find(w => w.requestId === requestId);
      if (ws) {
        ws.status = 'closed';
      }
    });
    
    io.emit('parsing-progress', { sessionId, status: 'browser-ready', message: 'Browser ready, setting up interceptors...' });
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Intercept all requests
    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const headers = request.headers();
      const postData = request.postData();
      const resourceType = request.resourceType();
      
      // Enhanced API detection - more patterns
      const isApiCall = 
        resourceType === 'xhr' || 
        resourceType === 'fetch' ||
        url.includes('/api/') ||
        url.includes('/v1/') ||
        url.includes('/v2/') ||
        url.includes('/v3/') ||
        url.includes('/graphql') ||
        url.includes('/rest/') ||
        url.includes('/rpc/') ||
        url.includes('.json') ||
        url.match(/\/(auth|login|token|user|data|query|mutation)/i) ||
        headers['content-type']?.includes('application/json') ||
        headers['accept']?.includes('application/json');
      
      if (isApiCall) {
        const authentication = detectAuthentication(headers);
        const explanations = explainAPI(url, method, headers, postData);
        const graphql = url.includes('graphql') ? parseGraphQL(postData) : null;
        
        apiCalls.push({
          id: apiCalls.length + 1,
          url,
          method,
          headers,
          payload: postData || null,
          type: resourceType,
          timestamp: new Date().toISOString(),
          startTime: Date.now(),
          authentication: authentication,
          explanations: explanations,
          graphql: graphql
        });
        
        io.emit('parsing-progress', { 
          sessionId, 
          status: 'api-detected', 
          message: `API detected: ${method} ${url.substring(0, 50)}...`,
          count: apiCalls.length
        });
      }
      
      request.continue();
    });
    
    // Intercept responses
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      const headers = response.headers();
      
      // Parse rate limit information from response headers
      const rateLimitInfo = parseRateLimitHeaders(headers);
      
      // Find matching request
      const apiCall = apiCalls.find(call => call.url === url && !call.response);
      
      if (apiCall) {
        try {
          const contentType = headers['content-type'] || '';
          let responseData = null;
          const responseTime = Date.now() - apiCall.startTime; // Calculate response time
          
          if (contentType.includes('application/json')) {
            responseData = await response.json();
          } else if (contentType.includes('text')) {
            responseData = await response.text();
          }
          
          apiCall.response = {
            status,
            statusText: response.statusText(),
            headers,
            data: responseData,
            size: headers['content-length'] || 'unknown',
            responseTime: responseTime, // Add response time in milliseconds
            rateLimit: rateLimitInfo
          };
          
          // Log rate limit warnings
          if (rateLimitInfo?.isApproachingLimit) {
            console.log(`⚠️  Rate limit warning for ${url}: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`);
          }
          
          // Emit rate limit events via Socket.io
          if (rateLimitInfo?.isApproachingLimit) {
            io.emit('parsing-progress', {
              sessionId,
              status: 'rate-limit-warning',
              message: `Rate limit warning: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining`,
              rateLimit: rateLimitInfo
            });
          }
          
          // Remove startTime from final output
          delete apiCall.startTime;
        } catch (error) {
          const responseTime = Date.now() - apiCall.startTime;
          apiCall.response = {
            status,
            statusText: response.statusText(),
            headers,
            error: 'Could not parse response',
            size: headers['content-length'] || 'unknown',
            responseTime: responseTime,
            rateLimit: rateLimitInfo
          };
          delete apiCall.startTime;
        }
      }
    });
    
    // Navigate to the URL with retry logic
    console.log(`Parsing: ${url}`);
    io.emit('parsing-progress', { sessionId, status: 'loading', message: 'Loading website...' });
    
    // Wrap page.goto with retry logic for transient failures
    await retryWithBackoff(
      async () => {
        return await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 45000 
        });
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 8000,
        backoffMultiplier: 2,
        onRetry: async (retryInfo) => {
          const { attempt, maxRetries, delay, error } = retryInfo;
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms due to:`, error.message);
          io.emit('parsing-retry', { 
            sessionId, 
            attempt, 
            maxRetries, 
            delay,
            delaySeconds: Math.ceil(delay / 1000),
            reason: error.message,
            message: `Retrying... (Attempt ${attempt} of ${maxRetries})` 
          });
        }
      }
    );
    
    io.emit('parsing-progress', { sessionId, status: 'scrolling', message: 'Scrolling to load lazy content...' });
    
    // Wait a bit more for any delayed API calls
    await page.waitForTimeout(3000);
    
    // Scroll to trigger lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(2000);
    
    // Scroll back up
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    await page.waitForTimeout(1000);
    
    // Try to interact with the page to trigger more APIs
    io.emit('parsing-progress', { sessionId, status: 'interacting', message: 'Simulating user interactions...' });
    
    try {
      await page.evaluate(() => {
        // Click any buttons or links that might trigger APIs
        const buttons = document.querySelectorAll('button, a[href="#"], .clickable');
        buttons.forEach((btn, idx) => {
          if (idx < 3) { // Click first 3 interactive elements
            try { btn.click(); } catch(e) {}
          }
        });
      });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Interaction failed:', e.message);
    }
    
    // Check if cancelled
    const parseSession = activeParsing.get(sessionId);
    if (parseSession?.cancelled) {
      await browser.close();
      activeParsing.delete(sessionId);
      return res.status(499).json({ 
        error: 'Parsing cancelled by user',
        partial: true,
        sessionId,
        url,
        totalApis: apiCalls.length,
        apis: apiCalls,
        webSockets: webSocketConnections
      });
    }
    
    io.emit('parsing-progress', { sessionId, status: 'finalizing', message: 'Collecting results...' });
    
    await browser.close();
    activeParsing.delete(sessionId);
    
    // Check size warning threshold
    if (parsingSessions.size >= SESSION_SIZE_WARNING_THRESHOLD) {
      console.log(`⚠️  Warning: Session storage approaching limit (${parsingSessions.size}/${MAX_SESSIONS} sessions)`);
    }
    
    // Store session with metadata
    const now = Date.now();
    parsingSessions.set(sessionId, {
      url,
      apiCalls,
      webSockets: webSocketConnections,
      timestamp: new Date().toISOString(),
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0
    });
    
    // Enforce size limits
    enforceSessionSizeLimit();
    
    io.emit('parsing-progress', { sessionId, status: 'complete', message: 'Parsing complete!' });
    
    res.json({
      sessionId,
      url,
      totalApis: apiCalls.length,
      totalWebSockets: webSocketConnections.length,
      apis: apiCalls,
      webSockets: webSocketConnections
    });
    
  } catch (error) {
    console.error('Parsing error:', error);
    if (browser) {
      await browser.close();
    }
    activeParsing.delete(sessionId);
    
    // Enhanced error categorization and formatting
    const errorType = categorizeError(error);
    const formattedError = formatErrorForDisplay(error);
    const retryStrategy = getRetryStrategy(errorType);
    
    // Emit error event via Socket.io
    io.emit('parsing-error', { 
      sessionId, 
      error: formattedError,
      message: `Error: ${formattedError.title}` 
    });
    
    // Determine HTTP status code based on error type
    let statusCode = 500;
    if (errorType === 'client' || errorType === 'dns') {
      statusCode = 400;
    } else if (errorType === 'timeout') {
      statusCode = 504;
    } else if (errorType === 'connection') {
      statusCode = 503;
    }
    
    res.status(statusCode).json({ 
      error: formattedError.title,
      message: formattedError.message,
      type: errorType,
      suggestions: formattedError.suggestions,
      retryable: retryStrategy.retryable,
      originalError: {
        message: error.message,
        code: error.code,
        name: error.name
      }
    });
  }
});

// Cancel parsing endpoint
app.post('/api/cancel/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const parseSession = activeParsing.get(sessionId);
  
  if (!parseSession) {
    return res.status(404).json({ error: 'Session not found or already completed' });
  }
  
  try {
    parseSession.cancelled = true;
    if (parseSession.browser) {
      await parseSession.browser.close();
    }
    activeParsing.delete(sessionId);
    
    io.emit('parsing-progress', { sessionId, status: 'cancelled', message: 'Parsing cancelled by user' });
    
    res.json({ success: true, message: 'Parsing cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel parsing', message: error.message });
  }
});

app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = parsingSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Update access tracking for LRU
  session.lastAccessedAt = Date.now();
  session.accessCount++;
  
  // Calculate session metadata
  const age = Math.round((Date.now() - session.createdAt) / 60000);
  const timeUntilExpiration = Math.round((SESSION_TTL_MS - (Date.now() - session.createdAt)) / 60000);
  
  res.json({
    ...session,
    metadata: {
      ageMinutes: age,
      timeUntilExpirationMinutes: Math.max(0, timeUntilExpiration),
      accessCount: session.accessCount
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Parser server is running' });
});

// Session statistics endpoint
app.get('/api/sessions/stats', (req, res) => {
  const now = Date.now();
  const sessions = Array.from(parsingSessions.values());
  
  if (sessions.length === 0) {
    return res.json({
      totalSessions: 0,
      maxSessions: MAX_SESSIONS,
      utilizationPercent: 0,
      oldestSessionAge: 0,
      newestSessionAge: 0,
      averageSessionAge: 0,
      totalAccessCount: 0,
      sessionTTL: SESSION_TTL_MS / 3600000,
      nextCleanupIn: Math.round(CLEANUP_INTERVAL_MS / 60000)
    });
  }
  
  const ages = sessions.map(s => (now - s.createdAt) / 60000);
  const oldestSessionAge = Math.round(Math.max(...ages));
  const newestSessionAge = Math.round(Math.min(...ages));
  const averageSessionAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
  const totalAccessCount = sessions.reduce((sum, s) => sum + s.accessCount, 0);
  
  res.json({
    totalSessions: parsingSessions.size,
    maxSessions: MAX_SESSIONS,
    utilizationPercent: Math.round((parsingSessions.size / MAX_SESSIONS) * 100),
    oldestSessionAge,
    newestSessionAge,
    averageSessionAge,
    totalAccessCount,
    sessionTTL: SESSION_TTL_MS / 3600000,
    nextCleanupIn: Math.round(CLEANUP_INTERVAL_MS / 60000)
  });
});

// Manual cleanup endpoint
app.post('/api/sessions/cleanup', (req, res) => {
  const { force, maxAge } = req.query;
  const timestamp = new Date().toISOString();
  
  console.log(`🧹 [${timestamp}] Manual cleanup triggered (force=${force}, maxAge=${maxAge})`);
  
  if (force === 'true') {
    const count = parsingSessions.size;
    parsingSessions.clear();
    console.log(`   Force cleanup: Removed all ${count} sessions`);
    return res.json({
      success: true,
      cleanupStats: { removed: count, remaining: 0, oldestSessionAge: 0 },
      evictionStats: { evicted: 0, reason: 'force_cleanup' },
      timestamp
    });
  }
  
  // Custom TTL cleanup
  if (maxAge) {
    const customTTL = parseInt(maxAge) * 60000; // Convert minutes to ms
    const now = Date.now();
    let removed = 0;
    
    for (const [sessionId, session] of parsingSessions.entries()) {
      if (now - session.createdAt > customTTL) {
        parsingSessions.delete(sessionId);
        removed++;
      }
    }
    
    console.log(`   Custom TTL cleanup (${maxAge} minutes): Removed ${removed} sessions`);
  }
  
  const cleanupStats = cleanupExpiredSessions();
  const evictionStats = enforceSessionSizeLimit();
  
  res.json({
    success: true,
    cleanupStats,
    evictionStats,
    timestamp
  });
});

// ============================================
// Advanced Parsing Endpoints
// ============================================

// Get available parsing profiles
app.get('/api/parsing/profiles', (req, res) => {
  try {
    res.json({
      success: true,
      profiles: Object.keys(PARSING_PROFILES),
      profileDetails: PARSING_PROFILES
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Advanced parse endpoint with professional features
app.post('/api/parse/advanced', async (req, res) => {
  try {
    const { 
      url, 
      profile = 'default',
      customOptions = {},
      useProxy = false,
      proxies = []
    } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    console.log(`\n🚀 Advanced parsing request for: ${url}`);
    console.log(`📋 Profile: ${profile}`);
    console.log(`🔧 Custom options: ${Object.keys(customOptions).length > 0 ? 'Yes' : 'No'}`);
    console.log(`🌐 Use proxy: ${useProxy ? 'Yes' : 'No'}`);

    // Get configuration for the URL
    const baseConfig = getConfigForUrl(url, profile);
    const finalConfig = mergeParsingOptions(baseConfig, customOptions);

    console.log(`⚙️ Final configuration:`, {
      profile,
      timeout: finalConfig.timeout,
      retries: finalConfig.maxRetries,
      stealth: finalConfig.stealth,
      detectedSite: finalConfig.detectedSite
    });

    let result;

    if (useProxy && proxies.length > 0) {
      console.log(`🔄 Using proxy rotation with ${proxies.length} proxies`);
      result = await advancedParser.parseWithProxyRotation(url, proxies, finalConfig);
    } else {
      result = await advancedParser.parseWithAdvancedFeatures(url, finalConfig);
    }

    if (result.success) {
      console.log(`✅ Successfully parsed ${url}`);
      console.log(`📊 Statistics:
        - API calls captured: ${result.apis.length}
        - Failed requests: ${result.failedRequests.length}
        - Console logs: ${result.consoleLogs.length}
        - JavaScript errors: ${result.jsErrors.length}
      `);
    } else {
      console.log(`❌ Failed to parse ${url}: ${result.error.message}`);
    }

    res.json({
      success: result.success,
      ...result,
      parsingConfig: {
        profile,
        detectedSite: finalConfig.detectedSite,
        options: finalConfig
      }
    });

  } catch (error) {
    console.error('❌ Advanced parsing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Proxy management endpoints
app.post('/api/proxy/add', (req, res) => {
  try {
    const { proxy, proxies } = req.body;
    
    if (proxy) {
      proxyManager.addProxy(proxy);
    }
    
    if (proxies && Array.isArray(proxies)) {
      proxyManager.addProxies(proxies);
    }
    
    res.json({
      success: true,
      proxies: proxyManager.getAllProxies()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/proxy/list', (req, res) => {
  try {
    res.json({
      success: true,
      ...proxyManager.getAllProxies()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/proxy/test', async (req, res) => {
  try {
    const { proxy } = req.body;
    
    if (!proxy) {
      return res.status(400).json({
        success: false,
        error: 'Proxy is required'
      });
    }
    
    const result = await proxyManager.testProxy(proxy);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Socket.IO connection handling
// ============================================
// DNS Checking & Fallback Endpoints
// ============================================

// Get available DNS servers
app.get('/api/dns/servers', (req, res) => {
  try {
    const current = getCurrentDNS();
    res.json({
      success: true,
      current: current.servers,
      available: DNS_SERVERS,
      message: current.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check website with DNS fallback
app.post('/api/dns/check', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    console.log(`🔍 DNS check requested for: ${url}`);
    const results = await checkWithDNSFallback(url);
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('❌ DNS check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quick DNS check with specific server
app.post('/api/dns/quick-check', async (req, res) => {
  try {
    const { url, dnsServers } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    const result = await quickDNSCheck(url, dnsServers);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Set up periodic cleanup interval
let cleanupIntervalId;

try {
  // Run initial cleanup
  console.log('🧹 Running initial session cleanup...');
  cleanupExpiredSessions();
  
  // Set up periodic cleanup
  cleanupIntervalId = setInterval(() => {
    try {
      const cleanupStats = cleanupExpiredSessions();
      const evictionStats = enforceSessionSizeLimit();
      
      if (cleanupStats.removed > 0 || evictionStats.evicted > 0) {
        console.log(`📊 Cleanup summary: ${cleanupStats.removed} expired, ${evictionStats.evicted} evicted, ${cleanupStats.remaining} remaining`);
      }
    } catch (error) {
      console.error('❌ Error during periodic cleanup:', error.message);
    }
  }, CLEANUP_INTERVAL_MS);
  
  console.log('✅ Session cleanup interval initialized');
} catch (error) {
  console.error('❌ Failed to initialize cleanup interval:', error.message);
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }
  console.log(`📊 Final session count: ${parsingSessions.size}`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }
  console.log(`📊 Final session count: ${parsingSessions.size}`);
  process.exit(0);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 API Parser server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to parse websites and extract API information`);
  console.log(`🔌 WebSocket support enabled`);
  console.log(`🔍 Enhanced API detection active`);
  console.log(`\n💾 Session Management Configuration:`);
  console.log(`   ⏰ Session TTL: ${SESSION_TTL_MS / 3600000} hour`);
  console.log(`   📦 Max sessions: ${MAX_SESSIONS}`);
  console.log(`   🧹 Cleanup interval: ${CLEANUP_INTERVAL_MS / 60000} minutes`);
  console.log(`   ⚠️  Warning threshold: ${SESSION_SIZE_WARNING_THRESHOLD} sessions`);
  console.log(`   💾 Memory management: Active`);
});
