import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

let browserPromise = null;

export async function getBrowser() {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      if (browser.isConnected()) return browser;
    } catch { /* stale browser */ }
    browserPromise = null;
  }

  browserPromise = (async () => {
    const executablePath = await chromium.executablePath('/tmp/chromium');
    return await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--ignore-certificate-errors', '--disable-gpu', '--single-process', '--no-zygote'],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
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
