/**
 * Review Controller — Rev.AI
 *
 * All business logic for the review API endpoints.
 * Uses MongoDB/Mongoose for persistence (replaces in-memory array).
 * Every handler is wrapped with asyncWrapper for error forwarding.
 *
 * Routes are defined in routes/reviewRoutes.js.
 */

const { Review, validateReviewText, THEME_ICONS, VALID_SENTIMENTS, VALID_THEMES } = require('../models/Review');
const { analyzeReview } = require('../services/geminiService');
const { asyncWrapper }  = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// ──────────────────────────────────────────────────────────
//  1. POST /api/reviews/analyze
//     Submit and analyze one or more reviews, then persist to MongoDB.
//     Status: 201 | 400
// ──────────────────────────────────────────────────────────
const analyzeReviews = asyncWrapper(async (req, res) => {
  const { reviews } = req.body;

  // Validate reviews array
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return sendError(
      res,
      'Request body must include a "reviews" array with at least one review string.',
      400
    );
  }

  if (reviews.length > 50) {
    return sendError(res, 'Maximum 50 reviews per batch. Please split your request.', 400);
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
    return sendError(res, 'Some reviews failed validation.', 400, errors);
  }

  // Analyze each review and build document objects
  // analyzeReview is async (may call Gemini API), so we await each one
  const cleanedReviews = reviews
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  // Run all AI analysis API calls in parallel for blazing-fast speed!
  const analysisPromises = cleanedReviews.map((text) => analyzeReview(text));
  const analyses = await Promise.all(analysisPromises);

  const documents = cleanedReviews.map((text, index) => {
    const analysis = analyses[index];
    return {
      reviewText: text,
      sentiment:  analysis.sentiment,
      theme:      analysis.theme,
      themeIcon:  THEME_ICONS[analysis.theme] || '🏷️',
      response:   analysis.response,
      analyzedAt: new Date(),
    };
  });

  // Bulk insert into MongoDB
  const savedReviews = await Review.insertMany(documents, { ordered: false });

  return sendSuccess(res, savedReviews, 201, { count: savedReviews.length });
});

// ──────────────────────────────────────────────────────────
//  2. GET /api/reviews
//     Retrieve all stored reviews with pagination & sorting.
//     Query params: ?page=1&limit=20&sort=-analyzedAt
//     Status: 200
// ──────────────────────────────────────────────────────────
const getAllReviews = asyncWrapper(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query);

  // Run count and find in parallel for efficiency
  const [total, reviews] = await Promise.all([
    Review.countDocuments(),
    Review.find().sort(sort).skip(skip).limit(limit).lean(),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return sendSuccess(res, reviews, 200, meta);
});

// ──────────────────────────────────────────────────────────
//  3. GET /api/reviews/stats
//     Aggregate dashboard statistics via MongoDB pipeline.
//     Status: 200
// ──────────────────────────────────────────────────────────
const getStats = asyncWrapper(async (req, res) => {
  const [totalResult, sentimentResult, themeResult] = await Promise.all([
    Review.countDocuments(),
    Review.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $group: { _id: '$theme', count: { $sum: 1 } } },
    ]),
  ]);

  // Build sentimentCounts object
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  sentimentResult.forEach(({ _id, count }) => {
    if (_id in sentimentCounts) sentimentCounts[_id] = count;
  });

  // Build themeCounts object
  const themeCounts = { food: 0, host: 0, location: 0, cleanliness: 0, value: 0, experience: 0 };
  themeResult.forEach(({ _id, count }) => {
    if (_id in themeCounts) themeCounts[_id] = count;
  });

  return sendSuccess(res, { total: totalResult, sentimentCounts, themeCounts });
});

// ──────────────────────────────────────────────────────────
//  4. GET /api/reviews/search?q=&sentiment=&theme=&page=&limit=
//     Full-text search + filter via MongoDB text index.
//     Status: 200 | 400
// ──────────────────────────────────────────────────────────
const searchReviews = asyncWrapper(async (req, res) => {
  const { q, sentiment, theme } = req.query;
  const { page, limit, skip, sort } = parsePagination(req.query);

  // Validate sentiment filter
  if (sentiment && !['all', ...VALID_SENTIMENTS].includes(sentiment)) {
    return sendError(
      res,
      `Invalid sentiment. Use one of: all, ${VALID_SENTIMENTS.join(', ')}.`,
      400
    );
  }

  // Validate theme filter
  if (theme && !['all', ...VALID_THEMES].includes(theme)) {
    return sendError(
      res,
      `Invalid theme. Use one of: all, ${VALID_THEMES.join(', ')}.`,
      400
    );
  }

  // Build query object
  const query = {};

  if (q && q.trim()) {
    // Use MongoDB text index for full-text search
    query.$text = { $search: q.trim() };
  }
  if (sentiment && sentiment !== 'all') query.sentiment = sentiment;
  if (theme     && theme     !== 'all') query.theme     = theme;

  const [total, reviews] = await Promise.all([
    Review.countDocuments(query),
    Review.find(query).sort(sort).skip(skip).limit(limit).lean(),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return sendSuccess(res, reviews, 200, meta);
});

// ──────────────────────────────────────────────────────────
//  5. GET /api/reviews/filter?sentiment=&theme=&page=&limit=&sort=
//     Filter reviews by sentiment and/or theme with pagination.
//     Bonus endpoint (structured alternative to /search).
//     Status: 200 | 400
// ──────────────────────────────────────────────────────────
const filterReviews = asyncWrapper(async (req, res) => {
  const { sentiment, theme } = req.query;
  const { page, limit, skip, sort } = parsePagination(req.query);

  // Validate
  if (sentiment && !['all', ...VALID_SENTIMENTS].includes(sentiment)) {
    return sendError(
      res,
      `Invalid sentiment. Use one of: all, ${VALID_SENTIMENTS.join(', ')}.`,
      400
    );
  }
  if (theme && !['all', ...VALID_THEMES].includes(theme)) {
    return sendError(
      res,
      `Invalid theme. Use one of: all, ${VALID_THEMES.join(', ')}.`,
      400
    );
  }

  // Build filter
  const filter = {};
  if (sentiment && sentiment !== 'all') filter.sentiment = sentiment;
  if (theme     && theme     !== 'all') filter.theme     = theme;

  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort(sort).skip(skip).limit(limit).lean(),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return sendSuccess(res, reviews, 200, meta);
});

// ──────────────────────────────────────────────────────────
//  6. GET /api/reviews/:id
//     Get a single review by MongoDB ObjectId.
//     Status: 200 | 400 | 404
// ──────────────────────────────────────────────────────────
const getReviewById = asyncWrapper(async (req, res) => {
  const review = await Review.findById(req.params.id).lean();

  if (!review) {
    return sendError(res, `Review with ID "${req.params.id}" not found.`, 404);
  }

  return sendSuccess(res, review);
});

// ──────────────────────────────────────────────────────────
//  7. DELETE /api/reviews/:id
//     Delete a single review by MongoDB ObjectId.
//     Status: 204 | 400 | 404
// ──────────────────────────────────────────────────────────
const deleteReview = asyncWrapper(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id).lean();

  if (!review) {
    return sendError(res, `Review with ID "${req.params.id}" not found.`, 404);
  }

  // 204 No Content — successful deletion, no body
  return res.status(204).send();
});

// ──────────────────────────────────────────────────────────
//  8. DELETE /api/reviews
//     Clear all review history.
//     Status: 200
// ──────────────────────────────────────────────────────────
const clearAllReviews = asyncWrapper(async (req, res) => {
  const result = await Review.deleteMany({});
  return sendSuccess(res, null, 200, {
    deleted: result.deletedCount,
    message: `Successfully deleted ${result.deletedCount} review(s).`,
  });
});

const updateReview = asyncWrapper(async (req, res) => {
  const { reviewText } = req.body;
  if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 5) {
    return sendError(res, 'Review text must be at least 5 characters.', 400);
  }
  const existing = await Review.findById(req.params.id);
  if (!existing) {
    return sendError(res, `Review with ID ${req.params.id} not found.`, 404);
  }
  const analysis = await analyzeReview(reviewText.trim());
  existing.reviewText = reviewText.trim();
  existing.sentiment  = analysis.sentiment;
  existing.theme      = analysis.theme;
  existing.themeIcon   = THEME_ICONS[analysis.theme] || '⭐';
  existing.response   = analysis.response;
  existing.analyzedAt = new Date();
  await existing.save();
  return sendSuccess(res, existing, 200);
});

module.exports = {
  analyzeReviews,
  getAllReviews,
  getStats,
  searchReviews,
  filterReviews,
  getReviewById,
  deleteReview,
  clearAllReviews,
  updateReview,
};
