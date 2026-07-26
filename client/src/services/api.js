/**
 * Rev.AI — API Service Layer (Week 6 — Auth + AI upgrade)
 *
 * All API calls are centralized here.
 * JWT is stored in localStorage and auto-included in protected requests.
 */

const BASE_URL  = import.meta.env.VITE_API_URL || 'https://rev-ai.onrender.com';
const API_BASE  = `${BASE_URL}/api/reviews`;
const AUTH_BASE = `${BASE_URL}/api/auth`;
const AI_BASE   = `${BASE_URL}/api/ai`;

// ── Theme Icons ───────────────────────────────────────────
export const THEME_ICONS = {
  food:        '🍽️',
  host:        '👤',
  location:    '📍',
  cleanliness: '✨',
  value:       '💰',
  experience:  '⭐',
};

// ──────────────────────────────────────────────
//  JWT Helpers
// ──────────────────────────────────────────────

export const setToken    = (token) => localStorage.setItem('revai_token', token);
export const getToken    = ()      => localStorage.getItem('revai_token');
export const removeToken = ()      => {
  localStorage.removeItem('revai_token');
  localStorage.removeItem('revai_user');
};

export const setUser = (user) => localStorage.setItem('revai_user', JSON.stringify(user));
export const getUser = () => {
  try {
    const u = localStorage.getItem('revai_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

/**
 * Check if the user has a valid, non-expired JWT.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const payload   = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) { removeToken(); return false; }
    return true;
  } catch {
    removeToken();
    return false;
  }
};

// ──────────────────────────────────────────────
//  Internal fetch helpers
// ──────────────────────────────────────────────

const buildHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function apiFetch(url, options = {}, includeAuth = true) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...buildHeaders(includeAuth), ...(options.headers || {}) },
    });
  } catch {
    throw new Error('Cannot reach the server. Please check your internet connection and try again.');
  }

  if (response.status === 204) return { data: null };

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Server error (${response.status}). The backend may be down or restarting.`);
  }

  if (response.status === 401) {
    removeToken();
    throw new Error(result.error || 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    const err = new Error(result.error || `Request failed with status ${response.status}`);
    err.status  = response.status;
    err.details = result.details || null;
    throw err;
  }

  return result;
}

// ──────────────────────────────────────────────
//  Auth API
// ──────────────────────────────────────────────

export async function register({ name, email, password }) {
  const result = await apiFetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    body:   JSON.stringify({ name, email, password }),
  }, false);
  setToken(result.token);
  setUser(result.user);
  return result;
}

export async function login({ email, password }) {
  const result = await apiFetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  }, false);
  setToken(result.token);
  setUser(result.user);
  return result;
}

export function logout() {
  removeToken();
  window.location.href = '/';
}

export async function getMe() {
  return apiFetch(`${AUTH_BASE}/me`);
}

export function loginWithGoogle() {
  window.location.href = '/api/auth/google';
}

// ──────────────────────────────────────────────
//  Review API
// ──────────────────────────────────────────────

export async function analyzeReviews(reviews) {
  const result = await apiFetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body:   JSON.stringify({ reviews }),
  });
  return result.data;
}

export async function getHistory({ page = 1, limit = 100, sort = '-analyzedAt' } = {}) {
  const params = new URLSearchParams({ page, limit, sort });
  return apiFetch(`${API_BASE}?${params}`);
}

export async function getStats() {
  return apiFetch(`${API_BASE}/stats`);
}

// Alias used by Dashboard.jsx
export const getDashboardData = getStats;

export async function searchReviews({ q, sentiment, theme, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q)                           params.set('q', q);
  if (sentiment && sentiment !== 'all') params.set('sentiment', sentiment);
  if (theme     && theme     !== 'all') params.set('theme', theme);
  params.set('page',  page);
  params.set('limit', limit);
  return apiFetch(`${API_BASE}/search?${params}`);
}

export async function clearHistory() {
  return apiFetch(API_BASE, { method: 'DELETE' });
}

export async function updateReview(id, reviewText) {
  const result = await apiFetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ reviewText }),
  });
  return result.data;
}

export async function deleteReview(id) {
  return apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
}

// ──────────────────────────────────────────────
//  AI API (protected — JWT required)
// ──────────────────────────────────────────────

export async function aiChat(message) {
  return apiFetch(`${AI_BASE}/chat`, {
    method: 'POST',
    body:   JSON.stringify({ message }),
  });
}

export async function aiSummarize(text) {
  return apiFetch(`${AI_BASE}/summarize`, {
    method: 'POST',
    body:   JSON.stringify({ text }),
  });
}

export async function aiRecommend(reviewText) {
  return apiFetch(`${AI_BASE}/recommend`, {
    method: 'POST',
    body:   JSON.stringify({ reviewText }),
  });
}

// ──────────────────────────────────────────────
//  CSV Utilities (client-side only)
// ──────────────────────────────────────────────

export function exportToCSV(data) {
  const headers = ['#', 'Review', 'Sentiment', 'Theme', 'Response', 'Date'];
  const rows = data.map((item, idx) => [
    idx + 1,
    `"${(item.reviewText || '').replace(/"/g, '""')}"`,
    item.sentiment,
    item.theme,
    `"${(item.response || '').replace(/"/g, '""')}"`,
    item.analyzedAt ? new Date(item.analyzedAt).toLocaleString() : '',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
