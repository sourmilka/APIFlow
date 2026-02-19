export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('[test] Step 1: Importing...');
    const { getBrowser, createPage } = await import('./utils/chromium.js');
    
    console.log('[test] Step 2: Getting browser...');
    const browser = await getBrowser();
    console.log('[test] Step 3: Browser connected:', browser.isConnected());
    
    console.log('[test] Step 4: Creating page...');
    const page = await createPage(browser, { url: 'https://example.com' });
    console.log('[test] Step 5: Page created');
    
    console.log('[test] Step 6: Setting request interception...');
    await page.setRequestInterception(true);
    page.on('request', r => r.continue());
    
    console.log('[test] Step 7: Navigating...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('[test] Step 8: Page loaded');
    
    const title = await page.title();
    console.log('[test] Step 9: Title:', title);
    
    await page.close();
    console.log('[test] Step 10: Page closed');
    
    res.json({ ok: true, title });
  } catch (error) {
    console.error('[test] Error:', error.message, error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 8)
    });
  }
}
