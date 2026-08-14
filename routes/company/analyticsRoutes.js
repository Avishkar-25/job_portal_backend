const express = require("express");

const router = express.Router();

const auth = require("../../middleware/authMiddleware");

const {
  getCompanyAnalytics,
} = require("../../controllers/company/analyticsController");

// ==========================================
// GET COMPANY ANALYTICS
// ==========================================

router.get(
  "/",
  auth,
  getCompanyAnalytics
);

module.exports = router;