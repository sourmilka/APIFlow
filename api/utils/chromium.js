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
  if (options.cookies) {
    try {
      const cookieArray = options.cookies.split(';').map(c => {
        const [name, value] = c.trim().split('=');
        return { name, value, domain: new URL(options.url).hostname };
      });
      await page.setCookie(...cookieArray);
    } catch { /* invalid cookies */ }
  }
  return page;
}
