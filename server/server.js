/**
 * Rev.AI — Express Server Entry Point (Week 6 — Auth + AI upgrade)
 *
 * Startup sequence:
 *  1. Load environment variables from .env
 *  2. Initialize Passport (Google OAuth)
 *  3. Connect to MongoDB Atlas
 *  4. Configure middleware (helmet, cors, morgan, compression, rate-limit)
 *  5. Mount API routes
 *  6. Attach 404 and global error handlers
 *  7. Start HTTP server
 */

const express      = require('express');
const cors         = require('cors');
const dotenv       = require('dotenv');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const mongoose     = require('mongoose');

// ── Load .env before anything else ──────────────────────
dotenv.config();

// ── Initialize Passport (must be after dotenv.config) ───
require('./config/passport');
const passport = require('passport');

const { connectDB, disconnectDB }              = require('./config/db');
const reviewRoutes                             = require('./routes/reviewRoutes');
const authRoutes                               = require('./routes/authRoutes');
const aiRoutes                                 = require('./routes/aiRoutes');
const { handle404, globalErrorHandler }        = require('./middleware/errorHandler');

// ── Create Express App ──────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──────────────────────────────────

// Helmet — sets secure HTTP response headers
app.use(helmet());

// CORS — allow requests from Vite dev server, Vercel, and production origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow all Vercel preview/production deployments
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
    },
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    true,
  })
);

// Global rate limiter — 200 requests per 15 minutes (per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message: {
    success: false,
    error:   'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/api/', globalLimiter);

// Compression — gzip responses
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport — initialize (no session, using JWT)
app.use(passport.initialize());

// Morgan — HTTP request logger
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    success:   true,
    message:   'Rev.AI server is running',
    db:        dbState[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
    env:       process.env.NODE_ENV || 'development',
    features: {
      auth:   true,
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    },
  });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/ai',      aiRoutes);
app.use('/api/reviews', reviewRoutes);

// ── 404 & Global Error Handlers ──────────────────────────
app.use(handle404);
app.use(globalErrorHandler);

// ── Start Server (after DB connects) ─────────────────────
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀  Rev.AI server running on  http://localhost:${PORT}`);
    console.log(`📡  Reviews API:              http://localhost:${PORT}/api/reviews`);
    console.log(`🔐  Auth API:                 http://localhost:${PORT}/api/auth`);
    console.log(`🤖  AI API:                   http://localhost:${PORT}/api/ai`);
    console.log(`💚  Health check:             http://localhost:${PORT}/api/health\n`);
  });

  // Graceful Shutdown
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

  process.on('unhandledRejection', (err) => {
    console.error('❌  Unhandled Rejection:', err.message);
    shutdown('unhandledRejection');
  });
};

startServer();
