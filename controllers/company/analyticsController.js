const db = require("../../config/db");

// ==========================================
// GET COMPANY ANALYTICS
// ==========================================

exports.getCompanyAnalytics = async (req, res) => {
  try {
    // ==========================================
    // LOGGED-IN USER
    // ==========================================

    const user_id = req.user.user_id;

    // ==========================================
    // GET COMPANY ID
    // ==========================================

    const [companyRows] = await db.promise().query(
      `
      SELECT company_id
      FROM companies
      WHERE user_id = ?
      LIMIT 1
      `,
      [user_id]
    );

    if (companyRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const company_id = companyRows[0].company_id;

    // ==========================================
    // ANALYTICS QUERIES
    // ==========================================

    const [
      [jobStats],
      [applicationStats],
      [monthlyStats],
    ] = await Promise.all([

      // ==========================================
      // JOB STATISTICS
      // ==========================================

      db.promise().query(
        `
        SELECT

          COUNT(*) AS totalJobs,

          SUM(
            CASE
              WHEN status = 'active'
              THEN 1
              ELSE 0
            END
          ) AS activeJobs,

          SUM(
            CASE
              WHEN status = 'closed'
              THEN 1
              ELSE 0
            END
          ) AS closedJobs

        FROM jobs

        WHERE company_id = ?
        `,
        [company_id]
      ),

      // ==========================================
      // APPLIED JOBS STATISTICS
      // ==========================================

      db.promise().query(
        `
        SELECT

          COUNT(*) AS totalApplications,

          SUM(
            CASE
              WHEN status = 'Applied'
              THEN 1
              ELSE 0
            END
          ) AS applied,

          SUM(
            CASE
              WHEN status = 'Pending'
              THEN 1
              ELSE 0
            END
          ) AS pending,

          SUM(
            CASE
              WHEN status = 'Shortlisted'
              THEN 1
              ELSE 0
            END
          ) AS shortlisted,

          SUM(
            CASE
              WHEN status = 'Interview'
              THEN 1
              ELSE 0
            END
          ) AS interview,

          SUM(
            CASE
              WHEN status = 'Selected'
              THEN 1
              ELSE 0
            END
          ) AS selected,

          SUM(
            CASE
              WHEN status = 'Rejected'
              THEN 1
              ELSE 0
            END
          ) AS rejected

        FROM applied_jobs

        WHERE company_id = ?
        `,
        [company_id]
      ),

      // ==========================================
      // LAST 12 MONTHS
      // ==========================================

      db.promise().query(
        `
        SELECT

          DATE_FORMAT(
            DATE_SUB(
              DATE_FORMAT(CURDATE(), '%Y-%m-01'),
              INTERVAL numbers.month_offset MONTH
            ),
            '%Y-%m'
          ) AS month,

          COALESCE(j.job_count, 0) AS jobs,

          COALESCE(a.application_count, 0) AS applications

        FROM
        (
          SELECT 0 AS month_offset
          UNION ALL SELECT 1
          UNION ALL SELECT 2
          UNION ALL SELECT 3
          UNION ALL SELECT 4
          UNION ALL SELECT 5
          UNION ALL SELECT 6
          UNION ALL SELECT 7
          UNION ALL SELECT 8
          UNION ALL SELECT 9
          UNION ALL SELECT 10
          UNION ALL SELECT 11
        ) AS numbers

        LEFT JOIN
        (
          SELECT

            DATE_FORMAT(created_at, '%Y-%m') AS month,

            COUNT(*) AS job_count

          FROM jobs

          WHERE company_id = ?

          GROUP BY DATE_FORMAT(created_at, '%Y-%m')

        ) AS j

        ON j.month =
          DATE_FORMAT(
            DATE_SUB(
              DATE_FORMAT(CURDATE(), '%Y-%m-01'),
              INTERVAL numbers.month_offset MONTH
            ),
            '%Y-%m'
          )

        LEFT JOIN
        (
          SELECT

            DATE_FORMAT(applied_at, '%Y-%m') AS month,

            COUNT(*) AS application_count

          FROM applied_jobs

          WHERE company_id = ?

          GROUP BY DATE_FORMAT(applied_at, '%Y-%m')

        ) AS a

        ON a.month =
          DATE_FORMAT(
            DATE_SUB(
              DATE_FORMAT(CURDATE(), '%Y-%m-01'),
              INTERVAL numbers.month_offset MONTH
            ),
            '%Y-%m'
          )

        ORDER BY month ASC
        `,
        [company_id, company_id]
      ),
    ]);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      data: {

        company_id,

        // ========================================
        // JOBS
        // ========================================

        jobs: {
          total: Number(
            jobStats[0]?.totalJobs || 0
          ),

          active: Number(
            jobStats[0]?.activeJobs || 0
          ),

          closed: Number(
            jobStats[0]?.closedJobs || 0
          ),
        },

        // ========================================
        // APPLICATIONS
        // ========================================

        applications: {

          total: Number(
            applicationStats[0]?.totalApplications || 0
          ),

          applied: Number(
            applicationStats[0]?.applied || 0
          ),

          pending: Number(
            applicationStats[0]?.pending || 0
          ),

          shortlisted: Number(
            applicationStats[0]?.shortlisted || 0
          ),

          interview: Number(
            applicationStats[0]?.interview || 0
          ),

          selected: Number(
            applicationStats[0]?.selected || 0
          ),

          rejected: Number(
            applicationStats[0]?.rejected || 0
          ),
        },

        // ========================================
        // MONTHLY DATA
        // ========================================

        monthly: monthlyStats.map((item) => ({
          month: item.month,

          jobs: Number(
            item.jobs || 0
          ),

          applications: Number(
            item.applications || 0
          ),
        })),
      },
    });

  } catch (error) {

    console.error(
      "Get company analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};