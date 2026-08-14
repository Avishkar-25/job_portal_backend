const express = require("express");

const router = express.Router();


const verifyToken = require("../../middleware/verifyToken");


const {
    getDashboard
} = require("../../controllers/company/dashboardController");



router.get(
    "/dashboard",
    verifyToken,
    getDashboard
);



module.exports = router;