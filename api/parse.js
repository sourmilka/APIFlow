import { getBrowser, createPage } from './utils/chromium.js';
import { detectAuthentication, explainAPI, parseGraphQL, parseRateLimitHeaders } from './utils/helpers.js';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, customHeaders, cookies, userAgent } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL', message: 'Enter a valid public URL (http:// or https://)' });

  const sessionId = Date.now().toString();
  const apiCalls = [];
  const webSocketConnections = [];
  let page = null;
  const startTime = Date.now();
  console.log(`[parse] Start: ${url} (${sessionId})`);

  try {
    const browser = await getBrowser();
    page = await createPage(browser, { url, userAgent, headers: customHeaders, cookies });
    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const reqUrl = request.url();
      const method = request.method();
      const headers = request.headers();
      const postData = request.postData();
      const resourceType = request.resourceType();
      const isApiCall = resourceType === 'xhr' || resourceType === 'fetch' ||
        reqUrl.includes('/api/') || reqUrl.includes('/v1/') || reqUrl.includes('/v2/') ||
        reqUrl.includes('/v3/') || reqUrl.includes('/graphql') ||
        headers['content-type']?.includes('application/json') ||
        headers['accept']?.includes('application/json');

      if (isApiCall) {
        apiCalls.push({
          id: apiCalls.length + 1, url: reqUrl, method, headers,
          payload: postData || null, type: resourceType,
          timestamp: new Date().toISOString(), startTime: Date.now(),
          authentication: detectAuthentication(headers),
          explanations: explainAPI(reqUrl, method, headers, postData),
          graphql: reqUrl.includes('graphql') ? parseGraphQL(postData) : null
        });
      }
      request.continue();
    });

    page.on('response', async (response) => {
      const respUrl = response.url();
      const status = response.status();
      const headers = response.headers();
      const rateLimitInfo = parseRateLimitHeaders(headers);
      const apiCall = apiCalls.find(c => c.url === respUrl && !c.response);
      if (!apiCall) return;
      try {
        const ct = headers['content-type'] || '';
        let data = null;
        const responseTime = Date.now() - apiCall.startTime;
        if (ct.includes('application/json')) data = await response.json().catch(() => null);
        else if (ct.includes('text')) { const t = await response.text().catch(() => ''); data = t?.substring(0, 5000); }
        apiCall.response = { status, statusText: response.statusText(), headers, data, size: headers['content-length'] || 'unknown', responseTime, rateLimit: rateLimitInfo };
        delete apiCall.startTime;
      } catch {
        apiCall.response = { status, statusText: response.statusText(), headers, error: 'Could not parse', size: headers['content-length'] || 'unknown', responseTime: Date.now() - apiCall.startTime, rateLimit: rateLimitInfo };
        delete apiCall.startTime;
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.close().catch(() => {});
    page = null;

    // Optional MongoDB save
    try {
      const { getCollection, COLLECTIONS } = await import('./config/mongodb.js');
      const col = await getCollection(COLLECTIONS.SESSIONS);
      await col.insertOne({ sessionId, url, apiCalls, webSockets: webSocketConnections, timestamp: new Date(), createdAt: new Date(), expiresAt: new Date(Date.now() + 3600000) });
    } catch { /* MongoDB not available or failed */ }

    const duration = Date.now() - startTime;
    console.log(`[parse] Done: ${apiCalls.length} APIs in ${duration}ms`);
    res.json({ sessionId, url, totalApis: apiCalls.length, totalWebSockets: webSocketConnections.length, apis: apiCalls, webSockets: webSocketConnections, duration });
  } catch (error) {
    if (page) await page.close().catch(() => {});
    const duration = Date.now() - startTime;
    console.error(`[parse] Error (${duration}ms):`, error.message);
    const isTimeout = error.message?.includes('timeout') || error.message?.includes('Timeout');
    res.status(isTimeout ? 504 : 500).json({
      error: 'Parsing failed',
      message: isTimeout ? 'Website took too long to load. Try a simpler page.' : error.message,
      sessionId, duration
    });
  }
}
