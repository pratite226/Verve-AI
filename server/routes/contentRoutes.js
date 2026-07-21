const express = require("express");
const {
  generateContent,
  generateMultiPlatform,
  getContent,
  deleteContent,
  scheduleContent,
  getPlanner,
  getContentIdeas,
} = require("../controllers/contentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/generate", generateContent);
router.post("/generate-multi", generateMultiPlatform);
router.post("/ideas", getContentIdeas);
router.get("/planner", getPlanner);
router.get("/", getContent);
router.put("/:id/schedule", scheduleContent);
router.delete("/:id", deleteContent);

module.exports = router;