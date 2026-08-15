const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://job-portal-frontend.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin
      // Example: Postman / server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================================
// SESSION
// =====================================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "jobportal",
    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const employeeProfileRoutes = require(
  "./routes/employee/employeeProfileRoutes"
);

// Employee Jobs
const employeeJobRoutes = require(
  "./routes/employee/employeeJobRoutes"
);

// Employee Company
const employeeCompanyRoutes = require(
  "./routes/employee/employeeCompanyRoutes"
);

// Employee Password
const employeePasswordRoutes = require(
  "./routes/employee/passwordRoutes"
);


// ---------------- COMPANY ROUTES ----------------

// Company Login / Register
const companyAuthRoutes = require(
  "./routes/company/authRoutes"
);

// Company Dashboard
const dashboardRoutes = require(
  "./routes/company/dashboardRoutes"
);

// Company Jobs
const jobRoutes = require(
  "./routes/company/jobRoutes"
);

// Company Applicants
const applicantRoutes = require(
  "./routes/company/applicantRoutes"
);

// Company Profile
const companyProfileRoutes = require(
  "./routes/company/companyProfileRoutes"
);

// Company Analytics
const analyticsRoutes = require(
  "./routes/company/analyticsRoutes"
);

// Company Password
const passwordRoutes = require(
  "./routes/company/passwordRoutes"
);


// =====================================================
// EMPLOYEE API ROUTES
// =====================================================

// Employee Auth
//
// POST /api/employee/register
// POST /api/employee/login

app.use(
  "/api/employee",
  employeeRoutes
);


// =====================================================
// EMPLOYEE JOB ROUTES
// =====================================================
//
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


// =====================================================
// EMPLOYEE PROFILE
// =====================================================
//
// GET /api/employee/profile
// PUT /api/employee/profile/:user_id

app.use(
  "/api/employee",
  employeeProfileRoutes
);


// =====================================================
// JOB API ROUTES
// =====================================================
//
// GET  /api/jobs/
// POST /api/jobs/apply/:job_id
// POST /api/jobs/save/:job_id

app.use(
  "/api/jobs",
  employeeJobRoutes
);


// =====================================================
// EMPLOYEE PASSWORD
// =====================================================

app.use(
  "/api/employee/password",
  employeePasswordRoutes
);


// =====================================================
// EMPLOYEE COMPANY
// =====================================================

app.use(
  "/api/employee",
  employeeCompanyRoutes
);


// =====================================================
// COMPANY AUTH ROUTES
// =====================================================
//
// POST /api/company/login
// POST /api/company/register

app.use(
  "/api/company",
  companyAuthRoutes
);


// =====================================================
// COMPANY DASHBOARD
// =====================================================
//
// GET /api/company/dashboard/:company_id

app.use(
  "/api/company",
  dashboardRoutes
);


// =====================================================
// COMPANY JOB ROUTES
// =====================================================
//
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
//
// GET /api/company/applicants
// PUT /api/company/applicants/:application_id
// GET /api/company/employee-profile/:employee_id
// PUT /api/company/applicants/:application_id/interview

app.use(
  "/api",
  applicantRoutes
);


// =====================================================
// COMPANY PROFILE
// =====================================================
//
// GET  /api/company/profile
// PUT  /api/company/profile
// POST /api/company/profile/logo

app.use(
  "/api/company",
  companyProfileRoutes
);


// =====================================================
// COMPANY ANALYTICS
// =====================================================
//
// GET /api/company/analytics
// GET /api/company/analytics/...

app.use(
  "/api/company/analytics",
  analyticsRoutes
);


// =====================================================
// COMPANY PASSWORD
// =====================================================
//
// PUT  /api/company/password/change-password
// POST /api/company/password/forgot-password/send-otp
// POST /api/company/password/forgot-password/verify-otp
// POST /api/company/password/forgot-password/reset

app.use(
  "/api/company/password",
  passwordRoutes
);


// =====================================================
// ROOT TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Job Portal Backend API is running",
  });
});


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});


// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this request",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});


// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});