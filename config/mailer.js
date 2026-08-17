const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/db");
const sendEmail = require("../../config/sendEmail");

// ==========================================
// EMPLOYEE REGISTER
// ==========================================
exports.employeeRegister = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // ==========================================
        // CHECK EMAIL
        // ==========================================
        const [exist] = await db.promise().query(
            "SELECT * FROM users WHERE email=?",
            [email]
        );

        if (exist.length > 0) {

            return res.json({
                success: false,
                message: "Email already exists"
            });

        }

        // ==========================================
        // PASSWORD HASH
        // ==========================================
        const hash = await bcrypt.hash(password, 10);

        // ==========================================
        // INSERT USERS
        // ==========================================
        const [userResult] = await db.promise().query(

            `
            INSERT INTO users
            (name,email,password,user_type)
            VALUES(?,?,?,'employee')
            `,

            [
                name,
                email,
                hash
            ]

        );

        const user_id = userResult.insertId;

        // ==========================================
        // INSERT EMPLOYEE
        // ==========================================
        const [employeeResult] = await db.promise().query(

            `
            INSERT INTO employee
            (
                user_id,
                full_name,
                email,
                status
            )
            VALUES(?,?,?,'Active')
            `,

            [
                user_id,
                name,
                email
            ]

        );

        const employee_id = employeeResult.insertId;

        // ==========================================
        // CREATE JWT
        // ==========================================
        const token = jwt.sign(

            {
                user_id,
                employee_id,
                email,
                user_type: "employee"
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );

        // ==========================================
        // SEND WELCOME EMAIL USING BREVO
        // ==========================================
        try {

            await sendEmail({

                to: email,

                toName: name,

                subject: "Welcome to Job Portal 🎉",

                html: `
                    <!DOCTYPE html>

                    <html>

                    <head>

                        <meta charset="UTF-8">

                        <title>Welcome to Job Portal</title>

                    </head>

                    <body
                        style="
                            margin:0;
                            padding:0;
                            background:#f5f7fb;
                            font-family:Arial,Helvetica,sans-serif;
                        "
                    >

                        <div
                            style="
                                max-width:600px;
                                margin:40px auto;
                                background:#ffffff;
                                border-radius:12px;
                                overflow:hidden;
                                box-shadow:0 4px 15px rgba(0,0,0,0.08);
                            "
                        >

                            <div
                                style="
                                    background:#2563eb;
                                    padding:25px;
                                    text-align:center;
                                    color:#ffffff;
                                "
                            >

                                <h1 style="margin:0;">
                                    Job Portal
                                </h1>

                                <p style="margin:8px 0 0;">
                                    Welcome to our platform
                                </p>

                            </div>


                            <div style="padding:30px;">

                                <h2>
                                    Hello ${name} 👋
                                </h2>

                                <p
                                    style="
                                        color:#555;
                                        font-size:15px;
                                        line-height:1.6;
                                    "
                                >
                                    Your employee account has been
                                    successfully created on Job Portal.
                                </p>

                                <div
                                    style="
                                        background:#f1f5f9;
                                        padding:20px;
                                        border-radius:8px;
                                        margin:20px 0;
                                    "
                                >

                                    <p style="margin:5px 0;">
                                        <strong>Name:</strong> ${name}
                                    </p>

                                    <p style="margin:5px 0;">
                                        <strong>Email:</strong> ${email}
                                    </p>

                                    <p style="margin:5px 0;">
                                        <strong>Account Type:</strong> Employee
                                    </p>

                                    <p style="margin:5px 0;">
                                        <strong>Status:</strong>
                                        <span style="color:#16a34a;">
                                            Active
                                        </span>
                                    </p>

                                </div>

                                <p
                                    style="
                                        color:#555;
                                        font-size:15px;
                                        line-height:1.6;
                                    "
                                >
                                    You can now login to your account,
                                    browse available jobs and apply for
                                    suitable opportunities.
                                </p>

                                <div style="text-align:center;margin:30px 0;">

                                    <a
                                        href="${process.env.FRONTEND_URL || "#"}"
                                        style="
                                            display:inline-block;
                                            background:#2563eb;
                                            color:#ffffff;
                                            padding:12px 25px;
                                            text-decoration:none;
                                            border-radius:6px;
                                            font-weight:bold;
                                        "
                                    >
                                        Login to Job Portal
                                    </a>

                                </div>

                                <p
                                    style="
                                        color:#777;
                                        font-size:13px;
                                        line-height:1.5;
                                    "
                                >
                                    If you did not create this account,
                                    please contact our support team.
                                </p>

                                <br>

                                <p style="color:#555;">

                                    Regards,<br>

                                    <strong>
                                        Job Portal Team
                                    </strong>

                                </p>

                            </div>


                            <div
                                style="
                                    background:#f8fafc;
                                    padding:15px;
                                    text-align:center;
                                    color:#888;
                                    font-size:12px;
                                "
                            >

                                © ${new Date().getFullYear()} Job Portal.
                                All rights reserved.

                            </div>

                        </div>

                    </body>

                    </html>
                `,

                text: `
Welcome to Job Portal!

Hello ${name},

Your employee account has been successfully created.

Name: ${name}
Email: ${email}
Account Type: Employee
Status: Active

You can now login to Job Portal and apply for jobs.

Regards,
Job Portal Team
                `

            });

        } catch (emailError) {

            // Email failed, but registration remains successful
            console.error(
                "Welcome Email Failed:",
                emailError
            );

        }

        // ==========================================
        // RESPONSE
        // ==========================================
        res.json({

            success: true,

            message: "Employee Registered Successfully",

            token,

            user: {

                user_id,

                employee_id,

                name,

                email,

                user_type: "employee"

            }

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


// ==========================================
// EMPLOYEE LOGIN
// ==========================================
exports.employeeLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        const [rows] = await db.promise().query(

            `
            SELECT
                users.*,
                employee.employee_id

            FROM users

            JOIN employee
                ON users.user_id = employee.user_id

            WHERE users.email=?
            AND users.user_type='employee'
            `,

            [email]

        );

        if (rows.length === 0) {

            return res.status(400).json({

                success: false,
                message: "Invalid Email"

            });

        }

        const user = rows[0];

        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {

            return res.status(400).json({

                success: false,
                message: "Invalid Password"

            });

        }

        // ==========================================
        // JWT
        // ==========================================
        const token = jwt.sign(

            {

                user_id: user.user_id,

                employee_id: user.employee_id,

                email: user.email,

                user_type: user.user_type

            },

            process.env.JWT_SECRET,

            {

                expiresIn: "7d"

            }

        );

        res.json({

            success: true,

            message: "Login Successfully",

            token,

            user: {

                user_id: user.user_id,

                employee_id: user.employee_id,

                name: user.name,

                email: user.email,

                user_type: user.user_type

            }

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


// ==========================================
// EMPLOYEE DASHBOARD
// ==========================================
exports.employeeDashboard = async (req, res) => {

    try {

        const { user_id } = req.params;

        // ==========================================
        // GET EMPLOYEE
        // ==========================================
        const [employee] = await db.promise().query(

            `SELECT employee_id
             FROM employee
             WHERE user_id = ?`,

            [user_id]

        );

        if (employee.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Employee not found"

            });

        }

        const employee_id = employee[0].employee_id;

        // ==========================================
        // AVAILABLE JOBS
        // ==========================================
        const [jobs] = await db.promise().query(

            `SELECT COUNT(*) AS total
             FROM jobs
             WHERE status = 'Active'`

        );

        // ==========================================
        // APPLIED JOBS
        // ==========================================
        const [applied] = await db.promise().query(

            `SELECT COUNT(*) AS total
             FROM applied_jobs
             WHERE employee_id = ?`,

            [employee_id]

        );

        // ==========================================
        // SAVED JOBS
        // ==========================================
        const [saved] = await db.promise().query(

            `SELECT COUNT(*) AS total
             FROM saved_jobs
             WHERE employee_id = ?`,

            [employee_id]

        );

        // ==========================================
        // INTERVIEWS
        // ==========================================
        const [interviews] = await db.promise().query(

            `SELECT COUNT(*) AS total
             FROM applied_jobs
             WHERE employee_id = ?
             AND status = 'Interview'`,

            [employee_id]

        );

        // ==========================================
        // RECOMMENDED JOBS
        // ==========================================
        const [recommendedJobs] = await db.promise().query(

            `SELECT
                job_id,
                job_title,
                location,
                salary_min,
                salary_max,
                work_mode,
                company_id

             FROM jobs

             WHERE status = 'Active'

             ORDER BY created_at DESC

             LIMIT 5`

        );

        // ==========================================
        // RECENT APPLICATIONS
        // ==========================================
        const [recentApplications] = await db.promise().query(

            `SELECT
                aj.application_id,
                aj.job_id,
                j.job_title,
                j.company_id,
                aj.status,
                aj.applied_at,
                aj.interview_date,
                aj.interview_time,
                aj.interview_location

             FROM applied_jobs aj

             JOIN jobs j
                ON aj.job_id = j.job_id

             WHERE aj.employee_id = ?

             ORDER BY aj.applied_at DESC

             LIMIT 5`,

            [employee_id]

        );

        // ==========================================
        // RESPONSE
        // ==========================================
        res.json({

            success: true,

            stats: {

                availableJobs: jobs[0].total,

                appliedJobs: applied[0].total,

                savedJobs: saved[0].total,

                interviews: interviews[0].total

            },

            recommendedJobs,

            recentApplications

        });

    }

    catch (err) {

        console.error(
            "Employee Dashboard Error:",
            err
        );

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


// ==========================================
// BROWSE JOBS
// ==========================================
exports.getAllJobs = async (req, res) => {

    try {

        const [jobs] = await db.promise().query(

            `SELECT
                j.job_id,
                j.company_id,
                c.company_name,
                j.job_title,
                j.category,
                j.job_type,
                j.work_mode,
                j.experience,
                j.openings,
                j.location,
                j.salary_min,
                j.salary_max,
                j.required_skills,
                j.job_description,
                j.responsibilities,
                j.qualifications,
                j.last_date,
                j.status,
                j.created_at

            FROM jobs j

            INNER JOIN companies c
                ON j.company_id = c.company_id

            WHERE j.status='Active'

            ORDER BY j.created_at DESC`

        );

        res.json({

            success: true,

            jobs

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};