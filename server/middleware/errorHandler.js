/**
 * Error Handler Middleware — Rev.AI
 *
 * Provides:
 *  - asyncWrapper        : wraps async route handlers to auto-forward errors
 *  - handle404           : catches unmatched routes
 *  - globalErrorHandler  : centralized error response formatter
 *
 * Handles:
 *  - Mongoose CastError (invalid ObjectId)
 *  - Mongoose ValidationError
 *  - MongoDB Duplicate Key (11000)
 *  - JWT errors (JsonWebTokenError, TokenExpiredError)
 *  - express-validator errors
 *  - Gemini API errors
 *  - Generic 500 errors
 */

const mongoose = require('mongoose');

// ── Async Wrapper ────────────────────────────────────────
/**
 * Wraps an async route handler so any thrown error is
 * automatically forwarded to Express's next(err).
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── 404 Handler ──────────────────────────────────────────
const handle404 = (req, res) => {
  res.status(404).json({
    success: false,
    error:   `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

// ── Global Error Handler ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  console.error(`\n❌  [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('   Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // ── Mongoose: CastError (invalid ObjectId) ────────────
  if (err instanceof mongoose.Error.CastError && err.path === '_id') {
    return res.status(400).json({
      success: false,
      error:   `Invalid ID format: "${err.value}" is not a valid MongoDB ObjectId.`,
    });
  }

  // ── Mongoose: ValidationError ─────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      success: false,
      error:   'Validation failed',
      details,
    });
  }

  // ── MongoDB: Duplicate Key (email conflict) ───────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error:   `Duplicate value for "${field}". An account with this ${field} already exists.`,
    });
  }

  // ── JWT: Invalid token ────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error:   'Invalid token. Please log in again.',
    });
  }

  // ── JWT: Expired token ────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error:   'Session expired. Please log in again.',
    });
  }

  // ── Gemini API errors ─────────────────────────────────
  if (err.message && err.message.includes('GEMINI') || err.message?.includes('GoogleGenerativeAI')) {
    return res.status(503).json({
      success: false,
      error:   'AI service is temporarily unavailable. Please try again later.',
    });
  }

  // ── Custom errors with explicit status ────────────────
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error:   err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { asyncWrapper, handle404, globalErrorHandler };
