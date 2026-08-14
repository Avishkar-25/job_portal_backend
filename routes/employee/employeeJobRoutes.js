const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const {
  getAllJobs,
  getJobById,
  getAppliedJobs,
  applyJob,
  saveJob,
  getSavedJobs,
  removeSavedJob,
  cancelApplication
} = require("../../controllers/employee/employeeJobController");

// ================= All Jobs =================
router.get("/", getAllJobs);

// ================= Apply Job =================
router.post("/apply/:job_id", applyJob);

// ================= Applied Jobs =================
router.get("/applied-jobs/:user_id", getAppliedJobs);

// ================= Save Job =================
router.post("/save/:job_id", saveJob);

// ================= Saved Jobs =================
router.get("/saved/:user_id", getSavedJobs);

// ================= Remove Saved Job =================
router.delete("/unsave/:job_id", removeSavedJob);

// ================= Job Details =================
router.get("/:id", getJobById);

router.delete(
  "/applications/:application_id",
  authMiddleware,
  cancelApplication
);
module.exports = router;