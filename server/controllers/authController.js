/**
 * Auth Controller — Rev.AI
 *
 * Handles:
 *  - POST /api/auth/register  — Create new user account
 *  - POST /api/auth/login     — Login with email/password
 *  - GET  /api/auth/me        — Get current authenticated user
 *  - GET  /api/auth/google/callback — Google OAuth callback
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// ── Helper: Generate JWT ──────────────────────────────────
/**
 * Signs a JWT token with user id and email.
 * Expires in 7 days.
 * @param {Object} user - Mongoose user document
 * @returns {string} signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ── Helper: Format validation errors ─────────────────────
const formatValidationErrors = (errors) =>
  errors.array().map((e) => e.msg);

// ─────────────────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create a new local user account.
 *
 * Body: { name, email, password }
 * Returns: { token, user }
 */
const register = async (req, res) => {
  try {
    // ── Input validation ──────────────────────────────
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: formatValidationErrors(errors),
      });
    }

    const { name, email, password } = req.body;

    // ── Check for duplicate email ─────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error:   'An account with this email already exists.',
      });
    }

    // ── Create user (password hashed by pre-save hook) ─
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      provider: 'local',
    });

    // ── Generate JWT ──────────────────────────────────
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user:    user.toSafeObject(),
    });
  } catch (err) {
    console.error('Register error:', err.message);

    // MongoDB duplicate key (safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error:   'An account with this email already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      error:   'Registration failed. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticate with email and password.
 *
 * Body: { email, password }
 * Returns: { token, user }
 */
const login = async (req, res) => {
  try {
    // ── Input validation ──────────────────────────────
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: formatValidationErrors(errors),
      });
    }

    const { email, password } = req.body;

    // ── Find user and include password for comparison ─
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error:   'Invalid email or password.',
      });
    }

    // ── Check if user is a Google-only account ────────
    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        error:   'This account uses Google Sign-In. Please log in with Google.',
      });
    }

    // ── Compare password ──────────────────────────────
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error:   'Invalid email or password.',
      });
    }

    // ── Generate JWT ──────────────────────────────────
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user:    user.toSafeObject(),
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({
      success: false,
      error:   'Login failed. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────
//  GET CURRENT USER (Protected)
// ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Requires: Authorization: Bearer <token>
 */
const getMe = async (req, res) => {
  try {
    // req.user is attached by verifyToken middleware
    return res.status(200).json({
      success: true,
      user:    req.user.toSafeObject(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error:   'Failed to fetch user profile.',
    });
  }
};

// ─────────────────────────────────────────────────────────
//  GOOGLE OAUTH CALLBACK
// ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/google/callback
 * Called by Passport after Google OAuth success.
 * Generates JWT and redirects to frontend with token.
 */
const googleCallback = (req, res) => {
  try {
    const token    = generateToken(req.user);
    const user     = req.user.toSafeObject();
    const clientURL = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

    // Redirect to frontend with token in URL param
    // Frontend reads it from URL and stores in localStorage
    return res.redirect(
      `${clientURL}/auth/callback?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`
    );
  } catch (err) {
    console.error('Google callback error:', err.message);
    const clientURL = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${clientURL}/auth/callback?error=oauth_failed`);
  }
};

module.exports = { register, login, getMe, googleCallback };
