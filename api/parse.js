// Dynamic imports to work with Vercel's file tracer
let chromUtils, helpers;

async function ensureImports() {
  if (!chromUtils) chromUtils = await import('./utils/chromium.js');
  if (!helpers) helpers = await import('./utils/helpers.js');
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch { return false; }
}

/**
 * Parse Cookie Editor JSON format into Puppeteer cookie format.
 */
function parseCookieEditorFormat(cookies, targetUrl) {
  if (!cookies) return null;
  const hostname = new URL(targetUrl).hostname;

  if (Array.isArray(cookies)) {
    return cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain || hostname,
      path: c.path || '/',
      httpOnly: c.httpOnly || false,
      secure: c.secure || false,
      sameSite: c.sameSite === 'no_restriction' ? 'None' :
                c.sameSite === 'lax' ? 'Lax' :
                c.sameSite === 'strict' ? 'Strict' : 'Lax',
      ...(c.expirationDate ? { expires: c.expirationDate } : {})
    }));
  }

  if (typeof cookies === 'string') {
    try {
      const parsed = JSON.parse(cookies);
      if (Array.isArray(parsed)) return parseCookieEditorFormat(parsed, targetUrl);
    } catch { /* not JSON */ }

    return cookies.split(';').map(c => {
      const [name, ...valueParts] = c.trim().split('=');
      return { name: name?.trim(), value: valueParts.join('=')?.trim(), domain: hostname, path: '/' };
    }).filter(c => c.name && c.value);
  }

  return null;
}

/**
 * Skip list — resource URLs to ignore (analytics, ads, tracking pixels, etc.)
 */
const SKIP_EXTENSIONS = /\.(woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif|mp4|webm|mp3|css|wasm)(\?|$)/i;
const SKIP_DOMAINS = /google-analytics|googletagmanager|googlesyndication|doubleclick|facebook\.net|fbcdn|hotjar|segment\.io|sentry\.io|newrelic|datadoghq/i;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, customHeaders, cookies, userAgent, options = {} } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL', message: 'Enter a valid public URL (http:// or https://)' });

  const sessionId = Date.now().toString();
  const apiCalls = [];
  const webSocketConnections = [];
  const sseConnections = [];
  const pageResources = { scripts: 0, stylesheets: 0, images: 0, fonts: 0, media: 0, other: 0 };
  const securityHeaders = {};
  const logs = [];
  let page = null;
  let cdpSession = null;
  const startTime = Date.now();

  // Derive the page domain for cross-origin detection
  let pageDomain;
  try { pageDomain = new URL(url).hostname.replace(/^www\./, ''); } catch { pageDomain = ''; }
  // Extract root domain (e.g. "axiom.trade" from "www.axiom.trade")
  const rootDomain = pageDomain.split('.').slice(-2).join('.');

  function log(level, msg, data = null) {
    const entry = { level, msg, time: Date.now() - startTime, ...(data ? { data } : {}) };
    logs.push(entry);
    console[level === 'error' ? 'error' : 'log'](`[parse:${level}] ${msg}`, data ? JSON.stringify(data).slice(0, 200) : '');
  }

  log('info', `Scan started: ${url}`, { sessionId, pageDomain, rootDomain, hasCookies: !!cookies, hasHeaders: !!customHeaders, deepScan: !!options.deepScan });

  try {
    await ensureImports();
    const browser = await chromUtils.getBrowser();
    log('info', 'Browser acquired');

    const parsedCookies = parseCookieEditorFormat(cookies, url);
    log('info', `Cookies: ${parsedCookies ? parsedCookies.length + ' cookies parsed' : 'none'}`);

    page = await chromUtils.createPage(browser, {
      url, userAgent, headers: customHeaders, cookies: parsedCookies
    });
    log('info', 'Page created');

    // ── CDP Session for WebSocket capture ─────────────────
    try {
      cdpSession = await page.createCDPSession();
      await cdpSession.send('Network.enable');

      cdpSession.on('Network.webSocketCreated', (params) => {
        log('info', `WebSocket created: ${params.url}`);
        webSocketConnections.push({
          id: webSocketConnections.length + 1,
          url: params.url,
          requestId: params.requestId,
          type: 'websocket',
          timestamp: new Date().toISOString(),
          frames: [],
          status: 'connecting'
        });
      });

      cdpSession.on('Network.webSocketFrameSent', (params) => {
        const ws = webSocketConnections.find(w => w.requestId === params.requestId);
        if (ws) {
          ws.frames.push({ direction: 'sent', data: params.response?.payloadData?.substring(0, 2000), time: new Date().toISOString() });
          if (ws.frames.length > 50) ws.frames = ws.frames.slice(-50);
        }
      });

      cdpSession.on('Network.webSocketFrameReceived', (params) => {
        const ws = webSocketConnections.find(w => w.requestId === params.requestId);
        if (ws) {
          ws.status = 'connected';
          ws.frames.push({ direction: 'received', data: params.response?.payloadData?.substring(0, 2000), time: new Date().toISOString() });
          if (ws.frames.length > 50) ws.frames = ws.frames.slice(-50);
        }
      });

      cdpSession.on('Network.webSocketClosed', (params) => {
        const ws = webSocketConnections.find(w => w.requestId === params.requestId);
        if (ws) ws.status = 'closed';
      });

      cdpSession.on('Network.webSocketHandshakeResponseReceived', (params) => {
        const ws = webSocketConnections.find(w => w.requestId === params.requestId);
        if (ws) {
          ws.status = 'connected';
          ws.handshakeHeaders = params.response?.headers || {};
        }
      });

      log('info', 'CDP WebSocket capture enabled');
    } catch (e) {
      log('warn', 'CDP session failed', { error: e.message });
    }

    // ── Request interception ──────────────────────────────
    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const reqUrl = request.url();
      const method = request.method();
      const headers = request.headers();
      const postData = request.postData();
      const resourceType = request.resourceType();

      // Track resource types
      if (resourceType === 'script') pageResources.scripts++;
      else if (resourceType === 'stylesheet') pageResources.stylesheets++;
      else if (resourceType === 'image') pageResources.images++;
      else if (resourceType === 'font') pageResources.fonts++;
      else if (resourceType === 'media') pageResources.media++;
      else if (!['document', 'xhr', 'fetch'].includes(resourceType)) pageResources.other++;

      // Detect SSE connections
      if (headers['accept']?.includes('text/event-stream') || reqUrl.includes('/events') || reqUrl.includes('/sse')) {
        sseConnections.push({
          id: sseConnections.length + 1,
          url: reqUrl, type: 'sse',
          timestamp: new Date().toISOString(), headers
        });
      }

      // ── BROAD API DETECTION ─────────────────────────────
      // Capture ALL of: fetch/xhr, cross-origin JSON calls, API-pattern URLs
      let reqHostname = '';
      try { reqHostname = new URL(reqUrl).hostname; } catch {}
      const reqRootDomain = reqHostname.split('.').slice(-2).join('.');

      const isFetchOrXHR = resourceType === 'xhr' || resourceType === 'fetch';
      const isApiSubdomain = /^api\d*\./.test(reqHostname); // api., api2., api8., etc.
      const isCrossOriginSameRoot = reqRootDomain === rootDomain && reqHostname !== pageDomain && reqHostname !== `www.${pageDomain}`;
      const hasApiPattern = reqUrl.includes('/api/') || reqUrl.includes('/v1/') || reqUrl.includes('/v2/') ||
        reqUrl.includes('/v3/') || reqUrl.includes('/v4/') || reqUrl.includes('/graphql') ||
        reqUrl.includes('/rest/') || reqUrl.includes('/rpc/');
      const isJsonExchange = headers['content-type']?.includes('application/json') ||
        headers['accept']?.includes('application/json');

      // Skip static assets and tracking
      const isStatic = SKIP_EXTENSIONS.test(reqUrl) || SKIP_DOMAINS.test(reqUrl) || resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet';

      const isApiCall = !isStatic && (isFetchOrXHR || isApiSubdomain || isCrossOriginSameRoot || hasApiPattern || isJsonExchange);

      if (isApiCall) {
        let parsedUrl;
        try { parsedUrl = new URL(reqUrl); } catch { parsedUrl = null; }
        if (parsedUrl) {
          apiCalls.push({
            id: apiCalls.length + 1, url: reqUrl, method, headers,
            payload: postData || null, type: resourceType,
            timestamp: new Date().toISOString(), startTime: Date.now(),
            authentication: helpers.detectAuthentication(headers),
            explanations: helpers.explainAPI(reqUrl, method, headers, postData),
            graphql: reqUrl.includes('graphql') ? helpers.parseGraphQL(postData) : null,
            hostname: parsedUrl.hostname,
            pathname: parsedUrl.pathname,
            queryParams: Object.fromEntries(parsedUrl.searchParams.entries()),
            protocol: parsedUrl.protocol,
            apiVersion: helpers.detectApiVersion(reqUrl),
            contentType: headers['content-type'] || null,
            category: helpers.categorizeEndpoint(reqUrl, method),
            // Extra context
            origin: headers['origin'] || null,
            referer: headers['referer'] || null,
            isCrossOrigin: reqHostname !== pageDomain,
          });
        }
      }
      request.continue();
    });

    // ── Response interception ─────────────────────────────
    page.on('response', async (response) => {
      const respUrl = response.url();
      const status = response.status();
      const headers = response.headers();

      // Capture security headers from FIRST document response (main page or redirected page)
      let respHost = '';
      try { respHost = new URL(respUrl).hostname; } catch {}
      const isPageResponse = respHost === pageDomain || respHost === `www.${pageDomain}`;
      if (isPageResponse && !securityHeaders._captured) {
        if (headers['content-security-policy']) securityHeaders.csp = headers['content-security-policy'];
        if (headers['strict-transport-security']) securityHeaders.hsts = headers['strict-transport-security'];
        if (headers['x-frame-options']) securityHeaders.xFrameOptions = headers['x-frame-options'];
        if (headers['x-content-type-options']) securityHeaders.xContentTypeOptions = headers['x-content-type-options'];
        if (headers['x-xss-protection']) securityHeaders.xXssProtection = headers['x-xss-protection'];
        if (headers['referrer-policy']) securityHeaders.referrerPolicy = headers['referrer-policy'];
        if (headers['permissions-policy']) securityHeaders.permissionsPolicy = headers['permissions-policy'];
        if (headers['access-control-allow-origin']) securityHeaders.cors = headers['access-control-allow-origin'];
        if (headers['access-control-allow-methods']) securityHeaders.corsMethods = headers['access-control-allow-methods'];
        if (headers['access-control-allow-headers']) securityHeaders.corsHeaders = headers['access-control-allow-headers'];
        if (headers['access-control-allow-credentials']) securityHeaders.corsCredentials = headers['access-control-allow-credentials'];
        securityHeaders.server = headers['server'] || null;
        securityHeaders.poweredBy = headers['x-powered-by'] || null;
        securityHeaders._captured = true;
      }

      const rateLimitInfo = helpers.parseRateLimitHeaders(headers);
      const apiCall = apiCalls.find(c => c.url === respUrl && !c.response);
      if (!apiCall) return;

      try {
        const ct = headers['content-type'] || '';
        let data = null;
        const responseTime = Date.now() - apiCall.startTime;
        if (ct.includes('application/json')) data = await response.json().catch(() => null);
        else if (ct.includes('text')) { const t = await response.text().catch(() => ''); data = t?.substring(0, 5000); }

        apiCall.response = {
          status, statusText: response.statusText(), headers, data,
          size: headers['content-length'] || 'unknown',
          responseTime, rateLimit: rateLimitInfo,
          contentType: ct,
          cors: {
            allowOrigin: headers['access-control-allow-origin'] || null,
            allowMethods: headers['access-control-allow-methods'] || null,
            allowHeaders: headers['access-control-allow-headers'] || null,
            credentials: headers['access-control-allow-credentials'] || null,
            maxAge: headers['access-control-max-age'] || null,
          },
          cacheControl: headers['cache-control'] || null,
          server: headers['server'] || null,
          cfRay: headers['cf-ray'] || null,
          vary: headers['vary'] || null,
        };
        delete apiCall.startTime;
      } catch {
        apiCall.response = {
          status, statusText: response.statusText(), headers,
          error: 'Could not parse',
          size: headers['content-length'] || 'unknown',
          responseTime: Date.now() - apiCall.startTime,
          rateLimit: rateLimitInfo,
          contentType: headers['content-type'] || ''
        };
        delete apiCall.startTime;
      }
    });

    // ── Console + errors ──────────────────────────────────
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text(), time: new Date().toISOString() });
      if (consoleMessages.length > 100) consoleMessages.shift();
    });

    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push({ message: error.message, time: new Date().toISOString() });
    });

    // ── Navigate to exact URL ─────────────────────────────
    log('info', 'Navigating to page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    const landedUrl = page.url();
    log('info', `DOM loaded. Landed on: ${landedUrl}`);

    // Wait for network to settle (SPA-friendly: 5 seconds for async API calls)
    try {
      await page.waitForNetworkIdle({ idleTime: 1500, timeout: 12000 });
      log('info', 'Network idle reached');
    } catch {
      log('info', 'Network idle timeout — page has persistent connections (expected for SPAs)');
    }

    // Additional wait for late-firing API calls (SPAs fire API calls after render)
    await new Promise(r => setTimeout(r, 3000));
    log('info', `After initial wait: ${apiCalls.length} APIs captured so far`);

    // Scroll to trigger lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll back up
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 1500));
    log('info', `After scroll: ${apiCalls.length} APIs captured`);

    // Deep scan: click interactive elements
    if (options.deepScan) {
      log('info', 'Deep scan: clicking interactive elements...');
      try {
        await page.evaluate(() => {
          const elements = document.querySelectorAll('button, [role="button"], [data-toggle], a[href="#"], [onclick], .tab, .nav-link, [role="tab"]');
          elements.forEach((el, i) => {
            if (i < 8) { try { el.click(); } catch {} }
          });
        });
        await new Promise(r => setTimeout(r, 3000));
        log('info', `After deep scan clicks: ${apiCalls.length} APIs captured`);
      } catch { /* silently continue */ }
    }

    // Final wait for any remaining API calls
    await new Promise(r => setTimeout(r, 1000));

    // ── Get page info ─────────────────────────────────────
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || null,
      favicon: document.querySelector('link[rel="icon"]')?.href || null,
      language: document.documentElement.lang || null,
      charset: document.charset || null,
      url: window.location.href,
    })).catch(() => ({}));

    // Add the final URL in case of SPA redirect
    pageInfo.landedUrl = landedUrl;
    pageInfo.requestedUrl = url;

    if (cdpSession) await cdpSession.detach().catch(() => {});
    await page.close().catch(() => {});
    page = null;
    cdpSession = null;

    // Remove internal marker
    delete securityHeaders._captured;

    // Build analytics
    const analytics = helpers.buildAnalytics(apiCalls, webSocketConnections, sseConnections);

    // Optional MongoDB save
    try {
      const { getCollection, COLLECTIONS } = await import('./config/mongodb.js');
      const col = await getCollection(COLLECTIONS.SESSIONS);
      await col.insertOne({
        sessionId, url, apiCalls, webSockets: webSocketConnections, sse: sseConnections,
        analytics, securityHeaders, pageInfo, pageResources,
        timestamp: new Date(), createdAt: new Date(), expiresAt: new Date(Date.now() + 3600000)
      });
    } catch (e) { log('info', 'MongoDB save skipped: ' + e.message); }

    const duration = Date.now() - startTime;
    log('info', `Scan complete: ${apiCalls.length} APIs, ${webSocketConnections.length} WebSockets, ${sseConnections.length} SSE in ${duration}ms`);

    res.json({
      sessionId, url: landedUrl,
      totalApis: apiCalls.length,
      totalWebSockets: webSocketConnections.length,
      totalSSE: sseConnections.length,
      apis: apiCalls,
      webSockets: webSocketConnections,
      sse: sseConnections,
      analytics,
      securityHeaders,
      pageInfo,
      pageResources,
      consoleMessages: consoleMessages.slice(0, 50),
      pageErrors,
      duration,
      logs
    });
  } catch (error) {
    if (cdpSession) await cdpSession.detach().catch(() => {});
    if (page) await page.close().catch(() => {});
    const duration = Date.now() - startTime;
    log('error', error.message, { stack: error.stack?.split('\n').slice(0, 5) });
    const isTimeout = error.message?.includes('timeout') || error.message?.includes('Timeout');
    res.status(isTimeout ? 504 : 500).json({
      error: 'Parsing failed',
      message: isTimeout ? 'Website took too long to load. Try a simpler page or add cookies for auth-required pages.' : error.message,
      detail: error.stack?.split('\n').slice(0, 3).join(' | '),
      sessionId, duration, logs
    });
  }
}
