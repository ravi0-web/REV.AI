/**
 * Rev.AI — API Service Layer
 *
 * Connects the React frontend to the Express.js backend (MongoDB-powered).
 * All review analysis, history, and dashboard data comes from the server.
 *
 * Client-only utilities (CSV export, file download) remain here.
 */

// ── Base URL ─────────────────────────────────
// In development, Vite proxies /api to http://localhost:5000
const API_BASE = '/api/reviews';

// ── Theme Icons (used for display in frontend) ──
const THEME_ICONS = {
  food:        '🍽️',
  host:        '👤',
  location:    '📍',
  cleanliness: '✨',
  value:       '💰',
  experience:  '⭐',
};

// ──────────────────────────────────────────────
//  Internal helper — shared fetch logic
// ──────────────────────────────────────────────

/**
 * Fetch wrapper that throws a descriptive Error on non-OK responses.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<{ data, meta }>}
 */
async function apiFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    // Server is down or unreachable
    throw new Error('Cannot reach the server. Make sure the backend is running on port 5000.');
  }

  // 204 No Content — no body to parse
  if (response.status === 204) return { data: null };

  let result;
  try {
    result = await response.json();
  } catch {
    // Server returned non-JSON (e.g. HTML error page)
    throw new Error(`Server error (${response.status}). The backend may be down or restarting.`);
  }

  if (!response.ok) {
    const msg = result.error || `Request failed with status ${response.status}`;
    const err = new Error(msg);
    err.status  = response.status;
    err.details = result.details || null;
    throw err;
  }

  return result;
}


// ──────────────────────────────────────────────
//  API Functions — Backend Integration
// ──────────────────────────────────────────────

/**
 * Analyze multiple reviews via the backend API.
 * Sends reviews to POST /api/reviews/analyze.
 *
 * @param {string[]} reviews - Array of review strings
 * @returns {Promise<Object[]>} Array of analysis result objects
 * @throws {Error} If the API request fails
 */
export async function analyzeReviews(reviews) {
  const result = await apiFetch(`${API_BASE}/analyze`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ reviews }),
  });
  return result.data;
}

/**
 * Get all review history from the backend (paginated).
 *
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.sort='-analyzedAt']
 * @returns {Promise<{ data: Object[], count, page, totalPages, hasNextPage, hasPrevPage }>}
 */
export async function getHistory({ page = 1, limit = 20, sort = '-analyzedAt' } = {}) {
  const params = new URLSearchParams({ page, limit, sort });
  const result = await apiFetch(`${API_BASE}?${params}`);
  return result; // returns full result (data + pagination meta)
}

/**
 * Clear all review history via the backend.
 *
 * @returns {Promise<{ deleted: number, message: string }>}
 */
export async function clearHistory() {
  const result = await apiFetch(API_BASE, { method: 'DELETE' });
  return result;
}

/**
 * Get dashboard aggregate statistics from the backend.
 *
 * @returns {Promise<{ total, sentimentCounts, themeCounts }>}
 */
export async function getDashboardData() {
  const result = await apiFetch(`${API_BASE}/stats`);
  return result.data;
}

/**
 * Search and filter reviews via the backend.
 * Uses the /search endpoint (full-text + filter).
 *
 * @param {Object} [filters]
 * @param {string} [filters.q]         - Keyword search
 * @param {string} [filters.sentiment] - 'all'|'positive'|'neutral'|'negative'
 * @param {string} [filters.theme]     - 'all'|'food'|'host'|...
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=20]
 * @returns {Promise<{ data: Object[], count, page, totalPages, hasNextPage, hasPrevPage }>}
 */
export async function searchReviews({ q, sentiment, theme, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q)                           params.set('q',         q);
  if (sentiment && sentiment !== 'all') params.set('sentiment', sentiment);
  if (theme     && theme     !== 'all') params.set('theme',     theme);
  params.set('page',  page);
  params.set('limit', limit);

  const result = await apiFetch(`${API_BASE}/search?${params}`);
  return result;
}

/**
 * Filter reviews by sentiment and/or theme (structured filter endpoint).
 *
 * @param {Object} [filters]
 * @param {string} [filters.sentiment]
 * @param {string} [filters.theme]
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=20]
 * @param {string} [filters.sort='-analyzedAt']
 * @returns {Promise<{ data: Object[], count, page, totalPages, hasNextPage, hasPrevPage }>}
 */
export async function filterReviews({ sentiment, theme, page = 1, limit = 20, sort = '-analyzedAt' } = {}) {
  const params = new URLSearchParams();
  if (sentiment && sentiment !== 'all') params.set('sentiment', sentiment);
  if (theme     && theme     !== 'all') params.set('theme',     theme);
  params.set('page',  page);
  params.set('limit', limit);
  params.set('sort',  sort);

  const result = await apiFetch(`${API_BASE}/filter?${params}`);
  return result;
}

/**
 * Delete a single review by its MongoDB ObjectId.
 *
 * @param {string} id - The MongoDB ObjectId string
 * @returns {Promise<void>}
 */
export async function deleteReview(id) {
  await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
}

// ──────────────────────────────────────────────
//  Client-Only Utilities (no backend needed)
// ──────────────────────────────────────────────

/**
 * Export results to a CSV string.
 */
export function exportToCSV(results) {
  const headers = ['#', 'Review', 'Sentiment', 'Theme', 'Suggested Response', 'Analyzed At'];
  const rows    = results.map((r, i) => [
    i + 1,
    `"${(r.reviewText || '').replace(/"/g, '""')}"`,
    r.sentiment,
    r.theme,
    `"${(r.response || '').replace(/"/g, '""')}"`,
    r.analyzedAt || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return csv;
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { THEME_ICONS };
