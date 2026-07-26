/**
 * Review Routes — Rev.AI
 *
 * Defines all 8 REST API endpoints for review operations.
 * Routes are mounted at /api/reviews in server.js.
 *
 * IMPORTANT: Static routes (like /stats, /search, /filter) MUST come
 * before the dynamic /:id route, otherwise Express will try to match
 * "stats", "search", or "filter" as an ID parameter.
 */

const express           = require('express');
const router            = express.Router();
const validateObjectId  = require('../middleware/validateObjectId');

const {
  analyzeReviews,
  getAllReviews,
  getStats,
  searchReviews,
  filterReviews,
  getReviewById,
  deleteReview,
  clearAllReviews,
  updateReview,
} = require('../controllers/reviewController');

// ── Static routes first ───────────────────────────────────

// POST   /api/reviews/analyze   → Submit & analyze reviews, save to MongoDB
router.post('/analyze', analyzeReviews);

// GET    /api/reviews/stats     → Aggregated dashboard statistics
router.get('/stats', getStats);

// GET    /api/reviews/search    → Full-text search + filter
//   Query: ?q=keyword&sentiment=positive&theme=food&page=1&limit=20
router.get('/search', searchReviews);

// GET    /api/reviews/filter    → Filter by sentiment/theme with pagination
//   Query: ?sentiment=positive&theme=food&page=1&limit=20&sort=-analyzedAt
router.get('/filter', filterReviews);

// ── Base routes ───────────────────────────────────────────

// GET    /api/reviews           → Get all reviews (paginated, sorted)
//   Query: ?page=1&limit=20&sort=-analyzedAt
router.get('/', getAllReviews);

// DELETE /api/reviews           → Clear all review history
router.delete('/', clearAllReviews);

// ── Dynamic :id routes last ───────────────────────────────
// validateObjectId runs before the controller to catch bad IDs early

// GET    /api/reviews/:id       → Get single review by MongoDB ObjectId
router.get('/:id', validateObjectId, getReviewById);

// PUT    /api/reviews/:id       → Update single review by MongoDB ObjectId
router.put('/:id', validateObjectId, updateReview);

// DELETE /api/reviews/:id       → Delete single review by MongoDB ObjectId
router.delete('/:id', validateObjectId, deleteReview);

module.exports = router;
