async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('/api/health'),
  analyze: (payload) => request('/api/analyze', { method: 'POST', body: payload }),
  share: (text, result) => request('/api/submissions', { method: 'POST', body: { text, result } }),
  stats: () => request('/api/stats'),
  round: (seen = []) => request('/api/training/round', { method: 'POST', body: { seen } }),
  leaderboard: () => request('/api/leaderboard'),
  submitScore: (entry) => request('/api/leaderboard', { method: 'POST', body: entry }),
  adminList: (key) => request('/api/admin/submissions', { headers: { 'x-admin-key': key } }),
  adminSet: (key, id, status) => request(`/api/admin/submissions/${encodeURIComponent(id)}`, { method: 'POST', body: { status }, headers: { 'x-admin-key': key } }),
};

// Shrink screenshots in the browser before upload (faster + less data sent).
export function imageToPayload(file, maxSide = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ mediaType: 'image/jpeg', data: dataUrl.split(',')[1], preview: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

// Remember which game questions this browser has seen, so rounds don't repeat them.
const SEEN_KEY = 'riptide.seen.v2';
export function loadSeen() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
}
export function rememberSeen(ids) {
  try {
    const all = [...new Set([...loadSeen(), ...ids])].slice(-3000);
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch { /* storage unavailable (private mode): repeats are just more likely */ }
}
