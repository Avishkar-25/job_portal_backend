const db = require("../../config/db");


// =======================================
// CREATE JOB
// =======================================

exports.createJob = async (req, res) => {

    try {

        const user_id = req.user.user_id;


        // Find Company ID using JWT user_id

        const [company] = await db.promise().query(

            `
            SELECT company_id
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



        const {

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
            last_date

        } = req.body;




        await db.promise().query(

            `
            INSERT INTO jobs
            (
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
                status
            )

            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active')

            `,

            [

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
                last_date

            ]

        );



        res.status(201).json({

            success: true,
            message: "Job posted successfully"

        });



    }
    catch (error) {

        console.log(error);


        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};





// =======================================
// GET COMPANY JOBS
// =======================================

exports.getMyJobs = async (req, res) => {


    try {


        const user_id = req.user.user_id;



        const [jobs] = await db.promise().query(

            `
            SELECT 
            j.*

            FROM jobs j

            JOIN companies c
            ON j.company_id=c.company_id

            WHERE c.user_id=?

            ORDER BY j.created_at DESC

            `,

            [user_id]

        );



        res.json({

            success: true,
            jobs

        });



    }
    catch (error) {

        console.log(error);


        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }


};

// =======================================
// GET SINGLE JOB
// =======================================

exports.getSingleJob = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const { job_id } = req.params;


        const [job] = await db.promise().query(

            `
            SELECT 
            j.*

            FROM jobs j

            JOIN companies c
            ON j.company_id = c.company_id

            WHERE 
            j.job_id = ?
            AND c.user_id = ?

            `,

            [
                job_id,
                user_id
            ]

        );



        if (job.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Job not found"

            });

        }



        res.json({

            success: true,
            job: job[0]

        });



    }
    catch (error) {

        console.log(error);


        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};





// =======================================
// UPDATE JOB
// =======================================


exports.updateJob = async (req, res) => {


    try {


        const user_id = req.user.user_id;

        const { job_id } = req.params;



        const {

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
            last_date

        } = req.body;




        // Check Job belongs to company

        const [check] = await db.promise().query(

            `
            SELECT j.job_id

            FROM jobs j

            JOIN companies c
            ON j.company_id=c.company_id

            WHERE 
            j.job_id=?
            AND c.user_id=?

            `,

            [
                job_id,
                user_id
            ]

        );



        if (check.length === 0) {

            return res.status(403).json({

                success: false,
                message: "Access denied"

            });

        }





        await db.promise().query(

            `
            UPDATE jobs SET

            job_title=?,
            category=?,
            job_type=?,
            work_mode=?,
            experience=?,
            openings=?,
            location=?,
            salary_min=?,
            salary_max=?,
            required_skills=?,
            job_description=?,
            responsibilities=?,
            qualifications=?,
            last_date=?,
            updated_at=NOW()

            WHERE job_id=?

            `,


            [

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
                job_id

            ]

        );



        res.json({

            success: true,
            message: "Job updated successfully"

        });



    }
    catch (error) {


        console.log(error);


        res.status(500).json({

            success: false,
            message: "Server Error"

        });


    }


};

// =======================================
// DELETE JOB
// =======================================

exports.deleteJob = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { job_id } = req.params;

        // Check Job belongs to logged-in company
        const [job] = await db.promise().query(
            `
      SELECT j.job_id
      FROM jobs j
      JOIN companies c
      ON j.company_id = c.company_id
      WHERE j.job_id = ?
      AND c.user_id = ?
      `,
            [job_id, user_id]
        );

        if (job.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied",
            });
        }

        // Delete Job
        await db.promise().query(
            `
      DELETE FROM jobs
      WHERE job_id = ?
      `,
            [job_id]
        );

        res.status(200).json({
            success: true,
            message: "Job deleted successfully",
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};