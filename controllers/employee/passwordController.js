const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const sendEmail = require("../../config/mailer");

// =====================================================
// SEND FORGOT PASSWORD OTP - EMPLOYEE
// =====================================================

exports.sendForgotPasswordOtp = async (req, res) => {
    try {

        const { email } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // =====================================================
        // FIND EMPLOYEE
        // =====================================================

        const [users] = await db.promise().query(
            `
            SELECT
                user_id,
                name,
                email,
                user_type
            FROM users
            WHERE email = ?
            AND user_type = 'employee'
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No employee account found with this email"
            });
        }

        const user = users[0];

        // =====================================================
        // GENERATE OTP
        // =====================================================

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP valid for 10 minutes
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
        // SAVE NEW OTP
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
        // SEND OTP USING BREVO
        // =====================================================

        await sendEmail({

            to: user.email,

            toName: user.name || "Employee",

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
                        Hello
                        <strong>
                            ${user.name || "Employee"}
                        </strong>,
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
            `,

            text: `
Job Portal Password Reset

Hello ${user.name || "Employee"},

Your password reset OTP is: ${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset,
please ignore this email.

Job Portal Security Team
            `
        });

        console.log(
            "✅ Employee OTP sent successfully:",
            user.email
        );

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "OTP sent successfully to your email"

        });

    } catch (error) {

        console.error(
            "❌ Employee Send OTP Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to send OTP",

            error:
                error.message

        });
    }
};


// =====================================================
// VERIFY FORGOT PASSWORD OTP - EMPLOYEE
// =====================================================

exports.verifyForgotPasswordOtp = async (req, res) => {

    try {

        const { email, otp } = req.body;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!email || !otp) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required"

            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const normalizedOtp =
            otp.toString().trim();

        // =====================================================
        // FIND OTP
        // =====================================================

        const [rows] = await db.promise().query(
            `
            SELECT
                id,
                user_id,
                email,
                otp,
                expires_at,
                is_verified
            FROM password_reset_otps
            WHERE email = ?
            AND otp = ?
            AND is_verified = 0
            ORDER BY id DESC
            LIMIT 1
            `,
            [
                normalizedEmail,
                normalizedOtp
            ]
        );

        // =====================================================
        // INVALID OTP
        // =====================================================

        if (rows.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP"

            });
        }

        const resetData = rows[0];

        // =====================================================
        // CHECK EXPIRY
        // =====================================================

        const currentTime = new Date();

        const expiryTime =
            new Date(resetData.expires_at);

        if (expiryTime <= currentTime) {

            await db.promise().query(
                `
                DELETE FROM password_reset_otps
                WHERE id = ?
                `,
                [resetData.id]
            );

            return res.status(400).json({

                success: false,

                message:
                    "OTP has expired. Please request a new OTP"

            });
        }

        // =====================================================
        // VERIFY OTP
        // =====================================================

        await db.promise().query(
            `
            UPDATE password_reset_otps
            SET is_verified = 1
            WHERE id = ?
            `,
            [resetData.id]
        );

        console.log(
            `✅ Employee OTP verified: ${resetData.email}`
        );

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "OTP verified successfully",

            user_id:
                resetData.user_id

        });

    } catch (error) {

        console.error(
            "❌ Employee Verify OTP Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Server error",

            error:
                error.message

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

        // =====================================================
        // VALIDATION
        // =====================================================

        if (
            !email ||
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All fields are required"

            });
        }

        if (newPassword.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters"

            });
        }

        if (newPassword !== confirmPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "New password and confirm password do not match"

            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // =====================================================
        // GET VERIFIED OTP
        // =====================================================

        const [resetRows] = await db.promise().query(
            `
            SELECT
                id,
                user_id,
                email,
                expires_at,
                is_verified
            FROM password_reset_otps
            WHERE email = ?
            AND is_verified = 1
            ORDER BY id DESC
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (resetRows.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Please verify OTP first"

            });
        }

        const resetData = resetRows[0];

        // =====================================================
        // CHECK OTP EXPIRY AGAIN
        // =====================================================

        if (
            new Date(resetData.expires_at) <=
            new Date()
        ) {

            await db.promise().query(
                `
                DELETE FROM password_reset_otps
                WHERE id = ?
                `,
                [resetData.id]
            );

            return res.status(400).json({

                success: false,

                message:
                    "OTP has expired. Please request a new OTP"

            });
        }

        // =====================================================
        // GET EMPLOYEE
        // =====================================================

        const [users] = await db.promise().query(
            `
            SELECT
                user_id,
                password
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

                message:
                    "Employee account not found"

            });
        }

        const user = users[0];

        // =====================================================
        // CHECK OLD PASSWORD
        // =====================================================

        const samePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );

        if (samePassword) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from old password"

            });
        }

        // =====================================================
        // HASH PASSWORD
        // =====================================================

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        // =====================================================
        // UPDATE PASSWORD
        // =====================================================

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

        // =====================================================
        // DELETE USED OTP
        // =====================================================

        await db.promise().query(
            `
            DELETE FROM password_reset_otps
            WHERE user_id = ?
            `,
            [resetData.user_id]
        );

        console.log(
            `✅ Employee password reset successfully: ${normalizedEmail}`
        );

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "Password reset successfully. Please login."

        });

    } catch (error) {

        console.error(
            "❌ Employee Reset Password Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Server error",

            error:
                error.message

        });
    }
};