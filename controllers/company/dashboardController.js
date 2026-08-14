const db = require("../../config/db");


// =======================================
// Company Dashboard
// =======================================
exports.getDashboard = async (req, res) => {

    try {

        // JWT मधून user_id
        const user_id = req.user.user_id;


        // Get Company
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

                success:false,
                message:"Company not found"

            });

        }


        const company_id = company[0].company_id;



        // Total Jobs
        const [totalJobs] = await db.promise().query(
            `
            SELECT COUNT(*) AS total_jobs
            FROM jobs
            WHERE company_id = ?
            `,
            [company_id]
        );



        // Active Jobs
        const [activeJobs] = await db.promise().query(
            `
            SELECT COUNT(*) AS active_jobs
            FROM jobs
            WHERE company_id = ?
            AND status='active'
            `,
            [company_id]
        );



        // Applications
        const [applications] = await db.promise().query(
            `
            SELECT COUNT(*) AS applications
            FROM applications
            WHERE company_id = ?
            `,
            [company_id]
        );



        // Selected Candidates
        const [hired] = await db.promise().query(
            `
            SELECT COUNT(*) AS hired
            FROM applications
            WHERE company_id = ?
            AND status='Selected'
            `,
            [company_id]
        );



        return res.status(200).json({

            success:true,

            dashboard:{


                company_name: company[0].company_name,


                total_jobs:
                totalJobs[0].total_jobs,


                active_jobs:
                activeJobs[0].active_jobs,


                applications:
                applications[0].applications,


                hired:
                hired[0].hired


            }


        });



    }
    catch(error){


        console.log(error);


        return res.status(500).json({

            success:false,
            message:"Server Error"

        });


    }

};