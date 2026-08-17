const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const transporter = require("../../config/mail");

// =====================================================
// CHANGE PASSWORD - SETTINGS
// =====================================================

exports.changePassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    const [users] = await db.promise().query(
      `
      SELECT user_id, password
      FROM users
      WHERE user_id = ?
      AND user_type = 'company'
      `,
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company account not found",
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await db.promise().query(
      `
      UPDATE users
      SET password = ?
      WHERE user_id = ?
      `,
      [hashedPassword, user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =====================================================
// SEND FORGOT PASSWORD OTP
// =====================================================


exports.sendForgotPasswordOtp = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }


    // =====================================================
    // COMPANY ACCOUNT ONLY
    // =====================================================

    const [users] = await db.promise().query(
      `
      SELECT
        user_id,
        name,
        email
      FROM users
      WHERE email = ?
      AND user_type = 'company'
      LIMIT 1
      `,
      [email]
    );


    if (users.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Company account not found",
      });

    }


    const user = users[0];


    // =====================================================
    // GENERATE OTP
    // =====================================================

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();


    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );


    // =====================================================
    // DELETE OLD OTP
    // =====================================================

    await db.promise().query(
      `
      DELETE FROM password_reset_otps
      WHERE user_id = ?
      `,
      [user.user_id]
    );


    // =====================================================
    // SAVE OTP
    // =====================================================

    await db.promise().query(
      `
      INSERT INTO password_reset_otps
      (
        user_id,
        email,
        otp,
        expires_at,
        is_verified
      )
      VALUES (?, ?, ?, ?, 0)
      `,
      [
        user.user_id,
        user.email,
        otp,
        expiresAt
      ]
    );


    // =====================================================
    // SEND OTP EMAIL
    // =====================================================

    await transporter.sendMail({

      // IMPORTANT:
      // Use same variable as nodemailer.js

      from: `"Job Portal" <${process.env.EMAIL_USER}>`,

      to: user.email,

      subject: "Job Portal - Password Reset OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 12px;
          background: #ffffff;
        ">

          <h2 style="
            color:#0d6efd;
            margin-bottom:20px;
          ">
            Password Reset
          </h2>

          <p>
            Hello <strong>${user.name || "Company"}</strong>,
          </p>

          <p>
            We received a request to reset your
            Job Portal company account password.
          </p>

          <p>
            Your OTP is:
          </p>

          <h1 style="
            letter-spacing: 10px;
            color: #0d6efd;
            text-align:center;
          ">
            ${otp}
          </h1>

          <p>
            This OTP is valid for
            <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request this password reset,
            please ignore this email.
          </p>

          <hr>

          <small>
            Job Portal Security Team
          </small>

        </div>
      `
    });


    console.log(
      "✅ Password reset OTP sent:",
      user.email
    );


    return res.status(200).json({

      success: true,

      message: "OTP sent successfully to your email"

    });


  } catch (error) {

    console.error(
      "❌ Send OTP Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message: "Failed to send OTP",

      error: error.message

    });

  }

};


// =====================================================
// VERIFY OTP
// =====================================================

exports.verifyForgotPasswordOtp = async (req, res) => {

  try {

    const { email, otp } = req.body;


    if (!email || !otp) {

      return res.status(400).json({

        success: false,

        message: "Email and OTP are required"

      });

    }


    const [rows] = await db.promise().query(
      `
      SELECT *
      FROM password_reset_otps
      WHERE email = ?
      AND otp = ?
      AND is_verified = 0
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        email,
        otp
      ]
    );


    if (rows.length === 0) {

      return res.status(400).json({

        success: false,

        message: "Invalid OTP"

      });

    }


    const resetData = rows[0];


    // =====================================================
    // CHECK EXPIRY
    // =====================================================

    if (
      new Date(resetData.expires_at) < new Date()
    ) {

      return res.status(400).json({

        success: false,

        message:
          "OTP has expired. Please request a new OTP"

      });

    }


    // =====================================================
    // MARK VERIFIED
    // =====================================================

    await db.promise().query(
      `
      UPDATE password_reset_otps
      SET is_verified = 1
      WHERE id = ?
      `,
      [resetData.id]
    );


    return res.status(200).json({

      success: true,

      message: "OTP verified successfully",

      user_id: resetData.user_id

    });


  } catch (error) {

    console.error(
      "❌ Verify OTP Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message: "Server error",

      error: error.message

    });

  }

};



// =====================================================
// RESET PASSWORD
// =====================================================

exports.resetPassword = async (req, res) => {
  try {
    const {
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !email ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Get verified OTP
    const [resetRows] = await db.promise().query(
      `
      SELECT *
      FROM password_reset_otps
      WHERE email = ?
      AND is_verified = 1
      ORDER BY id DESC
      LIMIT 1
      `,
      [email]
    );

    if (resetRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    const resetData = resetRows[0];

    // Get company user
    const [users] = await db.promise().query(
      `
      SELECT user_id, password
      FROM users
      WHERE user_id = ?
      AND user_type = 'company'
      `,
      [resetData.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company account not found",
      });
    }

    const user = users[0];

    // Check old password
    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from old password",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // Update password
    await db.promise().query(
      `
      UPDATE users
      SET password = ?
      WHERE user_id = ?
      `,
      [
        hashedPassword,
        resetData.user_id,
      ]
    );

    // Delete used OTP
    await db.promise().query(
      `
      DELETE FROM password_reset_otps
      WHERE user_id = ?
      `,
      [resetData.user_id]
    );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login.",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};