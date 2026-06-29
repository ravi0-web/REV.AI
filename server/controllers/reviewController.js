/**
 * Review Controller — Rev.AI
 *
 * Handles all business logic for the 7 review API endpoints.
 * Each handler receives (req, res, next) and uses the data store
 * and gemini service to process requests.
 */

const db = require('../config/db');
const { analyzeReview } = require('../services/geminiService');
const { createReview, validateReviewText } = require('../models/Review');

// ──────────────────────────────────────────────
//  1. POST /api/reviews/analyze
//     Submit and analyze one or more reviews
//     Status: 201 (created) | 400 (bad request)
// ──────────────────────────────────────────────
const analyzeReviews = (req, res, next) => {
  try {
    const { reviews } = req.body;

    // Validate that reviews is a non-empty array
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body must include a "reviews" array with at least one review string.',
      });
    }

    // Cap batch size at 50 reviews
    if (reviews.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 reviews per batch. Please split your request.',
      });
    }

    // Validate each review text
    const errors = [];
    reviews.forEach((text, index) => {
      const validation = validateReviewText(text);
      if (!validation.valid) {
        errors.push(`Review #${index + 1}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some reviews failed validation.',
        details: errors,
      });
    }

    // Analyze each review and build result objects
    const results = reviews
      .map((text) => text.trim())
      .filter((text) => text.length > 0)
      .map((text) => {
        const analysis = analyzeReview(text);
        return createReview(text, analysis);
      });

    // Store in the in-memory database
    db.addReviews(results);

    // Return 201 Created with the results
    return res.status(201).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────
//  2. GET /api/reviews
//     Retrieve all stored reviews (newest first)
//     Status: 200
// ──────────────────────────────────────────────
const getAllReviews = (req, res, next) => {
  try {
    const reviews = db.getAllReviews();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────
//  3. GET /api/reviews/stats
//     Get aggregate dashboard statistics
//     Status: 200
// ──────────────────────────────────────────────
const getStats = (req, res, next) => {
  try {
    const stats = db.getStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────
//  4. GET /api/reviews/search?q=&sentiment=&theme=
//     Search and filter reviews
//     Status: 200 | 400
// ──────────────────────────────────────────────
const searchReviews = (req, res, next) => {
  try {
    const { q, sentiment, theme } = req.query;

    // Validate sentiment filter if provided
    if (sentiment && !['all', 'positive', 'neutral', 'negative'].includes(sentiment)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sentiment filter. Use: all, positive, neutral, or negative.',
      });
    }

    // Validate theme filter if provided
    if (theme && !['all', 'food', 'host', 'location', 'cleanliness', 'value', 'experience'].includes(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid theme filter. Use: all, food, host, location, cleanliness, value, or experience.',
      });
    }

    const results = db.searchReviews({ q, sentiment, theme });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────
//  5. GET /api/reviews/:id
//     Get a single review by ID
//     Status: 200 | 404
// ──────────────────────────────────────────────
const getReviewById = (req, res, next) => {
  try {
    const { id } = req.params;
    const review = db.getReviewById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: `Review with ID "${id}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────
//  6. DELETE /api/reviews/:id
//     Delete a single review by ID
//     Status: 204 | 404
// ──────────────────────────────────────────────
const deleteReview = (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteReview(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Review with ID "${id}" not found.`,
      });
    }

    // 204 No Content — successful deletion
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────
//  7. DELETE /api/reviews
//     Clear all review history
//     Status: 204
// ──────────────────────────────────────────────
const clearAllReviews = (req, res, next) => {
  try {
    db.clearAllReviews();

    // 204 No Content — all cleared
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  analyzeReviews,
  getAllReviews,
  getStats,
  searchReviews,
  getReviewById,
  deleteReview,
  clearAllReviews,
};
