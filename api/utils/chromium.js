import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

let browserPromise = null;

export async function getBrowser() {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      if (browser.isConnected()) return browser;
      console.log('[chromium] Stale browser, reconnecting...');
    } catch (e) {
      console.log('[chromium] Browser promise rejected:', e.message);
    }
    browserPromise = null;
  }

  console.log('[chromium] Launching new browser...');
  browserPromise = (async () => {
    const executablePath = await chromium.executablePath();
    console.log('[chromium] Executable path:', executablePath);
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--disable-features=site-per-process'],
      defaultViewport: { width: 1440, height: 900 },
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    console.log('[chromium] Browser launched successfully');
    return browser;
  })();

  return browserPromise;
}

export async function createPage(browser, options = {}) {
  const page = await browser.newPage();

  // Set realistic user agent
  await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');

  // Accept language and other headers that real browsers send
  const defaultHeaders = {
    'accept-language': 'en-US,en;q=0.9',
    'sec-ch-ua': '"Google Chrome";v="145", "Not:A-Brand";v="99", "Chromium";v="145"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  };
  await page.setExtraHTTPHeaders({ ...defaultHeaders, ...(options.headers || {}) });

  // Disable service workers to avoid caching issues on SPAs
  await page.evaluateOnNewDocument(() => {
    // Prevent service worker registration so fresh API calls are intercepted
    if (navigator.serviceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        get: () => ({ register: () => Promise.resolve(), ready: Promise.resolve() })
      });
    }
  });

  // Handle cookies — supports Cookie Editor format or string
  if (options.cookies) {
    try {
      if (Array.isArray(options.cookies)) {
        const validCookies = options.cookies.filter(c => c.name && c.value).map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain || new URL(options.url).hostname,
          path: c.path || '/',
          httpOnly: !!c.httpOnly,
          secure: !!c.secure,
          sameSite: c.sameSite || 'Lax',
          ...(c.expires ? { expires: c.expires } : {})
        }));
        if (validCookies.length > 0) {
          await page.setCookie(...validCookies);
          console.log(`[chromium] Set ${validCookies.length} cookies`);
        }
      } else if (typeof options.cookies === 'string') {
        const cookieArray = options.cookies.split(';').map(c => {
          const [name, ...valueParts] = c.trim().split('=');
          return { name: name?.trim(), value: valueParts.join('=')?.trim(), domain: new URL(options.url).hostname };
        }).filter(c => c.name && c.value);
        if (cookieArray.length > 0) {
          await page.setCookie(...cookieArray);
          console.log(`[chromium] Set ${cookieArray.length} cookies (string format)`);
        }
      }
    } catch (e) {
      console.log('[chromium] Cookie error:', e.message);
    }
  }
  return page;
}
