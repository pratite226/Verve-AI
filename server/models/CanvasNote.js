const mongoose = require("mongoose");

const canvasNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    content: {
      type: String,
      required: true, // text content, or image URL if type is "image"
    },
    x: {
      type: Number,
      default: 40,
    },
    y: {
      type: Number,
      default: 40,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CanvasNote", canvasNoteSchema);