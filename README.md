# API Parser Pro - Professional Edition v3.0

A **FULLY PROFESSIONAL** web application that analyzes websites and extracts ALL API information including HTTP requests, WebSocket connections, GraphQL operations, and authentication details.

## 🎯 Professional Features

### **Core Capabilities**
- 🔍 **Automatic API Discovery**: Parse any website to find all endpoints
- 🔌 **WebSocket Monitoring**: Track real-time connections and messages
- 🔷 **GraphQL Parser**: Analyze queries, mutations, and subscriptions
- 🔐 **Authentication Detection**: Identify tokens, API keys, and cookies
- 📊 **Performance Tracking**: Measure response times and identify bottlenecks
- 💬 **API Explanations**: Understand what each API does

### **Testing & Development**
- ▶️ **API Testing**: Replay and test discovered APIs
- ✏️ **Request Editing**: Modify requests before testing
- 🔑 **Custom Headers**: Add authentication and custom headers
- 🍪 **Cookie Support**: Parse authenticated websites
- 📤 **Export Options**: JSON, CSV, and cURL formats

### **Advanced Features**
- ⏸️ **Cancel Parsing**: Stop long-running operations
- 📈 **Real-time Progress**: Live updates during parsing
- 💾 **Session History**: Auto-save and reload analyses
- 🔍 **Advanced Filtering**: Search and filter by method, status, domain
- 🌙 **Dark Mode**: Professional dark theme
- 📊 **Statistics Dashboard**: Visual insights and metrics

## Installation

```bash
npm install
```

## Usage

### Development Mode

1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the frontend:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## How It Works

1. Enter a website URL (e.g., https://www.kolanasolana.com/app/dashboard)
2. The application will:
   - Load the website using headless browser
   - Intercept all network requests
   - Capture API endpoints, methods, headers, and responses
   - Display results in an organized, searchable format

## Tech Stack

### Production (Serverless)
- **Frontend**: React, TailwindCSS, Vite
- **Backend**: Vercel Serverless Functions
- **Database**: MongoDB Atlas
- **Realtime**: Supabase
- **Parser**: Puppeteer + Chromium Layer
- **Hosting**: Vercel Edge Network

### Development (Local)
- **Backend**: Node.js, Express
- **Parser**: Puppeteer (headless Chrome)
- **Icons**: Lucide React

## 🚀 Deployment

### Quick Deploy (5 minutes)
See **QUICK_DEPLOY.md** for step-by-step instructions.

```bash
# 1. Install dependencies
npm install

# 2. Build
npm run build

# 3. Push to GitHub
git push origin main

# 4. Deploy to Vercel
# Add environment variables in Vercel Dashboard
# Click Deploy
```

### Detailed Guides
- 📖 **QUICK_DEPLOY.md** - Fast deployment guide
- 📚 **DEPLOYMENT.md** - Complete setup documentation
- ✅ **DEPLOY_CHECKLIST.md** - Step-by-step checklist

### Live Demo
🌐 Production: https://api-flow.vercel.app

## 🔧 Configuration

All configuration is done via environment variables. See `.env.example` for required variables:
- MongoDB Atlas connection
- Supabase credentials
- API URLs

## 📊 Architecture

**Serverless Architecture**:
```
User Request → Vercel Edge → Serverless Function → Puppeteer/Chromium
                                    ↓
                              MongoDB Atlas (Sessions)
                                    ↓
                              Supabase (Realtime Updates)
```

## License

MIT
