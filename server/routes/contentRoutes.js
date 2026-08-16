const express = require("express");
const {
  generateContent,
  generateMultiPlatform,
  getContent,
  deleteContent,
  scheduleContent,
  updateContentStatus,
  refineContent,
  generateWeeklyPlanContent,
  getPlanner,
  getContentIdeas,
} = require("../controllers/contentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/generate", generateContent);
router.post("/generate-multi", generateMultiPlatform);
router.post("/ideas", getContentIdeas);
router.post("/planner/generate", generateWeeklyPlanContent);
router.get("/planner", getPlanner);
router.get("/", getContent);
router.put("/:id/schedule", scheduleContent);
router.put("/:id/status", updateContentStatus);
router.put("/:id/refine", refineContent);
router.delete("/:id", deleteContent);

module.exports = router;