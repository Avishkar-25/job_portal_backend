const db = require("../../config/db");
const transporter = require("../../config/mail");
const { statusMail } = require("../../templates/statusMail");
// ==========================================
// GET COMPANY APPLICANTS
// ==========================================

exports.getApplicants = async (req, res) => {

  try {

    const user_id = req.user.user_id;

    // Company ID
    const [company] = await db.promise().query(
      `
      SELECT company_id
      FROM companies
      WHERE user_id=?
      `,
      [user_id]
    );

    if (company.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    const company_id = company[0].company_id;

    // Applicants
    const [applicants] = await db.promise().query(
      `
      SELECT

      aj.application_id,
      aj.status,
      aj.applied_at,

      j.job_title,

      e.employee_id,
      e.full_name,
      e.email,
      e.phone,
      e.experience,
      e.resume

      FROM applied_jobs aj

      JOIN jobs j
      ON aj.job_id = j.job_id

      JOIN employee e
      ON aj.employee_id = e.employee_id

      WHERE aj.company_id = ?

      ORDER BY aj.applied_at DESC
      `,
      [company_id]
    );

    res.json({
      success: true,
      applicants
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};


// ============================================================
// SCHEDULE INTERVIEW
// ============================================================




// ============================================================
// SCHEDULE INTERVIEW
// ============================================================

exports.scheduleInterview = async (req, res) => {

    try {

        const user_id = req.user.user_id;
        const { application_id } = req.params;

        const {
            date,
            time,
            location
        } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!date || !time || !location) {

            return res.status(400).json({
                success: false,
                message: "Interview date, time and location are required"
            });

        }


        // =====================================================
        // GET COMPANY
        // =====================================================

        const [companyRows] = await db.promise().query(
            `
            SELECT
                company_id,
                company_name
            FROM companies
            WHERE user_id = ?
            LIMIT 1
            `,
            [user_id]
        );


        if (companyRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });

        }


        const company_id = companyRows[0].company_id;
        const company_name = companyRows[0].company_name;


        // =====================================================
        // GET APPLICATION + EMPLOYEE
        // =====================================================

        const [rows] = await db.promise().query(
            `
            SELECT
                aj.application_id,
                aj.employee_id,
                aj.job_id,
                aj.company_id,

                e.full_name AS candidate_name,
                e.email AS candidate_email,

                j.job_title

            FROM applied_jobs aj

            INNER JOIN employee e
                ON aj.employee_id = e.employee_id

            INNER JOIN jobs j
                ON aj.job_id = j.job_id

            WHERE aj.application_id = ?
            AND aj.company_id = ?

            LIMIT 1
            `,
            [
                application_id,
                company_id
            ]
        );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Application not found"
            });

        }


        const applicant = rows[0];


        // =====================================================
        // CHECK EMAIL
        // =====================================================

        if (!applicant.candidate_email) {

            return res.status(400).json({
                success: false,
                message: "Employee email not found"
            });

        }


        console.log(
            "📧 Interview candidate email:",
            applicant.candidate_email
        );


        // =====================================================
        // SAVE INTERVIEW DETAILS
        // =====================================================

        const [updateResult] = await db.promise().query(
            `
            UPDATE applied_jobs
            SET
                status = 'Interview',
                interview_date = ?,
                interview_time = ?,
                interview_location = ?
            WHERE application_id = ?
            AND company_id = ?
            `,
            [
                date,
                time,
                location,
                application_id,
                company_id
            ]
        );


        if (updateResult.affectedRows === 0) {

            return res.status(500).json({
                success: false,
                message: "Failed to save interview details"
            });

        }


        console.log(
            "✅ Interview saved:",
            application_id,
            date,
            time,
            location
        );


        // =====================================================
        // INTERVIEW EMAIL HTML
        // =====================================================

        const interviewHtml = `

            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 25px;
                border: 1px solid #ddd;
                border-radius: 12px;
                background: #ffffff;
            ">

                <h2 style="
                    color:#2563eb;
                    margin-bottom:20px;
                ">
                    Interview Scheduled
                </h2>


                <p>
                    Dear
                    <strong>
                        ${applicant.candidate_name}
                    </strong>,
                </p>


                <p>
                    Your interview has been successfully
                    scheduled for the position of
                    <strong>
                        ${applicant.job_title}
                    </strong>.
                </p>


                <div style="
                    background:#eff6ff;
                    padding:20px;
                    border-radius:10px;
                    margin:20px 0;
                ">

                    <p>
                        <strong>Company:</strong>
                        ${company_name}
                    </p>

                    <p>
                        <strong>Job:</strong>
                        ${applicant.job_title}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${date}
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${time}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${location}
                    </p>

                </div>


                <p>
                    Please be available at the scheduled
                    date and time.
                </p>


                <p>
                    Regards,<br/>
                    <strong>
                        ${company_name} HR Team
                    </strong>
                </p>

            </div>

        `;


        // =====================================================
        // RESPONSE
        // =====================================================

        res.status(200).json({

            success: true,

            message: "Interview scheduled successfully",

            emailStatus: "Email is being sent",

            interview: {
                application_id,
                date,
                time,
                location
            }

        });


        // =====================================================
        // SEND EMAIL USING BREVO
        // =====================================================

        setImmediate(async () => {

            try {

                console.log(
                    `📧 Sending interview email to: ${applicant.candidate_email}`
                );


                const result = await sendEmail({

                    to: applicant.candidate_email.trim(),

                    toName:
                        applicant.candidate_name,

                    subject:
                        `Interview Scheduled - ${applicant.job_title}`,

                    html:
                        interviewHtml

                });


                console.log(
                    "✅ Brevo interview email sent successfully"
                );


                console.log(
                    "📧 Message ID:",
                    result.messageId
                );


                console.log(
                    "📧 Recipient:",
                    applicant.candidate_email
                );


            } catch (mailError) {

                console.error(
                    "❌ BREVO INTERVIEW EMAIL FAILED"
                );

                console.error(
                    "Error:",
                    mailError.message
                );

            }

        });


    } catch (error) {

        console.error(
            "❌ Schedule Interview Error:",
            error
        );


        if (!res.headersSent) {

            return res.status(500).json({

                success: false,

                message: "Failed to schedule interview",

                error: error.message

            });

        }

    }

};


// ============================================================
// UPDATE APPLICANT STATUS
// ============================================================

exports.updateApplicantStatus = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const { application_id } = req.params;

        const { status } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        const allowedStatuses = [
            "Applied",
            "Pending",
            "Shortlisted",
            "Interview",
            "Selected",
            "Rejected"
        ];


        if (!status) {

            return res.status(400).json({
                success: false,
                message: "Status is required"
            });

        }


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });

        }


        // =====================================================
        // GET COMPANY
        // =====================================================

        const [company] = await db.promise().query(
            `
            SELECT
                company_id
            FROM companies
            WHERE user_id = ?
            LIMIT 1
            `,
            [user_id]
        );


        if (company.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });

        }


        const company_id = company[0].company_id;


        // =====================================================
        // GET APPLICATION + EMAIL DATA
        // =====================================================

        const [application] = await db.promise().query(
            `
            SELECT
                aj.application_id,

                e.full_name,
                e.email,

                j.job_title,

                c.company_name

            FROM applied_jobs aj

            INNER JOIN employee e
                ON aj.employee_id = e.employee_id

            INNER JOIN jobs j
                ON aj.job_id = j.job_id

            INNER JOIN companies c
                ON aj.company_id = c.company_id

            WHERE aj.application_id = ?
            AND aj.company_id = ?

            LIMIT 1
            `,
            [
                application_id,
                company_id
            ]
        );


        if (application.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Application not found"
            });

        }


        const employee = application[0];


        // =====================================================
        // UPDATE STATUS
        // =====================================================

        const [updateResult] = await db.promise().query(
            `
            UPDATE applied_jobs
            SET status = ?
            WHERE application_id = ?
            AND company_id = ?
            `,
            [
                status,
                application_id,
                company_id
            ]
        );


        if (updateResult.affectedRows === 0) {

            return res.status(500).json({
                success: false,
                message: "Failed to update status"
            });

        }


        console.log(
            `✅ Application ${application_id} status updated to ${status}`
        );


        // =====================================================
        // RESPONSE
        // =====================================================

        res.status(200).json({

            success: true,

            message: "Status Updated Successfully",

            status,

            emailStatus:
                employee.email
                    ? "Email is being sent"
                    : "Employee email not found"

        });


        // =====================================================
        // CHECK EMAIL
        // =====================================================

        if (!employee.email) {

            console.log(
                `⚠️ No email found for application ${application_id}`
            );

            return;

        }


        // =====================================================
        // SEND STATUS EMAIL USING BREVO
        // =====================================================

        setImmediate(async () => {

            try {

                console.log(
                    `📧 Sending status email to: ${employee.email}`
                );


                const result = await sendEmail({

                    to:
                        employee.email.trim(),

                    toName:
                        employee.full_name,

                    subject:
                        `Application Status - ${status}`,

                    html:
                        statusMail(
                            employee.full_name,
                            employee.company_name,
                            employee.job_title,
                            status
                        )

                });


                console.log(
                    "✅ Brevo status email sent successfully"
                );


                console.log(
                    "📧 Message ID:",
                    result.messageId
                );


                console.log(
                    "📧 Recipient:",
                    employee.email
                );


            } catch (mailError) {

                console.error(
                    "❌ BREVO STATUS EMAIL FAILED"
                );


                console.error(
                    "Error:",
                    mailError.message
                );

            }

        });


    } catch (error) {

        console.error(
            "❌ Update Applicant Status Error:",
            error
        );


        if (res.headersSent) {
            return;
        }


        return res.status(500).json({

            success: false,

            message: "Server Error",

            error: error.message

        });

    }

};

// ==========================================
// GET EMPLOYEE PROFILE FOR COMPANY
// ==========================================

exports.getEmployeeProfileForCompany = async (req, res) => {
    try {

        const { employee_id } = req.params;

        // ==============================
        // Employee Basic Profile
        // ==============================

        const [employee] = await db.promise().query(
            `
            SELECT
                employee_id,
                user_id,
                full_name,
                email,
                phone,
                gender,
                dob,
                address,
                city,
                state,
                country,
                pincode,
                experience,
                current_company,
                current_salary,
                expected_salary,
                resume,
                profile_photo,
                linkedin,
                github,
                portfolio,
                about,
                profession,
                professional_summary,
                status,
                created_at,
                updated_at

            FROM employee

            WHERE employee_id = ?
            `,
            [employee_id]
        );

        // ==============================
        // Employee Not Found
        // ==============================

        if (employee.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });

        }

        // ==============================
        // Employee Skills
        // ==============================

        const [skills] = await db.promise().query(
            `
            SELECT
                skill_id,
                skill_name,
                skill_level,
                created_at

            FROM skill

            WHERE employee_id = ?

            ORDER BY skill_id DESC
            `,
            [employee_id]
        );

        // ==============================
        // Employee Qualifications
        // ==============================

        const [education] = await db.promise().query(
            `
            SELECT
                qualification_id,
                qualification,
                college_name,
                passing_year,
                cgpa

            FROM employee_qualifications

            WHERE employee_id = ?

            ORDER BY passing_year DESC
            `,
            [employee_id]
        );

        // ==============================
        // Response
        // ==============================

        res.status(200).json({

            success: true,

            profile: {

                ...employee[0],

                skills: skills,

                education: education

            }

        });

    } catch (error) {

        console.error(
            "Get Employee Profile Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Server Error",

            error: error.message

        });

    }
};




