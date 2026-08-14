const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const transporter = require("../../config/mail");

// =====================================================
// SEND FORGOT PASSWORD OTP - EMPLOYEE
// =====================================================

exports.sendForgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Find employee from users table
        const [users] = await db.promise().query(
            `
            SELECT user_id, name, email, user_type
            FROM users
            WHERE email = ?
            AND user_type = 'employee'
            LIMIT 1
            `,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No employee account found with this email"
            });
        }

        const user = users[0];

        // Generate 6 digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP valid for 10 minutes
        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Delete previous OTP
        await db.promise().query(
            `
            DELETE FROM password_reset_otps
            WHERE user_id = ?
            `,
            [user.user_id]
        );

        // Insert new OTP
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

        // Send OTP email
        await transporter.sendMail({
            from: process.env.MAIL_USER,
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
                        color: #0d6efd;
                        margin-bottom: 20px;
                    ">
                        Job Portal Password Reset
                    </h2>

                    <p>
                        Hello <strong>${user.name || "Employee"}</strong>,
                    </p>

                    <p>
                        We received a request to reset your
                        Job Portal account password.
                    </p>

                    <p>
                        Your OTP is:
                    </p>

                    <div style="
                        text-align: center;
                        margin: 25px 0;
                    ">
                        <span style="
                            display: inline-block;
                            padding: 15px 25px;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            color: #0d6efd;
                            background: #f0f6ff;
                            border-radius: 10px;
                        ">
                            ${otp}
                        </span>
                    </div>

                    <p>
                        This OTP is valid for
                        <strong>10 minutes</strong>.
                    </p>

                    <p style="color: #777;">
                        If you did not request a password reset,
                        please ignore this email.
                    </p>

                    <hr>

                    <p style="
                        font-size: 13px;
                        color: #777;
                    ">
                        Job Portal Security Team
                    </p>

                </div>
            `
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully to your email"
        });

    } catch (error) {

        console.error(
            "Employee Send OTP Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
};


// =====================================================
// VERIFY FORGOT PASSWORD OTP - EMPLOYEE
// =====================================================

exports.verifyForgotPasswordOtp = async (req, res) => {
    try {

        const { email, otp } = req.body;

        // Validation
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        // Find valid OTP
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
            [email, otp]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        const resetData = rows[0];

        // Check expiry
        if (
            new Date(resetData.expires_at) <
            new Date()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP has expired. Please request a new OTP"
            });
        }

        // Mark OTP as verified
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
            "Employee Verify OTP Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// =====================================================
// RESET PASSWORD - EMPLOYEE
// =====================================================

exports.resetPassword = async (req, res) => {
    try {

        const {
            email,
            newPassword,
            confirmPassword
        } = req.body;

        // Validation
        if (
            !email ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }

        // Password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password and confirm password do not match"
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
                message:
                    "Please verify OTP first"
            });
        }

        const resetData = resetRows[0];

        // Get employee password
        const [users] = await db.promise().query(
            `
            SELECT password
            FROM users
            WHERE user_id = ?
            AND user_type = 'employee'
            LIMIT 1
            `,
            [resetData.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // Check old password
        const samePassword = await bcrypt.compare(
            newPassword,
            users[0].password
        );

        if (samePassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from old password"
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
            AND user_type = 'employee'
            `,
            [
                hashedPassword,
                resetData.user_id
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
                "Password reset successfully"
        });

    } catch (error) {

        console.error(
            "Employee Reset Password Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};