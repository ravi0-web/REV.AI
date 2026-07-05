/**
 * Error Handler Middleware — Rev.AI
 *
 * Provides:
 *  - asyncWrapper   : wraps async route handlers to auto-forward errors
 *  - handle404      : catches unmatched routes
 *  - globalErrorHandler : centralized error response formatter
 */

const mongoose = require('mongoose');

// ── Async Wrapper ────────────────────────────────────────
/**
 * Wraps an async route handler so any thrown error is
 * automatically forwarded to Express's next(err).
 *
 * Usage:
 *   router.get('/path', asyncWrapper(myAsyncHandler));
 *
 * @param {Function} fn - Async route handler (req, res, next)
 * @returns {Function} Express middleware
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── 404 Handler ──────────────────────────────────────────
/**
 * Catches any request to an undefined route.
 * Must be mounted AFTER all other routes.
 */
const handle404 = (req, res) => {
  res.status(404).json({
    success: false,
    error:   `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

// ── Global Error Handler ─────────────────────────────────
/**
 * Centralized error handler. Must have 4 parameters (err, req, res, next)
 * for Express to recognize it as an error-handling middleware.
 *
 * Handles:
 *  - Mongoose CastError (invalid ObjectId) → 400
 *  - Mongoose ValidationError              → 422
 *  - Mongoose Duplicate Key Error (11000)  → 409
 *  - Generic errors                        → 500
 */
const globalErrorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`\n❌  [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('   Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose CastError — invalid ObjectId format
  if (err instanceof mongoose.Error.CastError && err.path === '_id') {
    return res.status(400).json({
      success: false,
      error:   `Invalid ID format: "${err.value}" is not a valid MongoDB ObjectId.`,
    });
  }

  // Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      success: false,
      error:   'Validation failed',
      details,
    });
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error:   `Duplicate value for "${field}". Please use a different value.`,
    });
  }

  // Custom app errors with a status code
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error:   err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { asyncWrapper, handle404, globalErrorHandler };
