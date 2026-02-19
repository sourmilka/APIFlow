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
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
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
  await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  if (options.headers) await page.setExtraHTTPHeaders(options.headers);

  // Handle cookies - supports Cookie Editor format (array of objects) or simple string
  if (options.cookies) {
    try {
      if (Array.isArray(options.cookies)) {
        // Cookie Editor format: [{name, value, domain, path, httpOnly, secure, sameSite, expires}]
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
        // Simple "name=value; name=value" format
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
