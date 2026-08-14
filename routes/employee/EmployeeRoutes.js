const express = require("express");
const router = express.Router();

const upload = require("../../middleware/upload");

const {
    employeeRegister,
    employeeLogin,
    
    
    employeeDashboard,
    getAllJobs
} = require("../../controllers/employee/EmployeeController");

// Register
router.post("/register", employeeRegister);

// Login
router.post("/login", employeeLogin);

// Get Profile



 
// dashboard
router.get("/dashboard/:user_id", employeeDashboard);

// browse jobs
router.get("/jobs", getAllJobs);
module.exports = router;