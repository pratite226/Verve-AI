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

module.exports = mongoose.model("ContentDraft", contentDraftSchema);