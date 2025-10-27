import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

let browserPromise = null;

export async function getBrowser() {
  if (browserPromise) {
    return browserPromise;
  }

  browserPromise = (async () => {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Local development - use local Chromium
      return await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
      });
    }

    // Production - use Vercel's Chromium layer
    const executablePath = await chromium.executablePath('/tmp/chromium');
    
    return await puppeteer.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  })();

  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

// Create a new page with standard configuration
export async function createPage(browser, options = {}) {
  const page = await browser.newPage();

  const userAgent = options.userAgent || 
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  await page.setUserAgent(userAgent);

  if (options.headers) {
    await page.setExtraHTTPHeaders(options.headers);
  }

  if (options.cookies) {
    const cookieArray = options.cookies.split(';').map(c => {
      const [name, value] = c.trim().split('=');
      return { name, value, domain: new URL(options.url).hostname };
    });
    await page.setCookie(...cookieArray);
  }

  return page;
}
