const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();

// =====================================================
// SESSION
// =====================================================

app.use(
  session({
    secret: "jobportal",
    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

// =====================================================
// UPLOADS / STATIC FILES
// =====================================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =====================================================
// IMPORT ROUTES
// =====================================================

// ---------------- EMPLOYEE ROUTES ----------------

// Employee Auth
const employeeRoutes = require("./routes/employee/EmployeeRoutes");

// Employee Profile
const employeeProfileRoutes = require("./routes/employee/employeeProfileRoutes");

// Employee Jobs
const employeeJobRoutes = require("./routes/employee/employeeJobRoutes");

const employeeCompanyRoutes = require("./routes/employee/employeeCompanyRoutes");
// ---------------- COMPANY ROUTES ----------------

// Company Login / Register
const companyAuthRoutes = require("./routes/company/authRoutes");

// Company Dashboard
const dashboardRoutes = require("./routes/company/dashboardRoutes");

// Company Jobs
const jobRoutes = require("./routes/company/jobRoutes");

// Company Applicants
const applicantRoutes = require("./routes/company/applicantRoutes");

// Company Profile
const companyProfileRoutes = require("./routes/company/companyProfileRoutes");

// Company Analytics
const analyticsRoutes = require("./routes/company/analyticsRoutes");

// Company Password
const passwordRoutes = require("./routes/company/passwordRoutes");
// password
const employeePasswordRoutes = require("./routes/employee/passwordRoutes");
// =====================================================
// EMPLOYEE API ROUTES
// =====================================================

// Employee Auth
// URL example:
// POST /api/employee/register
// POST /api/employee/login

app.use(
  "/api/employee",
  employeeRoutes
);


// Employee Jobs
// URL examples:
// GET    /api/employee/
// POST   /api/employee/apply/:job_id
// GET    /api/employee/applied-jobs/:user_id
// POST   /api/employee/save/:job_id
// GET    /api/employee/saved/:user_id
// DELETE /api/employee/unsave/:job_id
// DELETE /api/employee/applications/:job_id
// GET    /api/employee/:id

app.use(
  "/api/employee",
  employeeJobRoutes
);


// Employee Profile
// URL examples:
// GET /api/employee/profile
// PUT /api/employee/profile/:user_id

app.use(
  "/api/employee",
  employeeProfileRoutes
);


// =====================================================
// JOB API ROUTES
// =====================================================

// Same employeeJobRoutes is also mounted here.
//
// URL examples:
// GET  /api/jobs/
// POST /api/jobs/apply/:job_id
// POST /api/jobs/save/:job_id

app.use(
  "/api/jobs",
  employeeJobRoutes
);

app.use(
    "/api/employee/password",
    employeePasswordRoutes
);


app.use("/api/employee", employeeCompanyRoutes);
// =====================================================
// COMPANY AUTH ROUTES
// =====================================================

// Company Login
// POST /api/company/login
//
// Company Register
// POST /api/company/register

app.use(
  "/api/company",
  companyAuthRoutes
);


// =====================================================
// COMPANY DASHBOARD
// =====================================================

// Example:
// GET /api/company/dashboard/:company_id

app.use(
  "/api/company",
  dashboardRoutes
);


// =====================================================
// COMPANY JOB ROUTES
// =====================================================

// Examples:
// POST   /api/company/jobs/create
// GET    /api/company/jobs/my-jobs
// PUT    /api/company/jobs/update/:job_id
// DELETE /api/company/jobs/delete/:job_id

app.use(
  "/api/company",
  jobRoutes
);


// =====================================================
// COMPANY APPLICANT ROUTES
// =====================================================

// Examples:
//
// GET /api/company/applicants
//
// PUT /api/company/applicants/:application_id
//
// GET /api/company/employee-profile/:employee_id
//
// PUT /api/company/applicants/:application_id/interview

app.use(
  "/api",
  applicantRoutes
);


// =====================================================
// COMPANY PROFILE
// =====================================================

// Examples:
// GET /api/company/profile
// PUT /api/company/profile
// POST /api/company/profile/logo

app.use(
  "/api/company",
  companyProfileRoutes
);


// =====================================================
// COMPANY ANALYTICS
// =====================================================

// Examples:
// GET /api/company/analytics
// GET /api/company/analytics/...

app.use(
  "/api/company/analytics",
  analyticsRoutes
);


// =====================================================
// COMPANY PASSWORD
// =====================================================

// Change Password:
// PUT /api/company/password/change-password
//
// Forgot Password OTP:
// POST /api/company/password/forgot-password/send-otp
//
// Verify OTP:
// POST /api/company/password/forgot-password/verify-otp
//
// Reset Password:
// POST /api/company/password/forgot-password/reset

app.use(
  "/api/company/password",
  passwordRoutes
);


// =====================================================
// SERVER
// =====================================================

app.listen(
  5000,
  () => {
    console.log("Server running on 5000");
  }
);





// job-portal-backend
// │
// ├── config
// │   └── db.js
// │
// ├── controllers
// │   ├── authController.js
// │   ├── employeeController.js
// │   └── companyController.js
//  |   |_ jobController.js 
// │
// ├── routes
// │   ├── authRoutes.js
// │   ├── employeeRoutes.js
// │   └── companyRoutes.js
// |   |_ jobRoutes.js
// ├── models
// │
// ├── middleware
// │
// ├── uploads
// │
// ├── .env
// ├── server.js
// └── package.json