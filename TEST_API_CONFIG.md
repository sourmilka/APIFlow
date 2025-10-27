# Testing API Configuration

## Quick Test

### 1. Test in Browser Console (Development)
Open your app in development mode and run in console:

```javascript
// Check API configuration
import { API_BASE_URL, API_ENDPOINTS } from './src/config/api.js';
console.log('API_BASE_URL:', API_BASE_URL);
console.log('API_ENDPOINTS:', API_ENDPOINTS);

// Expected in development:
// API_BASE_URL: "http://localhost:3001"
// API_ENDPOINTS.PARSE: "http://localhost:3001/api/parse"
```

### 2. Test API Endpoint Detection
```javascript
// In browser console
console.log('Is DEV?', import.meta.env.DEV);
console.log('Hostname:', window.location.hostname);
console.log('Environment:', import.meta.env.MODE);
```

### 3. Test Actual API Call
Try parsing a simple website like `https://jsonplaceholder.typicode.com/`

Expected behavior:
- **Development**: Request goes to `http://localhost:3001/api/parse`
- **Production**: Request goes to `/api/parse` (relative URL)

### 4. Check Network Tab
1. Open DevTools → Network tab
2. Try parsing a website
3. Look for the `/api/parse` request
4. Verify:
   - ✅ Request URL is correct (localhost in dev, relative in prod)
   - ✅ Status is 200 OK
   - ✅ Response contains parsed data

## Manual Testing Checklist

### Local Development
- [ ] `npm run dev` starts successfully
- [ ] Can access app at `http://localhost:5173`
- [ ] Can parse a website
- [ ] Network requests go to `http://localhost:3001/api/*`
- [ ] No console errors

### Production Build
- [ ] `npm run build` completes successfully
- [ ] `npm run preview` works
- [ ] Can parse a website in preview mode
- [ ] No console errors

### Vercel Deployment
- [ ] Deployment succeeds
- [ ] App loads without errors
- [ ] Can parse a website
- [ ] Network requests go to `/api/*` (relative)
- [ ] No SSL/TLS errors
- [ ] No "Failed to fetch" errors

## Debugging

### If API calls fail in development:
1. Check if backend server is running: `npm run server`
2. Verify it's on port 3001
3. Check `API_BASE_URL` in console

### If API calls fail in production:
1. Check Vercel function logs
2. Verify environment variables are set
3. Check `vercel.json` configuration
4. Verify API routes are deployed as serverless functions

### Common Issues:

**Issue**: "API_BASE_URL is undefined"
**Fix**: Restart dev server after creating `src/config/api.js`

**Issue**: "Module not found: src/config/api"
**Fix**: Check file path and import statement

**Issue**: CORS errors
**Fix**: Check `vercel.json` headers configuration

**Issue**: 404 on /api/parse
**Fix**: Verify `api/parse.js` exists and is properly exported
