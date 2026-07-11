/**
 * AI Controller — Rev.AI
 *
 * Handles all Gemini AI endpoints:
 *  - POST /api/ai/chat       — General chat with Gemini
 *  - POST /api/ai/summarize  — Summarize a block of text
 *  - POST /api/ai/recommend  — Get hospitality recommendations
 */

const { chat, summarize, recommend } = require('../services/geminiService');
const { validationResult } = require('express-validator');

// ── Helper: format validation errors ─────────────────────
const formatErrors = (errors) => errors.array().map((e) => e.msg);

// ─────────────────────────────────────────────────────────
//  CHAT
// ─────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Send a message to Gemini and get a reply.
 *
 * Body:    { message: string }
 * Returns: { reply: string }
 */
const chatHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: formatErrors(errors),
      });
    }

    const { message } = req.body;
    const reply = await chat(message);

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error('AI chat error:', err.message);
    return res.status(500).json({
      success: false,
      error:   err.message || 'AI request failed. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────
//  SUMMARIZE
// ─────────────────────────────────────────────────────────

/**
 * POST /api/ai/summarize
 * Summarize a block of review text.
 *
 * Body:    { text: string }
 * Returns: { summary: string }
 */
const summarizeHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: formatErrors(errors),
      });
    }

    const { text } = req.body;
    const summary = await summarize(text);

    return res.status(200).json({ success: true, summary });
  } catch (err) {
    console.error('AI summarize error:', err.message);
    return res.status(500).json({
      success: false,
      error:   err.message || 'AI summarization failed. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────
//  RECOMMEND
// ─────────────────────────────────────────────────────────

/**
 * POST /api/ai/recommend
 * Get hospitality improvement recommendations based on review text.
 *
 * Body:    { reviewText: string }
 * Returns: { recommendations: string }
 */
const recommendHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: formatErrors(errors),
      });
    }

    const { reviewText } = req.body;
    const recommendations = await recommend(reviewText);

    return res.status(200).json({ success: true, recommendations });
  } catch (err) {
    console.error('AI recommend error:', err.message);
    return res.status(500).json({
      success: false,
      error:   err.message || 'AI recommendation failed. Please try again.',
    });
  }
};

module.exports = { chatHandler, summarizeHandler, recommendHandler };
