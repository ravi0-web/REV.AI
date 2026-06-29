/**
 * Rev.AI — API Service Layer
 *
 * Connects the React frontend to the Express.js backend.
 * All review analysis, history, and dashboard data now comes
 * from the server via REST API calls.
 *
 * Client-only utilities (CSV export, file download) remain here.
 */

// ── Base URL ─────────────────────────────────
// In development, Vite proxies /api to http://localhost:5000
// In production, the backend serves the frontend directly
const API_BASE = '/api/reviews';

// ── Theme Icons (used for display in frontend) ──
const THEME_ICONS = {
  food: '🍽️',
  host: '👤',
  location: '📍',
  cleanliness: '✨',
  value: '💰',
  experience: '⭐',
};

// ──────────────────────────────────────────────
//  API Functions — Backend Integration
// ──────────────────────────────────────────────

/**
 * Analyze multiple reviews via the backend API.
 * Sends reviews to POST /api/reviews/analyze and returns
 * the analysis results from the server.
 *
 * @param {string[]} reviews - Array of review strings
 * @returns {Promise<Object[]>} Array of analysis result objects
 * @throws {Error} If the API request fails
 */
export async function analyzeReviews(reviews) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviews }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to analyze reviews');
  }

  return result.data;
}

/**
 * Get all review history from the backend.
 * Replaces the old localStorage-based getHistory().
 *
 * @returns {Promise<Object[]>} Array of all stored reviews (newest first)
 */
export async function getHistory() {
  const response = await fetch(API_BASE);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch history');
  }

  return result.data;
}

/**
 * Clear all review history via the backend.
 * Replaces the old localStorage.removeItem call.
 *
 * @returns {Promise<void>}
 */
export async function clearHistory() {
  const response = await fetch(API_BASE, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to clear history');
  }
}

/**
 * Get dashboard aggregate data from the backend.
 * Replaces the old client-side getDashboardData().
 *
 * @returns {Promise<Object>} { total, sentimentCounts, themeCounts }
 */
export async function getDashboardData() {
  const response = await fetch(`${API_BASE}/stats`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch dashboard data');
  }

  return result.data;
}

/**
 * Search and filter reviews via the backend.
 * Replaces client-side filtering in History page.
 *
 * @param {Object} filters - { q, sentiment, theme }
 * @returns {Promise<Object[]>} Filtered array of reviews
 */
export async function searchReviews({ q, sentiment, theme } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (sentiment && sentiment !== 'all') params.set('sentiment', sentiment);
  if (theme && theme !== 'all') params.set('theme', theme);

  const response = await fetch(`${API_BASE}/search?${params.toString()}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to search reviews');
  }

  return result.data;
}

/**
 * Delete a single review by ID.
 *
 * @param {string} id - The review UUID
 * @returns {Promise<void>}
 */
export async function deleteReview(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to delete review');
  }
}

// ──────────────────────────────────────────────
//  Client-Only Utilities (no backend needed)
// ──────────────────────────────────────────────

/**
 * Export results to CSV string.
 */
export function exportToCSV(results) {
  const headers = ['#', 'Review', 'Sentiment', 'Theme', 'Suggested Response', 'Analyzed At'];
  const rows = results.map((r, i) => [
    i + 1,
    `"${r.reviewText.replace(/"/g, '""')}"`,
    r.sentiment,
    r.theme,
    `"${r.response.replace(/"/g, '""')}"`,
    r.analyzedAt || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return csv;
}

/**
 * Download a string as a file.
 */
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { THEME_ICONS };
