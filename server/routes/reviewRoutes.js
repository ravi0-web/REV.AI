/**
 * Review Routes — Rev.AI
 *
 * Defines all 7 REST API endpoints for review operations.
 * Routes are mounted at /api/reviews in server.js.
 *
 * IMPORTANT: Static routes (like /stats, /search) MUST come
 * before the dynamic /:id route, otherwise Express will try
 * to match "stats" or "search" as an ID parameter.
 */

const express = require('express');
const router = express.Router();
const {
  analyzeReviews,
  getAllReviews,
  getStats,
  searchReviews,
  getReviewById,
  deleteReview,
  clearAllReviews,
} = require('../controllers/reviewController');

// ── Static routes first ──────────────────────

// POST   /api/reviews/analyze   → Submit & analyze reviews
router.post('/analyze', analyzeReviews);

// GET    /api/reviews/stats     → Dashboard statistics
router.get('/stats', getStats);

// GET    /api/reviews/search    → Search & filter reviews
router.get('/search', searchReviews);

// ── Base routes ──────────────────────────────

// GET    /api/reviews           → Get all review history
router.get('/', getAllReviews);

// DELETE /api/reviews           → Clear all history
router.delete('/', clearAllReviews);

// ── Dynamic :id routes last ──────────────────

// GET    /api/reviews/:id       → Get single review
router.get('/:id', getReviewById);

// DELETE /api/reviews/:id       → Delete single review
router.delete('/:id', deleteReview);

module.exports = router;
