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
    // since a user could change their Google account's email but "sub" never changes.
    // Deliberately NO `default` here: email/password accounts must leave this field absent,
    // not set it to null. The unique constraint is a partial index (declared below) that
    // only covers string values, so any number of Google-less accounts can coexist. A plain
    // `sparse: true` unique index would NOT be enough — `default: null` writes the field on
    // every account, and a sparse index still indexes documents whose value is null, so the
    // second null collides (E11000). See config/repairIndexes.js for the migration that
    // drops the old sparse index on existing databases.
    googleId: {
      type: String,
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

// Partial unique index: only documents where `googleId` is an actual string are indexed, so
// every email/password account (field absent) is free to omit it without colliding. Keep in
// sync with the desired-index check in config/repairIndexes.js.
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
);

module.exports = mongoose.model("User", userSchema);