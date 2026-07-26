/**
 * Auth Routes — Rev.AI
 *
 * Mounts at /api/auth
 *
 * Public:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/google
 *   GET  /api/auth/google/callback
 *
 * Protected:
 *   GET  /api/auth/me
 */

const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const { register, login, getMe, googleCallback } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// ── Rate Limiters ─────────────────────────────────────────

// Login: max 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      5,
  message: {
    success: false,
    error:   'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Register: max 10 attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      10,
  message: {
    success: false,
    error:   'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Validation Rules ──────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Routes ────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerLimiter, registerValidation, register);

// POST /api/auth/login
router.post('/login', loginLimiter, loginValidation, login);

// GET /api/auth/me  (protected)
router.get('/me', verifyToken, getMe);

// GET /api/auth/google — redirect to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope:   ['profile', 'email'],
    session: false,
  })
);

// GET /api/auth/google/callback — Google redirects here after user consents
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/login?error=google_failed`,
    session:         false,
  }),
  googleCallback
);

module.exports = router;
