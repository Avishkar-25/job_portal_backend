const express = require("express");
const router = express.Router();

const {
    uploadCompanyLogo,
    uploadCompanyCover
} = require("../../middleware/upload");

const auth = require("../../middleware/authMiddleware");

const {
    getCompanyProfile,
    updateCompanyInformation,
    updateCompanyAddress,
    updateCompanyLegal,
    deleteCompanyLegal,
    updateCompanySocial,
    deleteCompanySocial,
    uploadLogo,
    uploadCover
} = require("../../controllers/company/companyProfileController");


// =====================================================
// GET COMPANY PROFILE
// =====================================================

router.get(
    "/profile",
    auth,
    getCompanyProfile
);


// =====================================================
// COMPANY INFORMATION
// =====================================================

router.put(
    "/profile/information",
    auth,
    updateCompanyInformation
);


// =====================================================
// ADDRESS
// =====================================================

router.put(
    "/profile/address",
    auth,
    updateCompanyAddress
);


// =====================================================
// LEGAL DETAILS
// =====================================================

router.put(
    "/profile/legal",
    auth,
    updateCompanyLegal
);

router.delete(
    "/profile/legal/:type",
    auth,
    deleteCompanyLegal
);


// =====================================================
// SOCIAL MEDIA
// =====================================================

router.put(
    "/profile/social",
    auth,
    updateCompanySocial
);

router.delete(
    "/profile/social/:type",
    auth,
    deleteCompanySocial
);


// =====================================================
// LOGO
// =====================================================

router.post(
    "/profile/logo",
    auth,
    uploadCompanyLogo.single("logo"),
    uploadLogo
);


// =====================================================
// COVER
// =====================================================

router.post(
    "/profile/cover",
    auth,
    uploadCompanyCover.single("cover_image"),
    uploadCover
);


module.exports = router;