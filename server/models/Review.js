/**
 * Review Model — Rev.AI
 *
 * Mongoose schema for a guest review document.
 * Replaces the previous plain-object factory.
 * A virtual `id` field maps _id → id for frontend compatibility.
 */

const mongoose = require('mongoose');

// ── Constants (shared with frontend) ─────────────────────
const THEME_ICONS = {
  food:        '🍽️',
  host:        '👤',
  location:    '📍',
  cleanliness: '✨',
  value:       '💰',
  experience:  '⭐',
};

const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'];
const VALID_THEMES     = ['food', 'host', 'location', 'cleanliness', 'value', 'experience'];

// ── Schema ───────────────────────────────────────────────
const ReviewSchema = new mongoose.Schema(
  {
    reviewText: {
      type:      String,
      required:  [true, 'Review text is required'],
      trim:      true,
      minlength: [5,    'Review text must be at least 5 characters'],
      maxlength: [5000, 'Review text cannot exceed 5000 characters'],
    },
    sentiment: {
      type:     String,
      required: [true, 'Sentiment is required'],
      enum: {
        values:  VALID_SENTIMENTS,
        message: 'Sentiment must be positive, neutral, or negative',
      },
    },
    theme: {
      type:     String,
      required: [true, 'Theme is required'],
      enum: {
        values:  VALID_THEMES,
        message: `Theme must be one of: ${VALID_THEMES.join(', ')}`,
      },
    },
    themeIcon: {
      type:    String,
      default: '🏷️',
    },
    response: {
      type:     String,
      required: [true, 'Response is required'],
      trim:     true,
    },
    analyzedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────
// Text index for full-text search on reviewText, response, and theme
ReviewSchema.index({ reviewText: 'text', response: 'text', theme: 'text' });

// Compound index for common filter queries
ReviewSchema.index({ sentiment: 1, theme: 1, analyzedAt: -1 });

// ── Validation helper (used by controller) ───────────────
/**
 * Validate that a review text is a non-empty string within limits.
 *
 * @param {*} text - The value to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateReviewText(text) {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Review text must be a string' };
  }
  if (text.trim().length === 0) {
    return { valid: false, error: 'Review text cannot be empty' };
  }
  if (text.trim().length < 5) {
    return { valid: false, error: 'Review text must be at least 5 characters' };
  }
  if (text.trim().length > 5000) {
    return { valid: false, error: 'Review text cannot exceed 5000 characters' };
  }
  return { valid: true };
}

const Review = mongoose.model('Review', ReviewSchema);

module.exports = {
  Review,
  validateReviewText,
  THEME_ICONS,
  VALID_SENTIMENTS,
  VALID_THEMES,
};
