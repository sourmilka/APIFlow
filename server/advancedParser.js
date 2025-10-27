import puppeteer from 'puppeteer';

/**
 * Advanced Parsing Configuration for Professional API Extraction
 */
export class AdvancedParser {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
  }

  /**
   * Get random user agent to avoid detection
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Launch browser with anti-detection measures
   */
  async launchBrowser(options = {}) {
    const {
      proxy = null,
      headless = true,
      bypassCSP = true,
      stealth = true
    } = options;

    const launchOptions = {
      headless: headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=AudioServiceOutOfProcess',
        '--ignore-certificate-errors',
        '--allow-running-insecure-content',
        '--disable-site-isolation-trials'
      ]
    };

    // Add proxy if provided
    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy}`);
    }

    // Bypass CSP to handle strict security policies
    if (bypassCSP) {
      launchOptions.args.push('--disable-features=IsolateOrigins', '--disable-site-isolation-trials');
    }

    const browser = await puppeteer.launch(launchOptions);
    
    // Apply stealth techniques if enabled
    if (stealth) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await this.applyStealth(pages[0]);
      }
    }

    return browser;
  }

  /**
   * Apply stealth techniques to avoid bot detection
   */
  async applyStealth(page) {
    // Override navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Chrome runtime
      window.chrome = {
        runtime: {},
      };

      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // Set random user agent
    await page.setUserAgent(this.getRandomUserAgent());

    // Set extra headers
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

    // Set viewport to common resolution
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
  }

  /**
   * Parse website with advanced error handling
   */
  async parseWithAdvancedFeatures(url, options = {}) {
    const {
      timeout = 30000,
      waitUntil = 'networkidle2',
      retryOnError = true,
      maxRetries = 3,
      captureScreenshot = true,
      bypassCSP = true,
      proxy = null,
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

        // Launch browser with advanced options
        browser = await this.launchBrowser({ proxy, bypassCSP });
        const page = await browser.newPage();

        // Block unnecessary resources to speed up loading
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

        // Set custom headers
        if (Object.keys(customHeaders).length > 0) {
          await page.setExtraHTTPHeaders(customHeaders);
        }

        // Set cookies
        if (cookies.length > 0) {
          await page.setCookie(...cookies);
        }

        // Capture console logs and errors
        const consoleLogs = [];
        const jsErrors = [];
        
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

        // Intercept network requests to capture APIs
        const apiCalls = [];
        const failedRequests = [];

        page.on('response', async (response) => {
          const request = response.request();
          const url = request.url();
          
          // Filter API calls (JSON, XML, or API endpoints)
          const isApi = 
            url.includes('/api/') ||
            url.includes('/v1/') ||
            url.includes('/v2/') ||
            url.includes('/graphql') ||
            url.includes('.json') ||
            response.headers()['content-type']?.includes('application/json') ||
            response.headers()['content-type']?.includes('application/xml');

          if (isApi) {
            try {
              const headers = response.headers();
              const status = response.status();
              let body = null;

              try {
                const text = await response.text();
                if (text) {
                  try {
                    body = JSON.parse(text);
                  } catch {
                    body = text;
                  }
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
                timestamp: new Date().toISOString(),
                timing: response.timing()
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

        // Navigate to the page
        console.log(`🌐 Navigating to ${url}...`);
        const response = await page.goto(url, {
          waitUntil,
          timeout
        });

        // Wait for additional selector if specified
        if (waitForSelector) {
          console.log(`⏳ Waiting for selector: ${waitForSelector}`);
          await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {
            console.log(`⚠️ Selector ${waitForSelector} not found, continuing...`);
          });
        }

        // Execute custom scripts
        for (const script of executeScripts) {
          try {
            await page.evaluate(script);
          } catch (err) {
            console.log(`⚠️ Failed to execute script: ${err.message}`);
          }
        }

        // Wait a bit more for dynamic content
        await page.waitForTimeout(2000);

        // Capture screenshot if enabled
        let screenshot = null;
        if (captureScreenshot) {
          try {
            screenshot = await page.screenshot({
              encoding: 'base64',
              fullPage: false
            });
          } catch (err) {
            console.log(`⚠️ Could not capture screenshot: ${err.message}`);
          }
        }

        // Get page title and meta info
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            meta: {
              description: document.querySelector('meta[name="description"]')?.content,
              keywords: document.querySelector('meta[name="keywords"]')?.content,
              og: {
                title: document.querySelector('meta[property="og:title"]')?.content,
                description: document.querySelector('meta[property="og:description"]')?.content,
                image: document.querySelector('meta[property="og:image"]')?.content
              }
            }
          };
        });

        await browser.close();

        console.log(`✅ Successfully parsed ${url}`);
        console.log(`📊 Captured ${apiCalls.length} API calls`);
        console.log(`⚠️ ${failedRequests.length} failed requests`);
        console.log(`📝 ${consoleLogs.length} console logs`);
        console.log(`❌ ${jsErrors.length} JavaScript errors`);

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
            timestamp: new Date().toISOString(),
            loadTime: response?.timing?.()?.responseEnd || null
          }
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (browser) {
          await browser.close().catch(() => {});
        }

        if (attempt < maxRetries && retryOnError) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      url,
      error: {
        message: lastError?.message || 'Unknown error',
        stack: lastError?.stack,
        attempts: attempt
      },
      apis: [],
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Parse website with proxy rotation
   */
  async parseWithProxyRotation(url, proxies, options = {}) {
    for (const proxy of proxies) {
      console.log(`🔄 Trying with proxy: ${proxy}`);
      const result = await this.parseWithAdvancedFeatures(url, {
        ...options,
        proxy,
        maxRetries: 1
      });

      if (result.success) {
        return result;
      }
    }

    // Try without proxy as last resort
    console.log(`🔄 All proxies failed, trying without proxy...`);
    return await this.parseWithAdvancedFeatures(url, {
      ...options,
      proxy: null
    });
  }
}

export default AdvancedParser;
