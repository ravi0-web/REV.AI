/**
 * Rev.AI — Express Server Entry Point
 *
 * Sets up the Express app with:
 *  - CORS (cross-origin support for frontend dev server)
 *  - JSON body parsing
 *  - Review API routes at /api/reviews
 *  - 404 handler for unknown routes
 *  - Global error handler (500)
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const reviewRoutes = require('./routes/reviewRoutes');

// ── Create Express App ───────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────

// Enable CORS for all origins (frontend dev server is on a different port)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Request logger — logs method, URL, and timestamp for every request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── API Routes ───────────────────────────────

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rev.AI server is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount review routes
app.use('/api/reviews', reviewRoutes);

// ── 404 Handler ──────────────────────────────
// Catches any request to an undefined route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler ─────────────────────
// Catches any errors thrown by route handlers via next(err)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// ── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Rev.AI server running on http://localhost:${PORT}`);
  console.log(`📡 API base: http://localhost:${PORT}/api/reviews`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});
