export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Step 1: Try importing chromium
    console.log('[test] Importing chromium...');
    const chromium = await import('@sparticuz/chromium');
    console.log('[test] Chromium imported, getting path...');
    
    // Step 2: Get executable path
    const execPath = await chromium.default.executablePath();
    console.log('[test] Exec path:', execPath);
    
    // Step 3: Try importing puppeteer
    const puppeteer = await import('puppeteer-core');
    console.log('[test] Puppeteer imported');
    
    res.json({ 
      ok: true,
      execPath,
      chromiumArgs: chromium.default.args?.length,
      puppeteerVersion: puppeteer.default?.version || 'unknown'
    });
  } catch (error) {
    console.error('[test] Error:', error.message, error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}
