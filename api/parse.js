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
 * Parse cookies from many formats into Puppeteer cookie format.
 * Supports: Cookie Editor JSON, EditThisCookie, Netscape/wget, header string,
 * HAR cookies, key=value pairs, object/dict format.
 */
function parseCookieEditorFormat(cookies, targetUrl) {
  if (!cookies) return null;
  const hostname = new URL(targetUrl).hostname;

  // ── Array format (Cookie Editor, EditThisCookie, HAR cookies) ──
  if (Array.isArray(cookies)) {
    return cookies.map(c => ({
      name: c.name,
      value: String(c.value ?? ''),
      domain: c.domain || hostname,
      path: c.path || '/',
      httpOnly: c.httpOnly || false,
      secure: c.secure || false,
      sameSite: c.sameSite === 'no_restriction' ? 'None' :
                c.sameSite === 'lax' ? 'Lax' :
                c.sameSite === 'strict' ? 'Strict' :
                c.sameSite === 'None' ? 'None' :
                c.sameSite === 'Lax' ? 'Lax' :
                c.sameSite === 'Strict' ? 'Strict' : 'Lax',
      ...(c.expirationDate ? { expires: c.expirationDate } : {}),
      ...(c.expires && !c.expirationDate ? { expires: typeof c.expires === 'string' ? Math.floor(new Date(c.expires).getTime() / 1000) : c.expires } : {}),
    })).filter(c => c.name);
  }

  // ── Object/dict format { name: value } ──
  if (typeof cookies === 'object' && !Array.isArray(cookies)) {
    return Object.entries(cookies).map(([name, value]) => ({
      name, value: String(value ?? ''), domain: hostname, path: '/'
    })).filter(c => c.name);
  }

  // ── String formats ──
  if (typeof cookies === 'string') {
    const trimmed = cookies.trim();

    // Try JSON parse first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseCookieEditorFormat(parsed, targetUrl);
      if (typeof parsed === 'object') return parseCookieEditorFormat(parsed, targetUrl);
    } catch { /* not JSON */ }

    // Netscape/wget cookie file format (tab-separated lines)
    // Format: domain\tTRUE/FALSE\tpath\tTRUE/FALSE\texpires\tname\tvalue
    if (trimmed.includes('\t') && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      const lines = trimmed.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      const netscapeCookies = [];
      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 7) {
          netscapeCookies.push({
            name: parts[5].trim(),
            value: parts[6].trim(),
            domain: parts[0].trim().replace(/^\./, '.'),
            path: parts[2].trim() || '/',
            secure: parts[3].trim().toUpperCase() === 'TRUE',
            httpOnly: false,
            ...(parts[4] && parts[4] !== '0' ? { expires: parseInt(parts[4]) } : {}),
          });
        }
      }
      if (netscapeCookies.length > 0) return netscapeCookies;
    }

    // Simple header format: "name=value; name2=value2"
    return trimmed.split(';').map(c => {
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
  const redirectChain = [];
  const logs = [];
  let page = null;
  let cdpSession = null;
  const startTime = Date.now();

  // ── Pending API request tracking ──────────────────────
  let pendingApiCount = 0;
  let lastApiTime = Date.now();

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

    // ── CDP Session for WebSocket + backup network capture ──
    try {
      cdpSession = await page.createCDPSession();
      await cdpSession.send('Network.enable');

      // CDP backup: catch requests that page.on('request') might miss
      // (Web Workers, iframes, detached contexts, etc.)
      const cdpSeenUrls = new Set();
      cdpSession.on('Network.requestWillBeSent', (params) => {
        const reqUrl = params.request?.url;
        if (!reqUrl || cdpSeenUrls.has(reqUrl)) return;
        const method = params.request?.method || 'GET';
        const headers = params.request?.headers || {};

        let reqHostname = '';
        try { reqHostname = new URL(reqUrl).hostname; } catch { return; }
        const reqRootDomain = reqHostname.split('.').slice(-2).join('.');

        const isApiSubdomain = /^api\d*\./.test(reqHostname);
        const isCrossOriginSameRoot = reqRootDomain === rootDomain && reqHostname !== pageDomain && reqHostname !== `www.${pageDomain}`;
        const hasApiPattern = reqUrl.includes('/api/') || reqUrl.includes('/v1/') || reqUrl.includes('/v2/') ||
          reqUrl.includes('/v3/') || reqUrl.includes('/v4/') || reqUrl.includes('/graphql') ||
          reqUrl.includes('/rest/') || reqUrl.includes('/rpc/');
        const isJsonExchange = headers['Content-Type']?.includes('application/json') ||
          headers['Accept']?.includes('application/json');
        const type = params.type?.toLowerCase() || '';
        const isFetchOrXHR = type === 'xhr' || type === 'fetch';

        const isStatic = SKIP_EXTENSIONS.test(reqUrl) || SKIP_DOMAINS.test(reqUrl);
        const isApiCall = !isStatic && (isFetchOrXHR || isApiSubdomain || isCrossOriginSameRoot || hasApiPattern || isJsonExchange);

        if (isApiCall) {
          // Only add if not already captured by request interception
          const alreadyCaptured = apiCalls.some(c => c.url === reqUrl);
          if (!alreadyCaptured) {
            cdpSeenUrls.add(reqUrl);
            let parsedUrl;
            try { parsedUrl = new URL(reqUrl); } catch { return; }
            pendingApiCount++;
            lastApiTime = Date.now();
            log('info', `CDP backup captured: ${method} ${reqUrl.substring(0, 120)}`);
            apiCalls.push({
              id: apiCalls.length + 1, url: reqUrl, method, headers,
              payload: params.request?.postData || null,
              type: type || 'cdp',
              timestamp: new Date().toISOString(), startTime: Date.now(),
              authentication: helpers.detectAuthentication(headers),
              explanations: helpers.explainAPI(reqUrl, method, headers, params.request?.postData),
              graphql: reqUrl.includes('graphql') ? helpers.parseGraphQL(params.request?.postData) : null,
              hostname: parsedUrl.hostname,
              pathname: parsedUrl.pathname,
              queryParams: Object.fromEntries(parsedUrl.searchParams.entries()),
              protocol: parsedUrl.protocol,
              apiVersion: helpers.detectApiVersion(reqUrl),
              contentType: headers['Content-Type'] || null,
              category: helpers.categorizeEndpoint(reqUrl, method),
              origin: headers['Origin'] || null,
              referer: headers['Referer'] || null,
              isCrossOrigin: reqHostname !== pageDomain,
              source: 'cdp-backup',
            });
          }
        }
      });

      // CDP backup: catch responses for CDP-captured requests
      cdpSession.on('Network.responseReceived', (params) => {
        const respUrl = params.response?.url;
        if (!respUrl) return;
        const apiCall = apiCalls.find(c => c.url === respUrl && c.source === 'cdp-backup' && !c.response);
        if (!apiCall) return;
        apiCall.response = {
          status: params.response.status,
          statusText: params.response.statusText || '',
          headers: params.response.headers || {},
          size: params.response.headers?.['content-length'] || 'unknown',
          responseTime: Date.now() - apiCall.startTime,
          contentType: params.response.headers?.['content-type'] || '',
          cors: {
            allowOrigin: params.response.headers?.['access-control-allow-origin'] || null,
            allowMethods: params.response.headers?.['access-control-allow-methods'] || null,
            allowHeaders: params.response.headers?.['access-control-allow-headers'] || null,
            credentials: params.response.headers?.['access-control-allow-credentials'] || null,
            maxAge: params.response.headers?.['access-control-max-age'] || null,
          },
          cacheControl: params.response.headers?.['cache-control'] || null,
          server: params.response.headers?.['server'] || null,
          cfRay: params.response.headers?.['cf-ray'] || null,
          vary: params.response.headers?.['vary'] || null,
        };
        delete apiCall.startTime;
        pendingApiCount = Math.max(0, pendingApiCount - 1);
      });

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

      // Track redirects
      if (request.isNavigationRequest() && request.redirectChain().length > 0) {
        request.redirectChain().forEach(req => {
          redirectChain.push({ url: req.url(), status: req.response()?.status() || 0 });
        });
      }

      if (isApiCall) {
        let parsedUrl;
        try { parsedUrl = new URL(reqUrl); } catch { parsedUrl = null; }
        // Skip if CDP backup already captured this exact URL
        const alreadyCaptured = apiCalls.some(c => c.url === reqUrl);
        if (parsedUrl && !alreadyCaptured) {
          pendingApiCount++;
          lastApiTime = Date.now();
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
        pendingApiCount = Math.max(0, pendingApiCount - 1);
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
        pendingApiCount = Math.max(0, pendingApiCount - 1);
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

    // ── Smart API wait function ────────────────────────────
    // Waits until: all pending API requests resolve AND no new API requests for 2s
    // This is far more reliable than waitForNetworkIdle for SPAs with WebSocket connections
    const waitForApiQuiet = (label, maxWait = 18000) => new Promise(resolve => {
      const waitStart = Date.now();
      const minWait = 3000;
      log('info', `${label}: waiting (pending: ${pendingApiCount}, captured: ${apiCalls.length})`);
      const check = () => {
        const elapsed = Date.now() - waitStart;
        const sinceLast = Date.now() - lastApiTime;
        if (elapsed >= maxWait) {
          log('info', `${label}: max wait ${maxWait}ms reached (pending: ${pendingApiCount}, captured: ${apiCalls.length})`);
          resolve(); return;
        }
        if (elapsed >= minWait && pendingApiCount <= 0 && sinceLast >= 2000) {
          log('info', `${label}: API quiet after ${elapsed}ms (captured: ${apiCalls.length})`);
          resolve(); return;
        }
        setTimeout(check, 300);
      };
      setTimeout(check, minWait);
    });

    // ── Navigate to exact URL ─────────────────────────────
    log('info', 'Navigating to page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    const landedUrl = page.url();
    log('info', `DOM loaded. Landed on: ${landedUrl}`);

    // Smart wait — tracks actual API requests, not general network (WebSocket frames won't interfere)
    await waitForApiQuiet('Initial load', 18000);

    // ── Interaction phase: scroll + click to trigger lazy API calls ──

    // 1. Scroll down slowly (triggers IntersectionObserver / scroll-based lazy loads)
    await page.evaluate(async () => {
      const totalHeight = document.body.scrollHeight;
      const step = Math.max(300, Math.floor(totalHeight / 5));
      for (let y = 0; y < totalHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 400));
      }
      window.scrollTo({ top: totalHeight, behavior: 'smooth' });
    });
    await waitForApiQuiet('After scroll down', 8000);

    // 2. Click tabs, nav items, panels — catches section-specific API calls (e.g. KOLs tab)
    log('info', 'Clicking interactive elements (tabs, nav, buttons)...');
    try {
      await page.evaluate(() => {
        const selectors = [
          '[role="tab"]', '.tab', '.nav-link', '.nav-item', '[data-tab]', '[data-toggle="tab"]',
          '[role="button"]', 'button:not([type="submit"])',
          'a[href="#"]', 'a[href^="#"]', '[onclick]', '[data-toggle]',
          '.accordion-header', '.collapse-toggle', '[aria-expanded]',
          '[class*="tab"]', '[class*="Tab"]', '[class*="nav"]', '[class*="Nav"]',
          '[class*="menu"]', '[class*="Menu"]', '[class*="panel"]', '[class*="Panel"]',
          '[class*="filter"]', '[class*="Filter"]', '[class*="sort"]', '[class*="Sort"]',
        ];
        const seen = new Set();
        const elements = [];
        for (const sel of selectors) {
          try {
            document.querySelectorAll(sel).forEach(el => {
              const key = el.tagName + el.textContent?.substring(0, 30) + el.className?.substring?.(0, 30);
              if (!seen.has(key) && el.offsetWidth > 0 && el.offsetHeight > 0) {
                seen.add(key);
                elements.push(el);
              }
            });
          } catch {}
        }
        // Click up to 25 unique visible elements with small delay between clicks
        elements.slice(0, 25).forEach((el, i) => {
          setTimeout(() => { try { el.click(); } catch {} }, i * 100);
        });
      });
      await waitForApiQuiet('After element clicks', 8000);
    } catch { /* silently continue */ }

    // 3. Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 1500));
    log('info', `After interaction: ${apiCalls.length} APIs captured`);

    // 4. Deep scan: additional aggressive clicking
    if (options.deepScan) {
      log('info', 'Deep scan: aggressive interaction...');
      try {
        // Click any remaining interactive elements not yet clicked
        await page.evaluate(() => {
          const all = document.querySelectorAll('a, button, [role="button"], [role="tab"], [role="menuitem"], [role="link"], details > summary');
          all.forEach((el, i) => {
            if (i < 15 && el.offsetWidth > 0 && el.offsetHeight > 0) {
              setTimeout(() => { try { el.click(); } catch {} }, i * 150);
            }
          });
        });
        await waitForApiQuiet('After deep scan', 8000);
      } catch { /* silently continue */ }
    }

    // 5. Second scroll pass — some endpoints fire only after revisiting sections
    await page.evaluate(async () => {
      window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
      await new Promise(r => setTimeout(r, 500));
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    await waitForApiQuiet('Second scroll pass', 5000);

    // 6. Final wait for any straggler requests
    await new Promise(r => setTimeout(r, 3000));
    log('info', `Final: ${apiCalls.length} APIs, ${pendingApiCount} still pending`);

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

    // ── Capture page cookies ──────────────────────────────
    let pageCookies = [];
    try {
      pageCookies = await page.cookies();
      log('info', `Captured ${pageCookies.length} page cookies`);
    } catch (e) { log('info', 'Cookie capture skipped: ' + e.message); }

    if (cdpSession) await cdpSession.detach().catch(() => {});
    await page.close().catch(() => {});
    page = null;
    cdpSession = null;

    // Remove internal marker
    delete securityHeaders._captured;

    // ── Deduplicate APIs by URL ───────────────────────────
    // Same URL captured by both request interception and CDP → keep the one with response data
    const seenUrls = new Map();
    const dedupedApis = [];
    for (const api of apiCalls) {
      const existing = seenUrls.get(api.url);
      if (!existing) {
        seenUrls.set(api.url, dedupedApis.length);
        dedupedApis.push(api);
      } else if (!dedupedApis[existing].response && api.response) {
        // Replace if existing has no response but this one does
        dedupedApis[existing] = api;
      }
    }
    // Re-assign sequential IDs
    dedupedApis.forEach((api, i) => { api.id = i + 1; });
    log('info', `Deduped: ${apiCalls.length} → ${dedupedApis.length} APIs`);

    // Build analytics
    const analytics = helpers.buildAnalytics(dedupedApis, webSocketConnections, sseConnections);

    // Optional MongoDB save
    try {
      const { getCollection, COLLECTIONS } = await import('./config/mongodb.js');
      const col = await getCollection(COLLECTIONS.SESSIONS);
      await col.insertOne({
        sessionId, url, apiCalls: dedupedApis, webSockets: webSocketConnections, sse: sseConnections,
        analytics, securityHeaders, pageInfo, pageResources,
        timestamp: new Date(), createdAt: new Date(), expiresAt: new Date(Date.now() + 3600000)
      });
    } catch (e) { log('info', 'MongoDB save skipped: ' + e.message); }

    const duration = Date.now() - startTime;
    log('info', `Scan complete: ${dedupedApis.length} APIs (${apiCalls.length} raw), ${webSocketConnections.length} WebSockets, ${sseConnections.length} SSE in ${duration}ms`);

    res.json({
      sessionId, url: landedUrl,
      totalApis: dedupedApis.length,
      totalWebSockets: webSocketConnections.length,
      totalSSE: sseConnections.length,
      apis: dedupedApis,
      webSockets: webSocketConnections,
      sse: sseConnections,
      analytics,
      securityHeaders,
      pageInfo,
      pageResources,
      pageCookies: pageCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 100), domain: c.domain, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite, expires: c.expires })),
      redirectChain,
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
