const express = require("express");
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  analyzeBoard,
} = require("../controllers/canvasController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/notes", createNote);
router.get("/notes", getNotes);
router.put("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);
router.post("/analyze", analyzeBoard);

module.exports = router;