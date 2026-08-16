const mongoose = require("mongoose");

const brandBriefSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    positioning: {
      type: String,
      default: "",
    },
    tagline: {
      type: String,
      default: "",
    },
    tone: {
      type: String,
      default: "",
    },
    targetAudience: {
      type: String,
      default: "",
    },
    mission: {
      type: String,
      default: "",
    },
    contentPillars: {
      type: [String],
      default: [],
    },
    pillarWeights: {
      type: Map,
      of: Number,
      default: {},
    },
    preferredPlatforms: {
      type: [String],
      default: [],
    },
    postingFrequency: {
      type: String,
      default: "",
    },
    topicsLoved: {
      type: [String],
      default: [],
    },
    thingsToAvoid: {
      type: String,
      default: "",
    },
    inspirations: {
      type: String,
      default: "",
    },
    biggestChallenge: {
      type: String,
      default: "",
    },
    notFor: {
      type: String,
      default: "",
    },
    differentiator: {
      type: String,
      default: "",
    },
    rawAnswers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BrandBrief", brandBriefSchema);