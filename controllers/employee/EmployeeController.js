const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/db");
// employee register
exports.employeeRegister = async (req, res) => {

try {

const { name, email, password } = req.body;


// check email
const [exist] = await db.promise().query(
"SELECT * FROM users WHERE email=?",
[email]
);


if(exist.length > 0){

return res.json({
success:false,
message:"Email already exists"
});

}



// password hash
const hash = await bcrypt.hash(password,10);


// insert users

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



// insert employee

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



// create jwt

const token = jwt.sign(

{
user_id,
employee_id,
email,
user_type:"employee"
},

process.env.JWT_SECRET,

{
expiresIn:"7d"
}

);



res.json({

success:true,

message:"Employee Registered Successfully",

token,


user:{

user_id,
employee_id,
name,
email,
user_type:"employee"

}


});



}
catch(err){

console.log(err);


res.status(500).json({

success:false,
message:"Server Error"

});


}

};

// employee login
exports.employeeLogin = async(req,res)=>{


try{


const {email,password}=req.body;



const [rows]=await db.promise().query(

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



if(rows.length===0){

return res.status(400).json({

success:false,
message:"Invalid Email"

});

}



const user=rows[0];



const match=await bcrypt.compare(
password,
user.password
);



if(!match){

return res.status(400).json({

success:false,
message:"Invalid Password"

});

}



// JWT

const token=jwt.sign(

{

user_id:user.user_id,

employee_id:user.employee_id,

email:user.email,

user_type:user.user_type

},


process.env.JWT_SECRET,


{
expiresIn:"7d"
}

);



res.json({

success:true,

message:"Login Successfully",


token,


user:{

user_id:user.user_id,

employee_id:user.employee_id,

name:user.name,

email:user.email,

user_type:user.user_type

}


});



}
catch(err){

console.log(err);


res.status(500).json({

success:false,

message:"Server Error"

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
        // applied_jobs table
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

    } catch (err) {

        console.error("Employee Dashboard Error:", err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// browse jobs
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