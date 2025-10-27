# Vercel SSL/TLS Error Fix

## Problem
The application was showing SSL/TLS errors on Vercel because:
1. Frontend was hardcoded to call `http://localhost:3001` which doesn't exist in production
2. API endpoints were not environment-aware

## Solution Applied

### 1. Created Environment-Aware API Configuration
**File: `src/config/api.js`**
- Detects if running in development or production
- Uses `localhost:3001` for local development
- Uses relative URLs (empty string) for production on Vercel
- This allows the frontend to call `/api/*` routes on the same domain

### 2. Updated All Components
Updated the following files to use the new API configuration:
- ✅ `src/App.jsx` - Main parsing logic
- ✅ `src/utils/realtime.js` - Socket.IO connections
- ✅ `src/components/ProgressTracker.jsx` - Progress updates
- ✅ `src/components/DnsChecker.jsx` - DNS checking
- ✅ `src/components/AdvancedParsingDialog.jsx` - Advanced parsing

### 3. Enhanced Chromium SSL Handling
**File: `api/utils/chromium.js`**
Added additional flags for better SSL/TLS handling:
- `--ignore-certificate-errors`
- `--ignore-certificate-errors-spki-list`
- `--disable-gpu`

### 4. Environment Variables
**File: `.env.production`**
- Set `VITE_API_URL=` (empty) to use relative URLs in production

## How It Works

### Development (localhost)
```javascript
// API calls go to: http://localhost:3001/api/parse
const API_BASE_URL = 'http://localhost:3001';
```

### Production (Vercel)
```javascript
// API calls go to: /api/parse (same domain)
const API_BASE_URL = '';
```

## Deployment Steps

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Fix: SSL/TLS errors by using environment-aware API endpoints"
   git push
   ```

2. **Verify Vercel Environment Variables:**
   Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   
   Ensure these are set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `VITE_SUPABASE_URL` - Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `NODE_ENV=production`
   - `VITE_API_URL=` (leave empty or don't set it)

3. **Redeploy:**
   - Vercel will automatically redeploy on push
   - Or manually trigger a redeploy in Vercel Dashboard

4. **Test:**
   - Visit your Vercel URL
   - Try parsing a website
   - Check browser console for any errors

## Troubleshooting

### If you still see SSL errors:

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for failed network requests
   - Verify API calls are going to `/api/*` not `localhost:3001`

2. **Verify Vercel Functions:**
   - Check Vercel Dashboard → Deployments → Functions
   - Ensure `api/parse.js` is deployed as a serverless function

3. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Logs
   - Look for errors in the serverless function execution

4. **Test API endpoint directly:**
   ```
   https://your-app.vercel.app/api/health
   ```
   Should return a health check response

### Common Issues:

**Issue:** "Failed to fetch" error
**Solution:** Ensure CORS headers are set in `vercel.json` and API functions

**Issue:** API returns 404
**Solution:** Check that `api/` folder structure matches Vercel's serverless function requirements

**Issue:** Timeout errors
**Solution:** Increase `maxDuration` in `vercel.json` functions config (currently 60s)

## Files Modified

1. `src/config/api.js` - NEW FILE
2. `src/App.jsx` - Updated API calls
3. `src/utils/realtime.js` - Updated Socket.IO connection
4. `src/components/ProgressTracker.jsx` - Updated API calls
5. `src/components/DnsChecker.jsx` - Updated API calls
6. `src/components/AdvancedParsingDialog.jsx` - Updated API calls
7. `api/utils/chromium.js` - Enhanced SSL handling
8. `.env.production` - Removed hardcoded API URL
9. `.env.example` - NEW FILE for documentation

## Testing Checklist

- [ ] Local development still works (`npm run dev`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Vercel deployment succeeds
- [ ] Can parse websites on Vercel
- [ ] No SSL/TLS errors in browser console
- [ ] API calls go to correct endpoints
- [ ] Progress tracking works
- [ ] Session history works

## Support

If issues persist:
1. Check all environment variables are set correctly in Vercel
2. Verify MongoDB connection string is correct
3. Check Vercel function logs for backend errors
4. Ensure Chromium layer is properly configured for Vercel
