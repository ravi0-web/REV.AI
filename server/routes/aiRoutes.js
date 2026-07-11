/**
 * AI Routes — Rev.AI
 *
 * Mounts at /api/ai
 * All routes are protected — require valid JWT.
 *
 * POST /api/ai/chat       — General Gemini chat
 * POST /api/ai/summarize  — Summarize review text
 * POST /api/ai/recommend  — Get hospitality recommendations
 */

const express  = require('express');
const router   = express.Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const { chatHandler, summarizeHandler, recommendHandler } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

// ── Rate Limiter for AI endpoints ─────────────────────────
// AI calls are expensive — limit to 30 per 10 minutes per user
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max:      30,
  message: {
    success: false,
    error:   'Too many AI requests. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Validation Rules ──────────────────────────────────────

const chatValidation = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

const summarizeValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Text to summarize is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Text must be between 10 and 5000 characters'),
];

const recommendValidation = [
  body('reviewText')
    .trim()
    .notEmpty().withMessage('Review text is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Review text must be between 10 and 5000 characters'),
];

// ── Routes (all protected) ────────────────────────────────

// POST /api/ai/chat
router.post('/chat', verifyToken, aiLimiter, chatValidation, chatHandler);

// POST /api/ai/summarize
router.post('/summarize', verifyToken, aiLimiter, summarizeValidation, summarizeHandler);

// POST /api/ai/recommend
router.post('/recommend', verifyToken, aiLimiter, recommendValidation, recommendHandler);

module.exports = router;
