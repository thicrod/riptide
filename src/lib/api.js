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

// Shrink screenshots in the browser before upload (faster + less data sent),
// and look for a QR code while we have the full-quality pixels.
export function imageToPayload(file, maxSide = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const qr = await findQRCodes(canvas).catch(() => []);
      resolve({ mediaType: 'image/jpeg', data: dataUrl.split(',')[1], preview: dataUrl, qr });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

// QR codes hide where a link goes ("quishing"). Decode them locally so we can check the real destination.
// The decoder is loaded only when someone uploads a screenshot.
export async function findQRCodes(canvas) {
  const { default: jsQR } = await import('jsqr');
  const found = new Set();
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const scan = (x, y, w, h) => {
    if (w < 40 || h < 40) return;
    const { data } = ctx.getImageData(x, y, w, h);
    const code = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' });
    if (code?.data?.trim()) found.add(code.data.trim());
  };
  const { width: W, height: H } = canvas;
  scan(0, 0, W, H);
  // A small code in a big screenshot, or more than one code: also try each half and each quarter.
  if (!found.size || Math.max(W, H) > 900) {
    const halves = W > H ? [[0, 0, W / 2, H], [W / 2, 0, W / 2, H]] : [[0, 0, W, H / 2], [0, H / 2, W, H / 2]];
    const quarters = [[0, 0, W / 2, H / 2], [W / 2, 0, W / 2, H / 2], [0, H / 2, W / 2, H / 2], [W / 2, H / 2, W / 2, H / 2]];
    for (const [x, y, w, h] of [...halves, ...quarters]) {
      if (found.size >= 3) break;
      scan(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
  }
  return [...found].slice(0, 3);
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
