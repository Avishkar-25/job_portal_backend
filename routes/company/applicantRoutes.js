const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");

const {
  getApplicants,
  updateApplicantStatus,
  getEmployeeProfileForCompany,
  scheduleInterview,
  
} = require("../../controllers/company/applicantController");


// ==========================================
// GET COMPANY APPLICANTS
// GET /api/company/applicants
// ==========================================

router.get(
  "/company/applicants",
  authMiddleware,
  getApplicants
);


// ==========================================
// UPDATE APPLICANT STATUS
// PUT /api/company/applicants/:application_id
// ==========================================

router.put(
  "/company/applicants/:application_id",
  authMiddleware,
  updateApplicantStatus
);


// ==========================================
// GET EMPLOYEE PROFILE
// GET /api/company/employee-profile/:employee_id
// ==========================================

router.get(
  "/company/employee-profile/:employee_id",
  authMiddleware,
  getEmployeeProfileForCompany
);


// ==========================================
// SCHEDULE INTERVIEW
// PUT /api/company/applicants/:application_id/interview
// ==========================================

router.put(
  "/company/applicants/:application_id/interview",
  authMiddleware,
  scheduleInterview
);




module.exports = router;