/**
 * Pagination Utilities — Rev.AI
 *
 * Provides reusable helpers for extracting pagination params
 * from query strings and building pagination metadata for responses.
 */

const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

/**
 * Parse and sanitize pagination + sorting params from a query object.
 *
 * @param {Object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number, sort: Object }}
 *
 * Supported query params:
 *   ?page=1        — page number (default: 1)
 *   ?limit=20      — items per page (default: 20, max: 100)
 *   ?sort=field    — sort field, prefix with - for descending (default: -analyzedAt)
 *
 * Examples:
 *   ?sort=-analyzedAt   → { analyzedAt: -1 }
 *   ?sort=sentiment     → { sentiment: 1 }
 */
const parsePagination = (query = {}) => {
  let page  = parseInt(query.page,  10) || DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;

  // Clamp values to valid ranges
  if (page  < 1)         page  = DEFAULT_PAGE;
  if (limit < 1)         limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  // Parse sort string, e.g. "-analyzedAt" → { analyzedAt: -1 }
  let sort = { analyzedAt: -1 }; // default: newest first
  if (query.sort) {
    const raw     = String(query.sort);
    const dir     = raw.startsWith('-') ? -1 : 1;
    const field   = raw.replace(/^-/, '');
    // Whitelist sortable fields to prevent injection
    const SORTABLE = ['analyzedAt', 'sentiment', 'theme', 'createdAt'];
    if (SORTABLE.includes(field)) {
      sort = { [field]: dir };
    }
  }

  return { page, limit, skip, sort };
};

/**
 * Build a pagination metadata object to include in API responses.
 *
 * @param {number} total  - Total documents matching the query
 * @param {number} page   - Current page number
 * @param {number} limit  - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    count:      total,        // total matching documents
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { parsePagination, buildPaginationMeta, DEFAULT_PAGE, DEFAULT_LIMIT };
