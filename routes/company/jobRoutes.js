const express = require("express");

const router = express.Router();


const verifyToken = require("../../middleware/verifyToken");


const {

createJob,
getMyJobs,
getSingleJob,
updateJob,
deleteJob

} = require("../../controllers/company/jobController");





router.post(

    "/jobs/create",
    verifyToken,
    createJob

);



router.get(

    "/jobs",
    verifyToken,
    getMyJobs

);




router.get(

"/jobs/:job_id",
verifyToken,
getSingleJob

);



router.put(

"/jobs/:job_id",
verifyToken,
updateJob

);

router.delete(
  "/jobs/:job_id",
  verifyToken,
  deleteJob
);
module.exports = router;