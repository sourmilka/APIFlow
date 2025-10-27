# 🚀 APIFlow Professional Deployment Guide

## Complete step-by-step guide to deploy APIFlow to Vercel with Supabase and MongoDB

---

## 📋 Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register)
- [Supabase Account](https://supabase.com/dashboard)
- [GitHub Account](https://github.com/join)

---

## 🎯 Architecture Overview

**Frontend**: React + Vite (Static Site)  
**Backend**: Vercel Serverless Functions  
**Database**: MongoDB Atlas  
**Realtime**: Supabase Realtime  
**Browser Automation**: Puppeteer + Chromium Layer  

---

## 📦 Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Build a Database"**
3. Choose **M0 Free Tier** (or higher based on needs)
4. Select **AWS** as cloud provider
5. Choose region closest to your users
6. Click **"Create Cluster"**

### 1.2 Create Database User

1. In **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Create username and secure password
5. Set **Built-in Role** to **"Read and write to any database"**
6. Click **"Add User"**

### 1.3 Configure Network Access

1. In **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Vercel serverless)
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select **"Node.js"** and version **6.0 or later**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<database>` with `apiflow`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/apiflow?retryWrites=true&w=majority
```

---

## 🔥 Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Enter project name: **`apiflow`**
4. Enter a strong database password
5. Choose region closest to your users
6. Click **"Create new project"**

### 2.2 Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public** key
   - **service_role** key (keep this secret!)

### 2.3 Enable Realtime (Optional)

1. Go to **Database** → **Replication**
2. Enable Realtime for any tables you create
3. Or use **Broadcast** feature (no database tables needed)

---

## ⚡ Step 3: Vercel Deployment

### 3.1 Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - APIFlow deployment ready"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/apiflow.git
git branch -M main
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select **"api-flow"** as the project (or your existing project)
5. Configure the following:

#### Framework Preset
- **Framework**: Vite
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Configure Environment Variables

Click **"Environment Variables"** and add the following:

| Name | Value | Environment |
|------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `MONGODB_URI` | Your MongoDB connection string | Production, Preview |
| `MONGODB_DB_NAME` | `apiflow` | Production, Preview |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview |
| `VITE_API_URL` | `https://api-flow.vercel.app` | Production |

**⚠️ Important**: Replace `api-flow.vercel.app` with your actual Vercel domain

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

---

## 🔧 Step 4: Post-Deployment Configuration

### 4.1 Update Frontend API URL

After deployment, update your frontend to use the production API:

1. The `VITE_API_URL` is already set in environment variables
2. Your frontend will automatically use this in production

### 4.2 Test the Deployment

1. Visit your deployed URL
2. Try parsing a website (e.g., `https://jsonplaceholder.typicode.com`)
3. Check browser console for any errors
4. Verify MongoDB is storing sessions
5. Check Supabase realtime updates

### 4.3 Configure Custom Domain (Optional)

1. In Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `VITE_API_URL` environment variable

---

## 🎨 Step 5: Supabase Realtime Integration (Frontend)

Update your frontend to use Supabase instead of Socket.IO:

```javascript
// src/utils/realtime.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function subscribeToParsingProgress(sessionId, callback) {
  const channel = supabase
    .channel('parsing-progress')
    .on('broadcast', { event: 'progress' }, (payload) => {
      if (payload.payload.sessionId === sessionId) {
        callback(payload.payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

---

## 📊 Step 6: MongoDB Indexes (Important!)

Run this in MongoDB Compass or Atlas:

```javascript
// Connect to your database
use apiflow

// Create indexes for parsing_sessions collection
db.parsing_sessions.createIndex({ "sessionId": 1 }, { unique: true })
db.parsing_sessions.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 3600 })
db.parsing_sessions.createIndex({ "url": 1 })

// Create indexes for parsing_logs collection (if used)
db.parsing_logs.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 604800 })
db.parsing_logs.createIndex({ "sessionId": 1 })
```

---

## 🔒 Security Checklist

- [ ] MongoDB IP whitelist configured
- [ ] Strong database password set
- [ ] Supabase RLS policies enabled (if using database)
- [ ] Environment variables set in Vercel (not in code)
- [ ] Service role key kept secret
- [ ] CORS properly configured
- [ ] Rate limiting enabled on API endpoints

---

## 📈 Monitoring & Maintenance

### Vercel Dashboard
- Monitor function invocations
- Check function logs
- Set up error notifications

### MongoDB Atlas
- Monitor database usage
- Set up performance alerts
- Enable backup (recommended)

### Supabase
- Monitor API usage
- Check realtime connections
- Review logs for errors

---

## 🚨 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution**: Check connection string, ensure IP whitelist includes `0.0.0.0/0`

### Issue: "Puppeteer timeout in production"
**Solution**: Increase function timeout in `vercel.json` or reduce page timeout

### Issue: "Supabase realtime not working"
**Solution**: Check CORS settings, verify anon key, ensure channel name matches

### Issue: "Function execution time limit exceeded"
**Solution**: Optimize parsing logic or upgrade Vercel plan for longer execution time

---

## 💡 Performance Optimization

1. **Enable Caching**: Use Vercel Edge caching for static assets
2. **Optimize Images**: Use Vercel Image Optimization
3. **Database Indexes**: Ensure all queries use indexes
4. **Connection Pooling**: MongoDB connection reuse is already implemented
5. **CDN**: Vercel automatically uses CDN for static files

---

## 📞 Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Puppeteer Documentation](https://pptr.dev/)

---

## 🎉 Deployment Complete!

Your APIFlow application is now live with:
- ✅ Production-grade serverless architecture
- ✅ Scalable MongoDB database
- ✅ Real-time updates via Supabase
- ✅ Automatic HTTPS and CDN
- ✅ Global edge network

**Next Steps:**
1. Share your deployment URL
2. Monitor usage and performance
3. Set up custom domain
4. Enable analytics
5. Configure backups

---

## 📝 Quick Reference

**Vercel Project**: https://vercel.com/jgero961-8734s-projects/api-flow  
**MongoDB**: https://cloud.mongodb.com/  
**Supabase**: https://supabase.com/dashboard  

**Support Email**: [Add your support email]  
**Documentation**: [Add your docs URL]
