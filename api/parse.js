import { getBrowser, createPage } from './utils/chromium.js';
import { getCollection, COLLECTIONS } from './config/mongodb.js';
import { sendRealtimeUpdate, REALTIME_CHANNELS } from './config/supabase.js';
import { detectAuthentication, explainAPI, parseGraphQL, parseRateLimitHeaders } from './utils/helpers.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, customHeaders, cookies, userAgent } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const sessionId = Date.now().toString();
  const apiCalls = [];
  const webSocketConnections = [];
  let browser = null;

  try {
    // Send progress update via Supabase Realtime
    await sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_PROGRESS, 'progress', {
      sessionId,
      status: 'starting',
      message: 'Launching browser...'
    });

    browser = await getBrowser();
    const page = await createPage(browser, {
      url,
      userAgent,
      headers: customHeaders,
      cookies
    });

    await sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_PROGRESS, 'progress', {
      sessionId,
      status: 'browser-ready',
      message: 'Browser ready, setting up interceptors...'
    });

    // Enable request interception
    await page.setRequestInterception(true);

    // Intercept all requests
    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const headers = request.headers();
      const postData = request.postData();
      const resourceType = request.resourceType();

      const isApiCall =
        resourceType === 'xhr' ||
        resourceType === 'fetch' ||
        url.includes('/api/') ||
        url.includes('/v1/') ||
        url.includes('/v2/') ||
        url.includes('/graphql') ||
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
          authentication,
          explanations,
          graphql
        });

        sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_PROGRESS, 'api-detected', {
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

      const rateLimitInfo = parseRateLimitHeaders(headers);
      const apiCall = apiCalls.find(call => call.url === url && !call.response);

      if (apiCall) {
        try {
          const contentType = headers['content-type'] || '';
          let responseData = null;
          const responseTime = Date.now() - apiCall.startTime;

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
            responseTime,
            rateLimit: rateLimitInfo
          };

          delete apiCall.startTime;
        } catch (error) {
          const responseTime = Date.now() - apiCall.startTime;
          apiCall.response = {
            status,
            statusText: response.statusText(),
            headers,
            error: 'Could not parse response',
            size: headers['content-length'] || 'unknown',
            responseTime,
            rateLimit: rateLimitInfo
          };
          delete apiCall.startTime;
        }
      }
    });

    console.log(`Parsing: ${url}`);
    await sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_PROGRESS, 'progress', {
      sessionId,
      status: 'loading',
      message: 'Loading website...'
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 45000
    });

    await sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_PROGRESS, 'progress', {
      sessionId,
      status: 'scrolling',
      message: 'Scrolling to load lazy content...'
    });

    await page.waitForTimeout(3000);

    // Scroll to trigger lazy-loaded content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    await sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_PROGRESS, 'progress', {
      sessionId,
      status: 'finalizing',
      message: 'Collecting results...'
    });

    // Store session in MongoDB
    const sessionsCollection = await getCollection(COLLECTIONS.SESSIONS);
    await sessionsCollection.insertOne({
      sessionId,
      url,
      apiCalls,
      webSockets: webSocketConnections,
      timestamp: new Date(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });

    await sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_PROGRESS, 'progress', {
      sessionId,
      status: 'complete',
      message: 'Parsing complete!'
    });

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

    await sendRealtimeUpdate(REALTIME_CHANNELS.PARSING_ERROR, 'error', {
      sessionId,
      error: error.message,
      message: `Error: ${error.message}`
    });

    res.status(500).json({
      error: 'Parsing failed',
      message: error.message,
      sessionId
    });
  }
}
