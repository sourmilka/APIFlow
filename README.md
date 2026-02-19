# APIFlow

**Discover & Analyze APIs from any website.**

APIFlow visits any URL in a headless browser, intercepts every network request, and surfaces all API endpoints — complete with authentication detection, GraphQL parsing, rate limit headers, and response data.

## Live Demo

**[api-flow-virid.vercel.app](https://api-flow-virid.vercel.app)**

## Features

- **API Discovery** — Headless Chromium intercepts XHR/Fetch requests in real-time
- **Auth Detection** — Identifies Bearer tokens, API keys, cookies, and custom auth
- **GraphQL Support** — Parses operations, variables, and fields
- **Response Capture** — Full JSON responses with status codes and timing
- **Rate Limit Analysis** — Detects `X-RateLimit-*` headers
- **Session History** — LocalStorage-backed scan history with quick recall
- **Export** — Download full scan results as JSON
- **Keyboard Shortcuts** — `Ctrl+N` new scan, `Ctrl+E` export, `Ctrl+R` rescan

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS, shadcn/ui |
| Backend | Vercel Serverless Functions |
| Parser | Puppeteer + @sparticuz/chromium |
| Storage | MongoDB (optional), LocalStorage |

## Project Structure

```
src/
  App.jsx                  # Main application
  components/
    layout/Sidebar.jsx     # Session history sidebar
    layout/Toolbar.jsx     # Filter bar and actions
    ApiList.jsx            # Endpoint list
    ApiDetailPanel.jsx     # Selected endpoint details
    ScanDialog.jsx         # URL input + scanning state
    StatsBar.jsx           # Scan statistics
    EmptyState.jsx         # Landing/empty state
    ShortcutsDialog.jsx    # Keyboard shortcuts
    ToastContainer.jsx     # Toast notifications
    ui/                    # shadcn/ui primitives
  hooks/
    useToast.js            # Toast state management
    useKeyboardShortcuts.js
  config/api.js            # API endpoint config
  constants/brand.js       # Brand constants + session storage

api/
  parse.js                 # Core: URL → headless browser → intercept APIs
  health.js                # Health check endpoint
  session/[sessionId].js   # Session retrieval
  utils/chromium.js        # Browser launcher for Vercel
  utils/helpers.js         # Auth detection, GraphQL parsing
  config/mongodb.js        # MongoDB connection
```

## Local Development

```bash
npm install
npm run dev
```

## Deployment

Deployed on **Vercel** with serverless functions for Puppeteer parsing.

```bash
vercel --prod
```

## License

MIT
