const mongoose = require("mongoose");

// One document per user, embedding a capped rolling window of daily snapshots.
// Embedded (not a separate referenced collection per day) because snapshots are always
// read/written together with the user, and the array is bounded — pruned to the last 90
// days by the nightly cron job (server/jobs/index.js) — so it can't grow unbounded.
const dailySnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD, so upserting "today's" snapshot is a plain string match
      required: true,
    },
    postsCreated: {
      type: Number,
      default: 0,
    },
    postsByPlatform: {
      linkedin: { type: Number, default: 0 },
      instagram: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
    },
    postsByStatus: {
      draft: { type: Number, default: 0 },
      scheduled: { type: Number, default: 0 },
      posted: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const analyticsSchema = new mongoose.Schema(
  {
    // Referenced (not embedded): stores the User's _id rather than copying User fields onto
    // this document. Contrast with dailySnapshots below, which IS embedded. `ref: "User"`
    // is what makes this dereferenceable via `.populate("userId", ...)` — see
    // analyticsController.getOverview, which does exactly that to pull profile fields
    // without duplicating them here.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dailySnapshots: {
      type: [dailySnapshotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);
