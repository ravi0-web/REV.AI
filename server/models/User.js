/**
 * User Model — Rev.AI
 *
 * Mongoose schema for application users.
 * Supports both local (email/password) and Google OAuth login.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    // ── Core Identity ─────────────────────────────────
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // ── Auth ──────────────────────────────────────────
    password: {
      type:     String,
      required: false,          // not required for Google OAuth users
      minlength: [6, 'Password must be at least 6 characters'],
      select:   false,          // never returned by default in queries
    },

    provider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },

    googleId: {
      type:   String,
      unique: true,
      sparse: true,             // allows multiple null values
    },

    // ── Profile ───────────────────────────────────────
    profilePicture: {
      type:    String,
      default: '',
    },
  },
  {
    timestamps: true,           // adds createdAt + updatedAt automatically
  }
);


// ── Pre-save Hook: Hash password before saving ────────────
UserSchema.pre('save', async function () {
  // Only hash if password field was modified (or is new)
  if (!this.isModified('password') || !this.password) return;

  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Method: Compare password ────────────────────
/**
 * Compare a plain-text password with the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance Method: Safe user object (no password) ───────
UserSchema.methods.toSafeObject = function () {
  return {
    _id:            this._id,
    name:           this.name,
    email:          this.email,
    profilePicture: this.profilePicture,
    provider:       this.provider,
    createdAt:      this.createdAt,
    updatedAt:      this.updatedAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
