const express = require("express");

const router = express.Router();

const multer = require("multer");

// Employee Profile Controller
const employeeProfileController = require("../../controllers/employee/employeeProfileController");

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

  getProfessionalDetails,
  updateProfessionalDetails,

  getProfessionalSummary,
  updateProfessionalSummary,

  getSocialProfiles,
  updateSocialProfiles,
  deleteSocialProfile,

  getAddress,
  updateAddress,
  deleteAddress,

  checkProfileCompletion,

} = require("../../controllers/employee/employeeProfileController");


// =====================================================
// MULTER CONFIGURATION
// =====================================================

// Memory storage
// Files temporary memory मध्ये राहतील आणि Cloudinary वर जातील
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});


// =====================================================
// PROFILE PHOTO
// =====================================================

// Upload / Update Profile Photo
router.post(
  "/profile/photo/:user_id",
  upload.single("profile_photo"),
  uploadProfilePhoto
);


// =====================================================
// EMPLOYEE PROFILE
// =====================================================

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


// =====================================================
// CAREER PREFERENCE
// =====================================================

// Get Career Preference
router.get(
  "/career/:user_id",
  getCareerPreference
);


// Update Career Preference
router.put(
  "/career/:user_id",
  updateCareerPreference
);


// =====================================================
// ABOUT
// =====================================================

// Get About
router.get(
  "/about/:user_id",
  getAbout
);


// Update About
router.put(
  "/about/:user_id",
  updateAbout
);


// =====================================================
// EDUCATION
// =====================================================

// Get Education
router.get(
  "/education/:user_id",
  getEducation
);


// Add Education
router.post(
  "/education/:user_id",
  addEducation
);


// Update Education
router.put(
  "/education/:qualification_id",
  updateEducation
);


// Delete Education
router.delete(
  "/education/:qualification_id",
  deleteEducation
);


// =====================================================
// SKILLS
// =====================================================

// Get Skills
router.get(
  "/skills/:user_id",
  getSkills
);


// Add Skill
router.post(
  "/skills/:user_id",
  addSkill
);


// Update Skill
router.put(
  "/skills/:skill_id",
  updateSkill
);


// Delete Skill
router.delete(
  "/skills/:skill_id",
  deleteSkill
);


// =====================================================
// PROFESSIONAL DETAILS
// =====================================================

// Get Professional Details
router.get(
  "/professional/:user_id",
  getProfessionalDetails
);


// Update Professional Details
router.put(
  "/professional/:user_id",
  updateProfessionalDetails
);


// =====================================================
// PROFESSIONAL SUMMARY
// =====================================================

// Get Professional Summary
router.get(
  "/professional-summary/:user_id",
  getProfessionalSummary
);


// Update Professional Summary
router.put(
  "/professional-summary/:user_id",
  updateProfessionalSummary
);


// =====================================================
// RESUME - CLOUDINARY
// =====================================================

// Get Resume
router.get(
  "/resume/:user_id",
  employeeProfileController.getEmployeeResume
);


// Upload / Update Resume
router.post(
  "/resume/:user_id",
  upload.single("resume"),
  employeeProfileController.uploadEmployeeResume
);


// Delete Resume
router.delete(
  "/resume/:user_id",
  employeeProfileController.deleteEmployeeResume
);


// =====================================================
// SOCIAL PROFILES
// =====================================================

// Get Social Profiles
router.get(
  "/social/:user_id",
  getSocialProfiles
);


// Update Social Profiles
router.put(
  "/social/:user_id",
  updateSocialProfiles
);


// Delete Social Profile
router.delete(
  "/social/:user_id/:type",
  deleteSocialProfile
);


// =====================================================
// ADDRESS
// =====================================================

// Get Address
router.get(
  "/address/:user_id",
  getAddress
);


// Update Address
router.put(
  "/address/:user_id",
  updateAddress
);


// Delete Address
router.delete(
  "/address/:user_id",
  deleteAddress
);


// =====================================================
// PROFILE COMPLETION
// =====================================================

router.get(
  "/profile-completion/:user_id",
  checkProfileCompletion
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;