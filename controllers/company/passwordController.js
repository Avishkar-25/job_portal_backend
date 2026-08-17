const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const sendEmail = require("../../config/mailer");

// =====================================================
// CHANGE PASSWORD - SETTINGS
// =====================================================

exports.changePassword = async (req, res) => {
    try {

        const user_id = req.user.user_id;

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }


        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }


        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match"
            });
        }


        // =====================================================
        // GET COMPANY USER
        // =====================================================

        const [users] = await db.promise().query(
            `
            SELECT
                user_id,
                password
            FROM users
            WHERE user_id = ?
            AND user_type = 'company'
            LIMIT 1
            `,
            [user_id]
        );


        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Company account not found"
            });
        }


        const user = users[0];


        // =====================================================
        // CHECK CURRENT PASSWORD
        // =====================================================

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );


        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }


        // =====================================================
        // CHECK SAME PASSWORD
        // =====================================================

        const samePassword = await bcrypt.compare(
            newPassword,
            user.password
        );


        if (samePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }


        // =====================================================
        // HASH NEW PASSWORD
        // =====================================================

        const hashedPassword = await bcrypt.hash(
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
            `,
            [
                hashedPassword,
                user_id
            ]
        );


        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {

        console.error(
            "❌ Change Password Error:",
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
// SEND FORGOT PASSWORD OTP
// =====================================================

exports.sendForgotPasswordOtp = async (req, res) => {

    try {

        let { email } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }


        email = email.trim().toLowerCase();


        // =====================================================
        // CHECK COMPANY ACCOUNT
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
                message: "Company account not found"
            });

        }


        const user = users[0];


        // =====================================================
        // GENERATE OTP
        // =====================================================

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();


        // =====================================================
        // OTP EXPIRY - 10 MINUTES
        // =====================================================

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

            toName: user.name || "Company",

            subject: "Job Portal - Password Reset OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 30px auto;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    background: #ffffff;
                ">

                    <h2 style="
                        color: #0d6efd;
                        margin-bottom: 20px;
                    ">
                        Job Portal - Password Reset
                    </h2>

                    <p>
                        Hello
                        <strong>
                            ${user.name || "Company"}
                        </strong>,
                    </p>

                    <p>
                        We received a request to reset your
                        Job Portal company account password.
                    </p>

                    <p>
                        Your One-Time Password (OTP) is:
                    </p>

                    <div style="
                        text-align: center;
                        margin: 25px 0;
                    ">

                        <span style="
                            display: inline-block;
                            padding: 15px 25px;
                            background: #eff6ff;
                            color: #0d6efd;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 10px;
                            border-radius: 10px;
                        ">
                            ${otp}
                        </span>

                    </div>

                    <p>
                        This OTP is valid for
                        <strong>10 minutes</strong>.
                    </p>

                    <p>
                        Please do not share this OTP with anyone.
                    </p>

                    <p>
                        If you did not request this password reset,
                        please ignore this email.
                    </p>

                    <hr style="
                        border: none;
                        border-top: 1px solid #eee;
                        margin: 25px 0;
                    ">

                    <p style="
                        color: #666;
                        font-size: 13px;
                    ">
                        Job Portal Security Team
                    </p>

                </div>
            `,

            text: `
Job Portal - Password Reset

Hello ${user.name || "Company"},

Your Job Portal password reset OTP is:

${otp}

This OTP is valid for 10 minutes.

Please do not share this OTP with anyone.

If you did not request this password reset,
please ignore this email.

Job Portal Security Team
            `
        });


        console.log(
            `✅ Password reset OTP sent successfully to ${user.email}`
        );


        // =====================================================
        // RESPONSE
        // =====================================================

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
// VERIFY FORGOT PASSWORD OTP
// =====================================================

exports.verifyForgotPasswordOtp = async (req, res) => {

    try {

        let { email, otp } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!email || !otp) {

            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });

        }


        email = email.trim().toLowerCase();
        otp = otp.toString().trim();


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
                email,
                otp
            ]
        );


        // =====================================================
        // OTP NOT FOUND
        // =====================================================

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

        const currentTime = new Date();

        const expiryTime = new Date(
            resetData.expires_at
        );


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
                message: "OTP has expired. Please request a new OTP"
            });

        }


        // =====================================================
        // MARK OTP VERIFIED
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
            `✅ OTP verified successfully for ${resetData.email}`
        );


        // =====================================================
        // RESPONSE
        // =====================================================

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

        let {
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
                message: "All fields are required"
            });

        }


        email = email.trim().toLowerCase();


        if (newPassword.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });

        }


        if (newPassword !== confirmPassword) {

            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });

        }


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
            [email]
        );


        if (resetRows.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Please verify OTP first"
            });

        }


        const resetData = resetRows[0];


        // =====================================================
        // CHECK OTP EXPIRY AGAIN
        // =====================================================

        if (
            new Date(resetData.expires_at) <= new Date()
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
                message: "OTP has expired. Please request a new OTP"
            });

        }


        // =====================================================
        // GET COMPANY USER
        // =====================================================

        const [users] = await db.promise().query(
            `
            SELECT
                user_id,
                password
            FROM users
            WHERE user_id = ?
            AND user_type = 'company'
            LIMIT 1
            `,
            [resetData.user_id]
        );


        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Company account not found"
            });

        }


        const user = users[0];


        // =====================================================
        // CHECK OLD PASSWORD
        // =====================================================

        const samePassword = await bcrypt.compare(
            newPassword,
            user.password
        );


        if (samePassword) {

            return res.status(400).json({
                success: false,
                message: "New password must be different from old password"
            });

        }


        // =====================================================
        // HASH NEW PASSWORD
        // =====================================================

        const hashedPassword = await bcrypt.hash(
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
            `✅ Password reset successfully for user ${resetData.user_id}`
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
            "❌ Reset Password Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Server error",

            error: error.message

        });

    }
};