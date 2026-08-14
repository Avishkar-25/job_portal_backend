const express = require("express");

const router = express.Router();

const {
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPassword
} = require("../../controllers/employee/passwordController");


// Send OTP
router.post(
    "/forgot-password/send-otp",
    sendForgotPasswordOtp
);


// Verify OTP
router.post(
    "/forgot-password/verify-otp",
    verifyForgotPasswordOtp
);


// Reset Password
router.post(
    "/forgot-password/reset",
    resetPassword
);


module.exports = router;