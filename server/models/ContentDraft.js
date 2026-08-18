const mongoose = require("mongoose");

const contentDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: {
      type: String,
      enum: ["linkedin", "instagram", "twitter"],
      required: true,
    },
    topic: {
      type: String,
      default: "",
    },
    pillar: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "posted"],
      default: "draft",
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Both compound indexes match real query patterns in contentController.js:
// getContent-style status filtering, and getPlanner's date-range lookups — both always
// scoped to a single user first, so userId leads each compound index.
contentDraftSchema.index({ userId: 1, status: 1 });
contentDraftSchema.index({ userId: 1, scheduledDate: 1 });

module.exports = mongoose.model("ContentDraft", contentDraftSchema);