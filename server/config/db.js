/**
 * MongoDB Connection — Rev.AI
 *
 * Connects to MongoDB Atlas using Mongoose.
 * The MONGO_URI must be set in the .env file.
 * Never hardcode credentials here.
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas.
 * Exits the process if the connection cannot be established.
 *
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌  MONGO_URI is not defined in the .env file.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4, // Force IPv4 — fixes Node.js SRV DNS resolution on Windows
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);

    // ── Connection event listeners ──────────────────
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️   MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄  MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌  MongoDB connection error:', err.message);
    });

  } catch (err) {
    console.error('❌  Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection.
 * Call this on SIGTERM / SIGINT.
 *
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('🔌  MongoDB connection closed.');
};

module.exports = { connectDB, disconnectDB };
