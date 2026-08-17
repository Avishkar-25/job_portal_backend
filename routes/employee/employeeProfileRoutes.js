const express = require("express");

const router = express.Router();
const cloudinary = require("../../config/cloudinary");
const streamifier = require("streamifier");

const multer = require("multer");
const path = require("path");


const employeeProfileController =
  require("../../controllers/employee/employeeProfileController");

const {

  getEmployeeProfile,
  updateEmployeeProfile,
  uploadProfilePhoto,
  getCareerPreference,
  updateCareerPreference,
  getAbout,
  updateAbout,
  getEducation,
  addEducation,
  updateEducation,
  deleteEducation,
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  updateProfessionalDetails,
  getProfessionalDetails,
  updateProfessionalSummary,
  getProfessionalSummary,
   getSocialProfiles,
  updateSocialProfiles,
  deleteSocialProfile,
    getAddress,
  updateAddress,
  deleteAddress,
  checkProfileCompletion

} = require("../../controllers/employee/employeeProfileController");


const upload = require("../../config/multer");


// =======================================
// Resume Upload Configuration
// =======================================

const resumeDir = path.join(
  __dirname,
  "../uploads/resumes"
);

// Create folder if not exists
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, {
    recursive: true,
  });
}


// Upload Profile Photo
router.post(

  "/profile/photo/:user_id",

  upload.single("profile_photo"),

  uploadProfilePhoto

);

// Get Profile
router.get(

  "/profile/:user_id",

  getEmployeeProfile

);

// Update Profile
router.put(

  "/profile/:user_id",

  updateEmployeeProfile

);

// CareerPreference display
router.get(
  "/career/:user_id",
  getCareerPreference
);

// CareerPerference Update
router.put(
  "/career/:user_id",
  updateCareerPreference
);

//  show about 
router.get(
  "/about/:user_id",
  getAbout
);

// Update About Section
router.put(
  "/about/:user_id",
  updateAbout
);

// ===============================
// Education
// ===============================

router.get(
  "/education/:user_id",
  getEducation
);

router.post(
  "/education/:user_id",
  addEducation
);

router.put(
  "/education/:qualification_id",
  updateEducation
);

router.delete(
  "/education/:qualification_id",
  deleteEducation
);

// ===============================
// Skills
// ===============================

router.get(
  "/skills/:user_id",
  getSkills
);

router.post(
  "/skills/:user_id",
  addSkill
);

router.put(
  "/skills/:skill_id",
  updateSkill
);

router.delete(
  "/skills/:skill_id",
  deleteSkill
);

// Professional Details
router.get(
  "/professional/:user_id",
  getProfessionalDetails
);

router.put(
  "/professional/:user_id",
  updateProfessionalDetails
);

// =======================================
// Professional Summary
// =======================================

router.get(
  "/professional-summary/:user_id",
  getProfessionalSummary
);

router.put(
  "/professional-summary/:user_id",
  updateProfessionalSummary
);
// Resume

router.get(
  "/resume/:user_id",
  employeeProfileController.getEmployeeResume
);


router.post(
  "/resume/:user_id",
  employeeProfileController.uploadEmployeeResume
);


router.delete(
  "/resume/:user_id",
  employeeProfileController.deleteEmployeeResume
);

// =======================================
// Social Profiles
// =======================================

router.get(
  "/social/:user_id",
  getSocialProfiles
);

router.put(
  "/social/:user_id",
  updateSocialProfiles
);

router.delete(
  "/social/:user_id/:type",
  deleteSocialProfile
);

// =======================================
// Address
// =======================================

router.get(
  "/address/:user_id",
  getAddress
);

router.put(
  "/address/:user_id",
  updateAddress
);

router.delete(
  "/address/:user_id",
  deleteAddress
);

// Profile Completion
router.get(
  "/profile-completion/:user_id",
  checkProfileCompletion
);
module.exports = router;
