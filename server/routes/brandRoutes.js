const express = require("express");
const { generateBrand, getBrand, updateBrand } = require("../controllers/brandController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/generate", generateBrand);
router.get("/", getBrand);
router.put("/", updateBrand);

module.exports = router;