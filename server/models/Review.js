/**
 * Review Model — Rev.AI
 *
 * Defines the data shape for a review document and provides
 * a factory function + validation. When MongoDB is added,
 * this will become a Mongoose schema.
 */

const { v4: uuidv4 } = require('uuid');

// Theme icon mapping (matches frontend)
const THEME_ICONS = {
  food: '🍽️',
  host: '👤',
  location: '📍',
  cleanliness: '✨',
  value: '💰',
  experience: '⭐',
};

// Valid values for validation
const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'];
const VALID_THEMES = ['food', 'host', 'location', 'cleanliness', 'value', 'experience'];

/**
 * Create a new Review object from raw text and analysis results.
 *
 * @param {string} reviewText - The original guest review
 * @param {Object} analysis - { sentiment, theme, response } from geminiService
 * @returns {Object} A complete review document
 */
function createReview(reviewText, analysis) {
  return {
    id: uuidv4(),
    reviewText: reviewText.trim(),
    sentiment: analysis.sentiment,
    theme: analysis.theme,
    themeIcon: THEME_ICONS[analysis.theme] || '🏷️',
    response: analysis.response,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Validate that a review text is a non-empty string.
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
  if (text.trim().length > 5000) {
    return { valid: false, error: 'Review text cannot exceed 5000 characters' };
  }
  return { valid: true };
}

module.exports = {
  createReview,
  validateReviewText,
  THEME_ICONS,
  VALID_SENTIMENTS,
  VALID_THEMES,
};
