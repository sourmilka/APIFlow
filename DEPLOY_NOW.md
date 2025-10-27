# 🚀 Deploy to Vercel - Complete Guide

## ✅ Pre-Deployment Checklist

All fixes are complete:
- ✅ SSL/TLS errors fixed (environment-aware API config)
- ✅ MongoDB connection string updated
- ✅ Supabase credentials configured
- ✅ Build tested successfully
- ✅ All environment files ready

## 🎯 Deployment Steps

### Step 1: Commit Your Changes

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix: SSL/TLS errors with environment-aware API + Update credentials"

# Push to your repository
git push origin main
```

### Step 2: Configure Vercel Environment Variables

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add these variables (for Production, Preview, and Development):

```
MONGODB_URI=mongodb+srv://lemidoitforyou:lemidoitforyou@api-flow.gtblnq7.mongodb.net/apiflow?retryWrites=true&w=majority

MONGODB_DB_NAME=apiflow

VITE_SUPABASE_URL=https://guwoexkeksixsgsxgxdh.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1d29leGtla3NpeHNnc3hneGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODY5NzgsImV4cCI6MjA3NzE2Mjk3OH0.3SooppIOJOZyqfPIP45GeB0sLKbVQICmhBuTskdZ2iY

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1d29leGtla3NpeHNnc3hneGRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU4Njk3OCwiZXhwIjoyMDc3MTYyOTc4fQ.-KvBu2aFp6yv3icPE5DZ_L5RPqnVxn5IugDN2vsg6nY

NODE_ENV=production

VITE_API_URL=
```

**Important**: Leave `VITE_API_URL` empty (blank value) for production!

### Step 3: Deploy

#### Option A: Automatic Deployment (Recommended)
Vercel will automatically deploy when you push to your repository.

#### Option B: Manual Deployment via Vercel Dashboard
1. Go to **Vercel Dashboard**
2. Select your project
3. Click **"Deployments"** tab
4. Click **"Redeploy"** button on the latest deployment
5. Or click **"Deploy"** → **"Redeploy with existing Build Cache"**

#### Option C: Deploy via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 4: Verify Deployment

After deployment completes:

1. **Check Deployment Status**
   - Go to Vercel Dashboard → Deployments
   - Wait for "Ready" status (usually 2-3 minutes)

2. **Test Your Application**
   - Visit your Vercel URL
   - Try parsing a website (e.g., `https://jsonplaceholder.typicode.com/`)
   - Check browser console (F12) for errors

3. **Verify API Endpoints**
   - Test health endpoint: `https://your-app.vercel.app/api/health`
   - Should return a success response

## 🔍 Post-Deployment Verification

### Check These Items:

- [ ] App loads without errors
- [ ] No SSL/TLS errors in console
- [ ] Can parse websites successfully
- [ ] API calls go to `/api/*` (check Network tab)
- [ ] No "Failed to fetch" errors
- [ ] Session history works
- [ ] Progress tracking works

### Expected Network Requests:
```
✅ /api/parse (POST) → 200 OK
✅ /api/session/[id] (GET) → 200 OK
✅ /api/health (GET) → 200 OK
```

## 🐛 Troubleshooting

### If deployment fails:

1. **Check Build Logs**
   - Vercel Dashboard → Deployments → Click on failed deployment
   - Look for error messages in build logs

2. **Common Issues:**

   **Issue**: "Module not found"
   **Fix**: Ensure all dependencies are in `package.json`

   **Issue**: "Environment variable not set"
   **Fix**: Double-check all variables in Vercel Dashboard

   **Issue**: "Function timeout"
   **Fix**: Already configured to 60s in `vercel.json`

### If app loads but parsing fails:

1. **Check Browser Console**
   - Look for actual error messages
   - Verify API calls are going to `/api/*` not `localhost`

2. **Check Vercel Function Logs**
   - Dashboard → Your Project → Logs
   - Look for errors in serverless function execution

3. **Verify Environment Variables**
   - Dashboard → Settings → Environment Variables
   - Ensure all variables are set correctly

### If you see SSL/TLS errors:

1. **Clear browser cache**: Ctrl+Shift+R (hard refresh)
2. **Check API calls**: Should be `/api/parse` not `http://localhost:3001/api/parse`
3. **Verify build**: Make sure latest code is deployed

## 📊 Monitoring

After deployment, monitor:

1. **Vercel Analytics** (if enabled)
   - Dashboard → Analytics
   - Check for errors and performance

2. **Function Logs**
   - Dashboard → Logs
   - Monitor real-time function execution

3. **MongoDB Atlas**
   - Check connections and queries
   - Monitor database performance

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Deployment status shows "Ready"
- ✅ App loads at your Vercel URL
- ✅ Can parse websites without errors
- ✅ No console errors
- ✅ API calls work correctly
- ✅ Data is saved to MongoDB

## 📝 Next Steps After Successful Deployment

1. **Test thoroughly** with different websites
2. **Monitor logs** for any issues
3. **Set up custom domain** (optional)
4. **Enable Vercel Analytics** (optional)
5. **Share your app!** 🎊

## 🆘 Need Help?

If issues persist:
1. Check `VERCEL_SSL_FIX.md` for detailed troubleshooting
2. Review Vercel function logs
3. Verify all environment variables
4. Test locally first: `npm run dev`

---

**Your app is ready to deploy!** 🚀
Follow the steps above and your API parser will be live on Vercel!
