# 🚀 Professional Vercel Deployment Guide

**Repository**: https://github.com/sourmilka/APIFlow  
**Target Vercel Project**: https://vercel.com/jgero961-8734s-projects/api-flow

---

## ⚡ Quick Deploy (3 Minutes)

### Step 1: Import Project to Vercel

1. **Go to**: https://vercel.com/new
2. **Or directly to**: https://vercel.com/jgero961-8734s-projects/api-flow
3. Click **"Import Project"** or **"Add New..."** → **"Project"**
4. Select **"Import Git Repository"**
5. Search for: **`sourmilka/APIFlow`**
6. Click **"Import"**

### Step 2: Configure Project Settings

**Framework Preset**: Vite  
**Root Directory**: `./` (leave as default)  
**Build Command**: `vite build`  
**Output Directory**: `dist`  
**Install Command**: `npm install`

✅ Vercel will auto-detect these settings!

### Step 3: Add Environment Variables (CRITICAL)

Click **"Environment Variables"** tab and add these:

---

## 🔐 Environment Variables to Add

Copy these values from your `.env.production` file:

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://NEW_USERNAME:NEW_PASSWORD@cluster0.n1v0f5m.mongodb.net/apiflow?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=apiflow

# Supabase Configuration (Frontend - must start with VITE_)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Supabase Backend (Service Role)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# Application URL
VITE_API_URL=https://api-flow.vercel.app
```

### How to Add Each Variable

For **each variable above**:

1. **Name**: Enter the variable name (e.g., `NODE_ENV`)
2. **Value**: Paste the actual value from your `.env.production`
3. **Environment**: Select **"Production"**, **"Preview"**, and **"Development"**
4. Click **"Add"**

⚠️ **IMPORTANT**: 
- Replace `NEW_USERNAME`, `NEW_PASSWORD` with your actual MongoDB credentials
- Replace Supabase URLs and keys with your actual values
- Don't include quotes around values
- Make sure `VITE_` prefix is present for frontend variables

---

## 📋 Detailed Variable Guide

### 1. NODE_ENV
```
Name: NODE_ENV
Value: production
Environment: Production, Preview
```

### 2. MONGODB_URI
```
Name: MONGODB_URI
Value: mongodb+srv://USERNAME:PASSWORD@cluster0.n1v0f5m.mongodb.net/apiflow?retryWrites=true&w=majority&appName=Cluster0
Environment: Production, Preview, Development
```
⚠️ Replace USERNAME and PASSWORD with your actual MongoDB Atlas credentials

### 3. MONGODB_DB_NAME
```
Name: MONGODB_DB_NAME
Value: apiflow
Environment: Production, Preview, Development
```

### 4. VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://xxxxx.supabase.co
Environment: Production, Preview, Development
```
📍 Find in: Supabase Dashboard → Settings → API → Project URL

### 5. VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```
📍 Find in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### 6. SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```
⚠️ **SECRET!** Find in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

### 7. VITE_API_URL
```
Name: VITE_API_URL
Value: https://api-flow.vercel.app
Environment: Production
```
📝 This will be your actual Vercel deployment URL

---

## 🎯 Step 4: Deploy

1. After adding all environment variables
2. Click **"Deploy"**
3. Wait 2-3 minutes ⏱️
4. ✅ **DEPLOYMENT COMPLETE!**

Your app will be live at: **https://api-flow.vercel.app**

---

## 📊 Post-Deployment Checklist

### Immediate Tests (First 5 Minutes)

- [ ] Visit: https://api-flow.vercel.app
- [ ] Homepage loads without errors
- [ ] Open Browser Console (F12) - no errors
- [ ] Try parsing: `https://jsonplaceholder.typicode.com`
- [ ] APIs are detected and displayed
- [ ] Real-time progress updates appear
- [ ] Results can be exported

### API Endpoint Tests

- [ ] Visit: https://api-flow.vercel.app/api/health
  - Should return: `{"status":"ok",...}`
- [ ] Test parsing endpoint works
- [ ] Check session storage in MongoDB Atlas

### Database Checks

- [ ] **MongoDB Atlas**: Check connections in dashboard
- [ ] **Supabase**: Check API requests in dashboard
- [ ] Verify sessions are being stored

---

## 🐛 Troubleshooting

### Build Failed
**Symptoms**: Deployment fails during build  
**Solutions**:
1. Check build logs in Vercel
2. Verify all dependencies in `package.json`
3. Try: Settings → General → Node.js Version → 18.x
4. Redeploy

### Environment Variables Not Working
**Symptoms**: App loads but features don't work  
**Solutions**:
1. Double-check all variable names (case-sensitive!)
2. Ensure `VITE_` prefix for frontend variables
3. Check for extra spaces in values
4. Redeploy after fixing variables

### MongoDB Connection Error
**Symptoms**: "Cannot connect to MongoDB"  
**Solutions**:
1. Check `MONGODB_URI` format is correct
2. MongoDB Atlas → Network Access → Add `0.0.0.0/0`
3. Verify username/password don't have special characters
4. Try URL-encoding the password

### Supabase Not Working
**Symptoms**: No real-time updates  
**Solutions**:
1. Verify `VITE_SUPABASE_URL` is correct
2. Check `VITE_SUPABASE_ANON_KEY` (public key, not service role)
3. Supabase Dashboard → check if project is active
4. Check browser console for CORS errors

### Function Timeout
**Symptoms**: "Function execution timed out"  
**Solutions**:
1. Normal for first request (cold start) - retry
2. Try a simpler website first
3. Check Vercel function logs
4. Timeout increases after initial cold start

### APIs Not Being Detected
**Symptoms**: Parsing completes but 0 APIs found  
**Solutions**:
1. Try different websites
2. Check if website blocks automation
3. Try: `https://jsonplaceholder.typicode.com` (guaranteed to work)
4. Check Vercel logs for errors

---

## 📈 Monitoring & Performance

### Vercel Dashboard
- **Functions**: Monitor serverless function invocations
- **Logs**: Real-time logs for debugging
- **Analytics**: Traffic and performance metrics
- **Deployments**: Rollback if needed

### MongoDB Atlas
- **Metrics**: Database performance
- **Connections**: Active connections count
- **Storage**: Database size
- **Alerts**: Set up usage alerts

### Supabase Dashboard
- **API**: Request count and errors
- **Database**: Table usage (if used)
- **Auth**: User activity (if implemented)
- **Logs**: Real-time query logs

---

## 🔄 Redeployment

To redeploy after making changes:

```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```

Vercel will automatically rebuild and deploy! 🚀

---

## 🎨 Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Click **"Add"**
3. Enter your domain: `apiflow.com`
4. Follow DNS configuration instructions
5. Update `VITE_API_URL` environment variable

---

## 💰 Usage & Costs

### Free Tier Limits

**Vercel (Hobby)**:
- ✅ 100 GB bandwidth/month
- ✅ 100 hours function execution/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS

**MongoDB Atlas (M0)**:
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Up to 100 connections

**Supabase (Free)**:
- ✅ 500 MB database
- ✅ 50 GB bandwidth
- ✅ Unlimited API requests
- ✅ Unlimited realtime connections

### When to Upgrade

- Traffic exceeds 100 GB/month → Vercel Pro ($20/mo)
- Database exceeds 512 MB → MongoDB M10 (~$57/mo)
- Need more performance → Upgrade any service

---

## 📞 Support Resources

### Documentation
- **This Project**: See `DEPLOYMENT.md`
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Docs**: https://docs.atlas.mongodb.com/
- **Supabase Docs**: https://supabase.com/docs

### Dashboards
- **Vercel**: https://vercel.com/jgero961-8734s-projects/api-flow
- **MongoDB**: https://cloud.mongodb.com/
- **Supabase**: https://supabase.com/dashboard
- **GitHub**: https://github.com/sourmilka/APIFlow

### Quick Links
- **Live Site**: https://api-flow.vercel.app
- **API Health**: https://api-flow.vercel.app/api/health
- **Repository**: https://github.com/sourmilka/APIFlow

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables added in Vercel
- [ ] MongoDB Atlas IP whitelist configured (`0.0.0.0/0`)
- [ ] Supabase project is active
- [ ] Build completed successfully
- [ ] Homepage loads without errors
- [ ] Can parse test website
- [ ] Real-time updates work
- [ ] API endpoints respond
- [ ] Sessions stored in MongoDB
- [ ] No console errors

---

## 🎉 You're Live!

**Production URL**: https://api-flow.vercel.app  
**Repository**: https://github.com/sourmilka/APIFlow  
**Status**: Ready to Deploy ✅

### Next Deploy Command:
```bash
git add .
git commit -m "Update"
git push origin main
```

Vercel auto-deploys on push! 🚀

---

**Professional Deployment Complete** ✨  
Generated by Cascade AI | Oct 27, 2025
