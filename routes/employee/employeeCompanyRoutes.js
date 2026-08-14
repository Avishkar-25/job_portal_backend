const express = require("express");

const router = express.Router();

const {
  getCompanyProfile,
} = require("../../controllers/employee/employeeCompanyController");

router.get("/company/:company_id", getCompanyProfile);

module.exports = router;