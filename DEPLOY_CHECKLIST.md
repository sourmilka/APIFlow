# 🚀 APIFlow Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
- [x] MongoDB Atlas cluster created
- [x] MongoDB credentials added to `.env.production`
- [x] Supabase project created
- [x] Supabase credentials added to `.env.production`
- [ ] Test MongoDB connection locally
- [ ] Test Supabase connection locally

### 2. Code Preparation
- [x] Vercel configuration (`vercel.json`) created
- [x] Serverless API functions created in `/api` folder
- [x] Dependencies updated in `package.json`
- [x] Frontend realtime utility created
- [ ] Run `npm install` to install new dependencies
- [ ] Test build locally: `npm run build`

### 3. Git Repository
- [ ] Commit all changes: `git add .`
- [ ] Create commit: `git commit -m "Ready for Vercel deployment"`
- [ ] Push to GitHub: `git push origin main`

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Test Build Locally
```bash
npm run build
npm run preview
```

### Step 3: Push to GitHub
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

### Step 4: Deploy to Vercel

**Option A: Vercel Dashboard**
1. Go to https://vercel.com/jgero961-8734s-projects/api-flow
2. Click "Deploy" or connect your GitHub repo
3. Add environment variables (see below)
4. Click "Deploy"

**Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🔐 Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Required - Add all of these
NODE_ENV=production
MONGODB_URI=mongodb+srv://NEW_USERNAME:NEW_PASSWORD@cluster0.n1v0f5m.mongodb.net/apiflow?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=apiflow
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_API_URL=https://api-flow.vercel.app
```

**Important:** Replace placeholder values with your actual credentials from `.env.production`

---

## 📊 Post-Deployment Verification

### 1. Basic Checks
- [ ] Visit your deployment URL
- [ ] Check if homepage loads
- [ ] Open browser console - no errors
- [ ] Check Network tab - API calls work

### 2. Functionality Tests
- [ ] Try parsing a simple website (e.g., `https://jsonplaceholder.typicode.com`)
- [ ] Verify real-time progress updates appear
- [ ] Check if results are displayed
- [ ] Verify MongoDB stores the session (check Atlas dashboard)

### 3. API Endpoint Tests
- [ ] Test `/api/health` - Should return `{"status":"ok"}`
- [ ] Test `/api/parse` - Should accept POST requests
- [ ] Test `/api/session/{sessionId}` - Should retrieve sessions

### 4. Performance
- [ ] First load time < 3 seconds
- [ ] API response time < 10 seconds for simple sites
- [ ] Real-time updates arrive within 1 second

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### MongoDB Connection Error
- Verify IP whitelist includes `0.0.0.0/0` in MongoDB Atlas
- Check connection string format
- Ensure password doesn't contain special characters (or is URL-encoded)

### Supabase Not Working
- Verify URL and keys are correct
- Check browser console for CORS errors
- Ensure anon key is public (not service role key)

### Puppeteer Timeout
- Check Vercel function logs
- Increase timeout in `vercel.json` → `functions.maxDuration`
- Verify Chromium layer is installed

---

## 📈 Monitoring

### Vercel Dashboard
- Function invocations: https://vercel.com/jgero961-8734s-projects/api-flow/analytics
- Error logs: https://vercel.com/jgero961-8734s-projects/api-flow/logs
- Performance: Monitor function execution time

### MongoDB Atlas
- Monitor connections: Atlas Dashboard → Metrics
- Check storage usage
- Review slow queries

### Supabase
- API usage: Supabase Dashboard → Settings → Usage
- Real-time connections: Monitor active channels

---

## 🎯 Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod

# View deployment logs
vercel logs

# Check deployment status
vercel inspect
```

---

## 📞 Need Help?

1. Check Vercel logs: `vercel logs`
2. Check MongoDB Atlas logs
3. Check Supabase logs
4. Review browser console
5. Check Network tab for failed requests

---

## ✨ Final Notes

**Before going live:**
- [ ] Test all major features
- [ ] Check mobile responsiveness
- [ ] Verify all environment variables
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure custom domain (optional)
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up backups for MongoDB

**Your deployment URL:**
- Production: https://api-flow.vercel.app
- Preview: https://api-flow-git-[branch].vercel.app

---

## 🎉 You're Ready to Deploy!

Run these commands in order:

```bash
# 1. Install dependencies
npm install

# 2. Test build
npm run build

# 3. Commit changes
git add .
git commit -m "Production deployment ready"
git push origin main

# 4. Deploy (if using Vercel CLI)
vercel --prod
```

Or simply push to GitHub and Vercel will auto-deploy! 🚀
