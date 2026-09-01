const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Optional because Google-only accounts (see authController.js's googleAuth) never set
    // one — they authenticate purely via Google ID token verification, not a local secret.
    password: {
      type: String,
      required: false,
    },
    // Google's stable per-account identifier ("sub" claim in the ID token) — not the email,
    // since a user could change their Google account's email but "sub" never changes. Sparse
    // so the unique index doesn't reject multiple documents that all lack this field (every
    // email/password-only account).
    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    industry: {
      type: String,
      default: "",
    },
    careerStage: {
      type: String,
      default: "",
    },
    goals: {
      type: String,
      default: "",
    },
    ageRange: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    interests: {
      type: [String],
      default: [],
    },
    // Only the SHA-256 hash of the reset token is stored, never the raw token — the raw
    // token only ever exists in the emailed link and in the client's URL. Unlike the
    // password, this doesn't need bcrypt: the token is high-entropy random data (not a
    // human-chosen secret an attacker could dictionary-guess), so a fast hash is enough to
    // stop a stolen database dump from being usable as valid reset tokens.
    resetPasswordTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true } // auto-adds createdAt + updatedAt
);

module.exports = mongoose.model("User", userSchema);