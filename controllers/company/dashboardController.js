const db = require("../../config/db");

// =======================================
// Company Dashboard
// =======================================
exports.getDashboard = async (req, res) => {
    try {

        // JWT मधून user_id
        const user_id = req.user.user_id;

        // =======================================
        // GET COMPANY
        // =======================================
        const [company] = await db.promise().query(
            `
            SELECT
                company_id,
                company_name
            FROM companies
            WHERE user_id = ?
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

        // =======================================
        // TOTAL JOBS
        // =======================================
        const [totalJobs] = await db.promise().query(
            `
            SELECT COUNT(*) AS total_jobs
            FROM jobs
            WHERE company_id = ?
            `,
            [company_id]
        );

        // =======================================
        // ACTIVE JOBS
        // =======================================
        const [activeJobs] = await db.promise().query(
            `
            SELECT COUNT(*) AS active_jobs
            FROM jobs
            WHERE company_id = ?
            AND status = 'Active'
            `,
            [company_id]
        );

        // =======================================
        // TOTAL APPLICATIONS
        // applied_jobs table वापरायची
        // =======================================
       // Applications
const [applications] = await db.promise().query(
    `
    SELECT COUNT(*) AS applied_jobs
    FROM applied_jobs
    WHERE company_id = ?
    `,
    [company_id]
);

// Selected Candidates
const [hired] = await db.promise().query(
    `
    SELECT COUNT(*) AS hired
    FROM applied_jobs
    WHERE company_id = ?
    AND status = 'Selected'
    `,
    [company_id]
);

        // =======================================
        // RESPONSE
        // =======================================
        return res.status(200).json({

            success: true,

            dashboard: {

                company_name: company[0].company_name,

                total_jobs: totalJobs[0].total_jobs,

                active_jobs: activeJobs[0].active_jobs,

                applications: applications[0].applications,

                hired: hired[0].hired

            }

        });

    } catch (error) {

        console.error("Company Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};