/**
 * Rev.AI — Express Server Entry Point
 *
 * Startup sequence:
 *  1. Load environment variables from .env
 *  2. Connect to MongoDB Atlas (exits on failure)
 *  3. Configure Express middleware (helmet, cors, morgan, compression)
 *  4. Mount API routes
 *  5. Attach 404 and global error handlers
 *  6. Start HTTP server
 */

const express      = require('express');
const cors         = require('cors');
const dotenv       = require('dotenv');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');

// ── Load .env before anything else ──────────────────────
dotenv.config();

const { connectDB, disconnectDB } = require('./config/db');
const reviewRoutes                = require('./routes/reviewRoutes');
const { handle404, globalErrorHandler } = require('./middleware/errorHandler');

// ── Create Express App ──────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & Performance Middleware ───────────────────

// Helmet — sets secure HTTP response headers
app.use(helmet());

// CORS — allow requests from the Vite dev server and production origin
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:4173', // Vite preview
  process.env.CLIENT_ORIGIN, // optional production URL from env
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
    },
    methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:  true,
  })
);

// Compression — gzip responses to reduce payload size
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Morgan — HTTP request logger
// Use 'dev' format in development, 'combined' in production
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// ── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState  = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.status(200).json({
    success:   true,
    message:   'Rev.AI server is running',
    db:        dbState[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
    env:       process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ───────────────────────────────────────────
app.use('/api/reviews', reviewRoutes);

// ── 404 & Global Error Handlers ─────────────────────────
// Must be mounted AFTER all routes
app.use(handle404);
app.use(globalErrorHandler);

// ── Start Server (after DB connects) ────────────────────
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀  Rev.AI server running on  http://localhost:${PORT}`);
    console.log(`📡  API base:                 http://localhost:${PORT}/api/reviews`);
    console.log(`💚  Health check:             http://localhost:${PORT}/api/health\n`);
  });

  // ── Graceful Shutdown ──────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('✅  Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌  Unhandled Rejection:', err.message);
    shutdown('unhandledRejection');
  });
};

startServer();
