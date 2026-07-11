/**
 * Auth Middleware — Rev.AI
 *
 * verifyToken: Reads Authorization header, verifies JWT,
 *              and attaches the decoded payload to req.user.
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware that protects routes by validating the JWT.
 *
 * Reads the token from:
 *   Authorization: Bearer <token>
 *
 * On success: attaches { id, email } to req.user and calls next()
 * On failure: returns 401 Unauthorized
 */
const verifyToken = async (req, res, next) => {
  try {
    // ── Extract token from Authorization header ───────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error:   'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error:   'Access denied. Token is missing.',
      });
    }

    // ── Verify JWT ────────────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Attach user info to request ───────────────────
    // Optionally fetch full user from DB (useful for role checks)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error:   'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    // Handle specific JWT errors with clear messages
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error:   'Invalid token. Please log in again.',
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error:   'Token has expired. Please log in again.',
      });
    }

    // Unexpected error
    return res.status(500).json({
      success: false,
      error:   'Authentication failed. Please try again.',
    });
  }
};

module.exports = { verifyToken };
