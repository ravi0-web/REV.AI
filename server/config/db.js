/**
 * In-Memory Data Store for Rev.AI
 * 
 * Acts as a temporary database using a plain array.
 * All CRUD operations go through these helper functions,
 * making it easy to swap with MongoDB/Mongoose later.
 */

// The in-memory "database" — an array of review objects
let reviews = [];

/**
 * Get all reviews, sorted by date (newest first).
 * @returns {Array} All stored reviews
 */
const getAllReviews = () => {
  return [...reviews].sort(
    (a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt)
  );
};

/**
 * Find a single review by its ID.
 * @param {string} id - The review UUID
 * @returns {Object|undefined} The matching review or undefined
 */
const getReviewById = (id) => {
  return reviews.find((r) => r.id === id);
};

/**
 * Add one or more reviews to the store.
 * @param {Array} newReviews - Array of review objects to insert
 * @returns {Array} The inserted reviews
 */
const addReviews = (newReviews) => {
  reviews.push(...newReviews);
  return newReviews;
};

/**
 * Delete a single review by ID.
 * @param {string} id - The review UUID
 * @returns {boolean} True if deleted, false if not found
 */
const deleteReview = (id) => {
  const index = reviews.findIndex((r) => r.id === id);
  if (index === -1) return false;
  reviews.splice(index, 1);
  return true;
};

/**
 * Clear all reviews from the store.
 * @returns {number} The count of deleted reviews
 */
const clearAllReviews = () => {
  const count = reviews.length;
  reviews = [];
  return count;
};

/**
 * Search and filter reviews.
 * @param {Object} filters - { q, sentiment, theme }
 * @returns {Array} Filtered reviews sorted by date (newest first)
 */
const searchReviews = ({ q, sentiment, theme }) => {
  let filtered = [...reviews];

  // Filter by sentiment
  if (sentiment && sentiment !== 'all') {
    filtered = filtered.filter((r) => r.sentiment === sentiment);
  }

  // Filter by theme
  if (theme && theme !== 'all') {
    filtered = filtered.filter((r) => r.theme === theme);
  }

  // Search by keyword in reviewText, response, or theme
  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.reviewText.toLowerCase().includes(query) ||
        r.response.toLowerCase().includes(query) ||
        r.theme.toLowerCase().includes(query)
    );
  }

  // Sort newest first
  return filtered.sort(
    (a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt)
  );
};

/**
 * Get aggregate statistics for the dashboard.
 * @returns {Object} { total, sentimentCounts, themeCounts }
 */
const getStats = () => {
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const themeCounts = {
    food: 0,
    host: 0,
    location: 0,
    cleanliness: 0,
    value: 0,
    experience: 0,
  };

  reviews.forEach((item) => {
    if (sentimentCounts[item.sentiment] !== undefined) {
      sentimentCounts[item.sentiment]++;
    }
    if (themeCounts[item.theme] !== undefined) {
      themeCounts[item.theme]++;
    }
  });

  return {
    total: reviews.length,
    sentimentCounts,
    themeCounts,
  };
};

module.exports = {
  getAllReviews,
  getReviewById,
  addReviews,
  deleteReview,
  clearAllReviews,
  searchReviews,
  getStats,
};
