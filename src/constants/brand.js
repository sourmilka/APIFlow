export const BRAND = {
  name: 'APIFlow',
  tagline: 'Discover & Analyze APIs from any website',
  version: '3.0.0',
  url: 'https://api-flow-virid.vercel.app',
};

export const METHOD_COLORS = {
  GET: 'method-get',
  POST: 'method-post',
  PUT: 'method-put',
  PATCH: 'method-patch',
  DELETE: 'method-delete',
  OPTIONS: 'method-options',
};

export function statusClass(code) {
  if (code >= 200 && code < 300) return 'status-2xx';
  if (code >= 300 && code < 400) return 'status-3xx';
  if (code >= 400 && code < 500) return 'status-4xx';
  return 'status-5xx';
}

export const STORAGE_KEY = 'apiflow-sessions';

export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
  } catch { /* quota exceeded */ }
}
