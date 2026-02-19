export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('[test2] Importing helpers...');
    const helpers = await import('./utils/helpers.js');
    console.log('[test2] Helpers imported:', Object.keys(helpers));
    
    console.log('[test2] Importing chromium utils...');
    const chromUtils = await import('./utils/chromium.js');
    console.log('[test2] Chromium utils imported:', Object.keys(chromUtils));
    
    res.json({ 
      ok: true,
      helpers: Object.keys(helpers),
      chromUtils: Object.keys(chromUtils)
    });
  } catch (error) {
    console.error('[test2] Error:', error.message, error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}
