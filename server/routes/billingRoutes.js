const express = require("express");
const {
  getPlans,
  getInvoices,
  getSummary,
  createCheckout,
} = require("../controllers/billingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Plans are public — a logged-out visitor should be able to see pricing.
router.get("/plans", getPlans);

// Note: POST /webhook is intentionally NOT mounted here — it needs the raw request body
// (see server.js) which must be wired up before express.json() parses it, so it's mounted
// directly on `app` ahead of this router.

router.use(protect);
router.get("/invoices", getInvoices);
router.get("/summary", getSummary);
router.post("/checkout", createCheckout);

module.exports = router;
