const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function toQuery(params) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).filter(([_, v]) => v != null).forEach(([k, v]) => q.set(k, v));
  return '?' + q.toString();
}

export const auth = {
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const constellations = {
  list: (params) => api('/constellations' + toQuery(params)),
  get: (id) => api(`/constellations/${id}`),
  getStars: (id) => api(`/constellations/${id}/stars`),
};

export const comments = {
  list: (cid) => api(`/constellations/${cid}/comments`),
  create: (cid, body) => api(`/constellations/${cid}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  delete: (id) => api(`/comments/${id}`, { method: 'DELETE' }),
};

export const progress = {
  get: () => api('/progress'),
  discover: (id) => api(`/progress/${id}/discover`, { method: 'POST' }),
  draw: (id) => api(`/progress/${id}/draw`, { method: 'POST' }),
  bookmark: (id) => api(`/progress/${id}/bookmark`, { method: 'POST' }),
};

export const achievements = {
  badges: () => api('/achievements/badges'),
  userBadges: () => api('/achievements/badges/user'),
  milestones: () => api('/achievements/milestones'),
  userMilestones: () => api('/achievements/milestones/user'),
};

export const location = {
  update: (lat, lng) => api('/users/location', { method: 'PUT', body: JSON.stringify({ lat, lng }) }),
};
