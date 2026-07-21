const express = require("express");
const { optimizeProfile } = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/optimize", optimizeProfile);

module.exports = router;