# SSL/TLS Error Fix - Summary

## Root Cause
The SSL/TLS error on Vercel was caused by **hardcoded localhost URLs** in the frontend code. When deployed to Vercel, the frontend was trying to connect to `http://localhost:3001/api/parse`, which doesn't exist in production, resulting in "Failed to fetch" errors that appeared as SSL/TLS issues.

## Solution
Created an environment-aware API configuration system that:
- Uses `http://localhost:3001` in development
- Uses relative URLs (empty base URL) in production, allowing calls to `/api/parse` on the same domain

## Changes Made

### New Files
1. **`src/config/api.js`** - Centralized API endpoint configuration
2. **`.env.example`** - Environment variable template
3. **`VERCEL_SSL_FIX.md`** - Detailed deployment guide

### Modified Files
1. **`src/App.jsx`** - Import and use `API_ENDPOINTS`
2. **`src/utils/realtime.js`** - Environment-aware Socket.IO connection
3. **`src/components/ProgressTracker.jsx`** - Use `API_BASE_URL`
4. **`src/components/DnsChecker.jsx`** - Use `API_ENDPOINTS.DNS_CHECK`
5. **`src/components/AdvancedParsingDialog.jsx`** - Use `API_ENDPOINTS.PARSING_PROFILES`
6. **`api/utils/chromium.js`** - Enhanced SSL certificate error handling
7. **`.env.production`** - Removed hardcoded `VITE_API_URL`

## Quick Deploy

```bash
# 1. Commit changes
git add .
git commit -m "Fix: SSL/TLS errors with environment-aware API configuration"
git push

# 2. Vercel will auto-deploy, or trigger manually in dashboard

# 3. Verify environment variables in Vercel:
# - MONGODB_URI
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - NODE_ENV=production
# - VITE_API_URL= (empty or not set)
```

## How It Works

### Before (❌ Broken)
```javascript
// Hardcoded - doesn't work on Vercel
fetch('http://localhost:3001/api/parse', { ... })
```

### After (✅ Fixed)
```javascript
// Development
fetch('http://localhost:3001/api/parse', { ... })

// Production on Vercel
fetch('/api/parse', { ... })  // Same domain, works!
```

## Testing
1. ✅ Local dev: `npm run dev` - should work as before
2. ✅ Build: `npm run build` - should complete without errors
3. ✅ Vercel: Deploy and test parsing a website
4. ✅ Check browser console - no "Failed to fetch" errors

## Expected Result
- ✅ No more SSL/TLS errors
- ✅ Parsing works on Vercel
- ✅ API calls go to `/api/*` routes
- ✅ Local development unchanged
