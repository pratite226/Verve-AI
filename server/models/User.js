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
    password: {
      type: String,
      required: true,
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
  },
  { timestamps: true } // auto-adds createdAt + updatedAt
);

module.exports = mongoose.model("User", userSchema);