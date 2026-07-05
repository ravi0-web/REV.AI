/**
 * API Response Helpers — Rev.AI
 *
 * Provides consistent JSON response shapes across all endpoints.
 * Every success and error response should go through these helpers.
 */

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {*}      data       - The response payload
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Object} [meta={}]  - Optional metadata (e.g. pagination)
 */
const sendSuccess = (res, data, statusCode = 200, meta = {}) => {
  const body = {
    success: true,
    ...meta,
  };

  // Don't include a `data` key for 204 No Content
  if (statusCode !== 204) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
};

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res
 * @param {string} message    - Human-readable error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Array}  [details]  - Optional validation error details
 */
const sendError = (res, message, statusCode = 500, details = null) => {
  const body = {
    success: false,
    error:   message,
  };

  if (details && details.length > 0) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
