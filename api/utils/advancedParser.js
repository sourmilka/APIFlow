import { getBrowser, createPage } from './chromium.js';

/**
 * Advanced Parsing Configuration for Professional API Extraction (Serverless-optimized)
 */
export class AdvancedParser {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async applyStealth(page) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      window.chrome = { runtime: {} };
      
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    await page.setUserAgent(this.getRandomUserAgent());
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    });

    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  }

  async parseWithAdvancedFeatures(url, options = {}) {
    const {
      timeout = 30000,
      waitUntil = 'networkidle2',
      retryOnError = true,
      maxRetries = 3,
      captureScreenshot = false,
      customHeaders = {},
      cookies = [],
      waitForSelector = null,
      executeScripts = [],
      blockResources = ['image', 'stylesheet', 'font', 'media']
    } = options;

    let browser = null;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`🔄 Parsing attempt ${attempt}/${maxRetries}...`);

        browser = await getBrowser();
        const page = await createPage(browser, { url, headers: customHeaders, cookies: cookies.join(';') });

        // Apply stealth techniques
        await this.applyStealth(page);

        // Block unnecessary resources
        if (blockResources.length > 0) {
          await page.setRequestInterception(true);
          page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (blockResources.includes(resourceType)) {
              request.abort();
            } else {
              request.continue();
            }
          });
        }

        const consoleLogs = [];
        const jsErrors = [];
        const apiCalls = [];
        const failedRequests = [];
        
        page.on('console', msg => {
          consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
          });
        });

        page.on('pageerror', error => {
          jsErrors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
        });

        page.on('response', async (response) => {
          const request = response.request();
          const url = request.url();
          
          const isApi = 
            url.includes('/api/') || url.includes('/v1/') || url.includes('/v2/') ||
            url.includes('/graphql') || url.includes('.json') ||
            response.headers()['content-type']?.includes('application/json');

          if (isApi) {
            try {
              const headers = response.headers();
              const status = response.status();
              let body = null;

              try {
                const text = await response.text();
                if (text) {
                  try { body = JSON.parse(text); } 
                  catch { body = text; }
                }
              } catch (err) {
                console.log(`Could not read response body for ${url}`);
              }

              apiCalls.push({
                url,
                method: request.method(),
                status,
                statusText: response.statusText(),
                headers,
                requestHeaders: request.headers(),
                requestPayload: request.postData(),
                response: body,
                timestamp: new Date().toISOString()
              });
            } catch (err) {
              console.error(`Error processing response for ${url}:`, err.message);
            }
          }
        });

        page.on('requestfailed', (request) => {
          failedRequests.push({
            url: request.url(),
            method: request.method(),
            failure: request.failure()?.errorText,
            timestamp: new Date().toISOString()
          });
        });

        console.log(`🌐 Navigating to ${url}...`);
        const response = await page.goto(url, { waitUntil, timeout });

        if (waitForSelector) {
          await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {
            console.log(`⚠️ Selector ${waitForSelector} not found`);
          });
        }

        for (const script of executeScripts) {
          try { await page.evaluate(script); } 
          catch (err) { console.log(`⚠️ Script failed: ${err.message}`); }
        }

        await page.waitForTimeout(2000);

        let screenshot = null;
        if (captureScreenshot) {
          try {
            screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
          } catch (err) {
            console.log(`⚠️ Could not capture screenshot: ${err.message}`);
          }
        }

        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            meta: {
              description: document.querySelector('meta[name="description"]')?.content,
              keywords: document.querySelector('meta[name="keywords"]')?.content
            }
          };
        });

        console.log(`✅ Successfully parsed ${url}`);
        console.log(`📊 Captured ${apiCalls.length} API calls`);

        return {
          success: true,
          url,
          pageInfo,
          apis: apiCalls,
          failedRequests,
          consoleLogs,
          jsErrors,
          screenshot,
          metadata: {
            attempt,
            timestamp: new Date().toISOString()
          }
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries && retryOnError) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      url,
      error: {
        message: lastError?.message || 'Unknown error',
        stack: lastError?.stack,
        attempts: attempt
      },
      apis: [],
      metadata: { timestamp: new Date().toISOString() }
    };
  }
}

export default AdvancedParser;
