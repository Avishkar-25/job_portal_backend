const db = require("../../config/db");

// ==========================================
// Get All Open Jobs
// ==========================================
exports.getAllJobs = async (req, res) => {
  try {
    const [jobs] = await db.promise().query(`
      SELECT
        j.job_id,
        j.company_id,
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
        j.created_at,
        j.updated_at,

        c.company_name,
        c.logo AS company_logo

      FROM jobs j

      LEFT JOIN companies c
        ON j.company_id = c.company_id

      WHERE j.status = 'active'

      ORDER BY j.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });

  } catch (error) {
    console.error("Get All Jobs Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// Get Single Job
exports.getJobById = async (req, res) => {
    try {

        const { id } = req.params;

        const [job] = await db.promise().query(`
            SELECT
                job_id,
                company_id,
                job_title,
                category,
                job_type,
                work_mode,
                experience,
                openings,
                location,
                salary_min,
                salary_max,
                required_skills,
                job_description,
                responsibilities,
                qualifications,
                last_date,
                status,
                created_at,
                updated_at
            FROM jobs
            WHERE job_id = ?
        `, [id]);

        if (job.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job Not Found"
            });
        }

        res.status(200).json({
            success: true,
            job: job[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};




exports.getAppliedJobs = async (req, res) => {
  try {

    const { user_id } = req.params;

    // Employee ID

    const [employee] = await db.promise().query(
      `
      SELECT employee_id
      FROM employee
      WHERE user_id = ?
      `,
      [user_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id = employee[0].employee_id;

    // Applied Jobs

    const [jobs] = await db.promise().query(
      `
      SELECT

        aj.application_id,
        aj.status,
        aj.applied_at,

        j.job_id,
        j.job_title,
        j.location,
        j.job_type,
        j.work_mode,
        j.salary_min,
        j.salary_max,

        c.company_name,
        c.logo

      FROM applied_jobs aj

      INNER JOIN jobs j
        ON aj.job_id = j.job_id

      INNER JOIN companies c
        ON aj.company_id = c.company_id

      WHERE aj.employee_id = ?

      ORDER BY aj.applied_at DESC
      `,
      [employee_id]
    );

    res.json({
      success: true,
      jobs,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};
exports.applyJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { user_id } = req.body;

    // ==========================================
    // EMPLOYEE ID
    // ==========================================

    const [employee] = await db.promise().query(
      `SELECT employee_id FROM employee WHERE user_id = ?`,
      [user_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id = employee[0].employee_id;

    // ==========================================
    // JOB DETAILS + LAST DATE
    // ==========================================

    const [job] = await db.promise().query(
      `
      SELECT 
        company_id,
        last_date
      FROM jobs
      WHERE job_id = ?
      `,
      [job_id]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const company_id = job[0].company_id;
    const last_date = job[0].last_date;

    // ==========================================
    // CHECK LAST DATE
    // ==========================================

    if (last_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const applicationLastDate = new Date(last_date);
      applicationLastDate.setHours(0, 0, 0, 0);

      if (today > applicationLastDate) {
        return res.status(400).json({
          success: false,
          message: "Application last date has expired. You cannot apply for this job.",
        });
      }
    }

    // ==========================================
    // ALREADY APPLIED?
    // ==========================================

    const [exists] = await db.promise().query(
      `
      SELECT *
      FROM applied_jobs
      WHERE employee_id = ?
      AND job_id = ?
      `,
      [employee_id, job_id]
    );

    if (exists.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job.",
      });
    }

    // ==========================================
    // APPLY JOB
    // ==========================================

    await db.promise().query(
      `
      INSERT INTO applied_jobs
      (
        employee_id,
        job_id,
        company_id,
        status
      )
      VALUES (?, ?, ?, 'Applied')
      `,
      [employee_id, job_id, company_id]
    );

    // ==========================================
    // SUCCESS
    // ==========================================

    return res.json({
      success: true,
      message: "Job Applied Successfully",
    });

  } catch (error) {
    console.log("Apply Job Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =========================================
// Save Job
// =========================================
exports.saveJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { user_id } = req.body;

    // Employee
    const [employee] = await db.promise().query(
      "SELECT employee_id FROM employee WHERE user_id = ?",
      [user_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id = employee[0].employee_id;

    // Check Job
    const [job] = await db.promise().query(
      "SELECT job_id FROM jobs WHERE job_id = ?",
      [job_id]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Already Saved?
    const [saved] = await db.promise().query(
      "SELECT * FROM saved_jobs WHERE employee_id = ? AND job_id = ?",
      [employee_id, job_id]
    );

    if (saved.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Job already saved",
      });
    }

    // Save Job
    await db.promise().query(
      `INSERT INTO saved_jobs
      (employee_id, job_id)
      VALUES (?, ?)`,
      [employee_id, job_id]
    );

    res.json({
      success: true,
      message: "Job saved successfully",
    });

  }catch (err) {
  console.log("SAVE JOB ERROR:", err);
  console.log(err.sqlMessage);
  console.log(err.message);

  return res.status(500).json({
    success: false,
    message: err.sqlMessage || err.message,
  });
}
};

// =========================================
// Get Saved Jobs
// =========================================
exports.getSavedJobs = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Employee
    const [employee] = await db.promise().query(
      "SELECT employee_id FROM employee WHERE user_id = ?",
      [user_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id = employee[0].employee_id;

    // Saved Jobs
    const [jobs] = await db.promise().query(
      `
      SELECT
        sj.saved_id,
        sj.saved_at,

        j.job_id,
        j.job_title,
        j.location,
        j.job_type,
        j.work_mode,
        j.salary_min,
        j.salary_max,
        j.status,

        c.company_name,
        c.logo

      FROM saved_jobs sj

      INNER JOIN jobs j
        ON sj.job_id = j.job_id

      INNER JOIN companies c
        ON j.company_id = c.company_id

      WHERE sj.employee_id = ?

      ORDER BY sj.saved_at DESC
      `,
      [employee_id]
    );

    res.json({
      success: true,
      jobs,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =========================================
// Remove Saved Job
// =========================================
exports.removeSavedJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { user_id } = req.body;

    // Employee
    const [employee] = await db.promise().query(
      "SELECT employee_id FROM employee WHERE user_id = ?",
      [user_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id = employee[0].employee_id;

    // Delete Saved Job
    await db.promise().query(
      "DELETE FROM saved_jobs WHERE employee_id = ? AND job_id = ?",
      [employee_id, job_id]
    );

    res.json({
      success: true,
      message: "Job removed successfully",
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.cancelApplication = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { application_id } = req.params;

    // Find employee
    const [employeeRows] = await db.promise().query(
      `
      SELECT employee_id
      FROM employee
      WHERE user_id = ?
      LIMIT 1
      `,
      [user_id]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id = employeeRows[0].employee_id;

    // Delete application
    const [result] = await db.promise().query(
      `
      DELETE FROM applied_jobs
      WHERE application_id = ?
      AND employee_id = ?
      `,
      [application_id, employee_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application cancelled successfully",
    });

  } catch (error) {
    console.error("Cancel Application Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel application",
    });
  }
};