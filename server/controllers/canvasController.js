const CanvasNote = require("../models/CanvasNote");
const BrandBrief = require("../models/BrandBrief");
const { generateCanvasAnalysis } = require("../services/aiService");

// @route POST /api/canvas/notes
// Body: { "type": "text"|"image", "content": "...", "x": 40, "y": 40 }
const createNote = async (req, res) => {
  try {
    const { type, content, x, y } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: "content is required" });
    }

    const note = await CanvasNote.create({
      userId: req.user._id,
      type: type || "text",
      content,
      x: x ?? 40,
      y: y ?? 40,
    });

    return res.status(201).json({ success: true, note });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/canvas/notes
const getNotes = async (req, res) => {
  try {
    const notes = await CanvasNote.find({ userId: req.user._id }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, notes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/canvas/notes/:id
// Body: any subset of { content, x, y }
const updateNote = async (req, res) => {
  try {
    const allowedFields = ["content", "x", "y"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const note = await CanvasNote.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    return res.status(200).json({ success: true, note });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/canvas/notes/:id
const deleteNote = async (req, res) => {
  try {
    const note = await CanvasNote.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    return res.status(200).json({ success: true, message: "Note deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/canvas/analyze
const analyzeBoard = async (req, res) => {
  try {
    const notes = await CanvasNote.find({ userId: req.user._id, type: "text" });

    if (notes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Add some text notes to your board before analyzing",
      });
    }

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    const textNotes = notes.map((n) => n.content);
    const analysis = await generateCanvasAnalysis(brief, textNotes);

    return res.status(200).json({ success: true, ...analysis });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createNote, getNotes, updateNote, deleteNote, analyzeBoard };