const API_BASE = import.meta.env.VITE_API_URL || '';

export const endpoints = {
  parse: `${API_BASE}/api/parse`,
  health: `${API_BASE}/api/health`,
  session: (id) => `${API_BASE}/api/session/${id}`,
};

export async function apiPost(url, body, signal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
}

export async function apiGet(url, signal) {
  const res = await fetch(url, { signal });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
}
