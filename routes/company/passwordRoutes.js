const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");

const {
  changePassword,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} = require("../../controllers/company/passwordController");

// Settings → Change Password
router.put(
  "/change-password",
  auth,
  changePassword
);

// Login → Forgot Password
router.post(
  "/forgot-password/send-otp",
  sendForgotPasswordOtp
);

router.post(
  "/forgot-password/verify-otp",
  verifyForgotPasswordOtp
);

router.post(
  "/forgot-password/reset",
  resetPassword
);

module.exports = router;