const db = require("../../config/db");
const fs = require("fs");
const path = require("path");


// =====================================================
// GET COMPANY PROFILE
// =====================================================

exports.getCompanyProfile = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const [rows] = await db.promise().query(
            `
            SELECT *
            FROM companies
            WHERE user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Company profile not found"
            });
        }

        res.json({
            success: true,
            company: rows[0]
        });

    } catch (error) {

        console.error("GET COMPANY PROFILE:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch company profile"
        });
    }
};


// =====================================================
// COMPANY INFORMATION
// =====================================================

exports.updateCompanyInformation = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const {
            company_name,
            email,
            phone,
            industry,
            website,
            description,
            founded_year,
            company_size,
            headquarters
        } = req.body;


        const [result] = await db.promise().query(
            `
            UPDATE companies
            SET
                company_name = ?,
                email = ?,
                phone = ?,
                industry = ?,
                website = ?,
                description = ?,
                founded_year = ?,
                company_size = ?,
                headquarters = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [
                company_name || null,
                email || null,
                phone || null,
                industry || null,
                website || null,
                description || null,
                founded_year || null,
                company_size || null,
                headquarters || null,
                user_id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }


        res.json({
            success: true,
            message: "Company information updated successfully"
        });

    } catch (error) {

        console.error(
            "UPDATE COMPANY INFORMATION:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update company information"
        });
    }
};


// =====================================================
// ADDRESS
// =====================================================

exports.updateCompanyAddress = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const {
            address,
            city,
            state,
            country,
            pincode
        } = req.body;


        const [result] = await db.promise().query(
            `
            UPDATE companies
            SET
                address = ?,
                city = ?,
                state = ?,
                country = ?,
                pincode = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [
                address || null,
                city || null,
                state || null,
                country || null,
                pincode || null,
                user_id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }


        res.json({
            success: true,
            message: "Company address updated successfully"
        });

    } catch (error) {

        console.error(
            "UPDATE COMPANY ADDRESS:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update address"
        });
    }
};


// =====================================================
// LEGAL DETAILS
// =====================================================

exports.updateCompanyLegal = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const {
            gst_number,
            cin_number,
            pan_number
        } = req.body;


        const [result] = await db.promise().query(
            `
            UPDATE companies
            SET
                gst_number = ?,
                cin_number = ?,
                pan_number = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [
                gst_number || null,
                cin_number || null,
                pan_number || null,
                user_id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }


        res.json({
            success: true,
            message: "Legal details updated successfully"
        });

    } catch (error) {

        console.error(
            "UPDATE COMPANY LEGAL:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update legal details"
        });
    }
};
// delete 
exports.deleteCompanyLegal = async (req, res) => {
    try {

        const user_id = req.user.user_id;
        const { type } = req.params;

        // Allowed legal fields
        const allowedFields = [
            "gst_number",
            "cin_number",
            "pan_number"
        ];

        // Validate field
        if (!allowedFields.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid legal detail type"
            });
        }

        const [result] = await db.promise().query(
            `
            UPDATE companies
            SET
                ${type} = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        res.json({
            success: true,
            message: `${type} deleted successfully`
        });

    } catch (error) {

        console.error(
            "DELETE COMPANY LEGAL:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete legal detail"
        });
    }
};


// =====================================================
// SOCIAL MEDIA
// =====================================================

exports.updateCompanySocial = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        const {
            linkedin,
            facebook,
            instagram,
            twitter
        } = req.body;


        const [result] = await db.promise().query(
            `
            UPDATE companies
            SET
                linkedin = ?,
                facebook = ?,
                instagram = ?,
                twitter = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [
                linkedin || null,
                facebook || null,
                instagram || null,
                twitter || null,
                user_id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }


        res.json({
            success: true,
            message: "Social media links updated successfully"
        });

    } catch (error) {

        console.error(
            "UPDATE COMPANY SOCIAL:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update social media links"
        });
    }
};

//delete social links
exports.deleteCompanySocial = async (req, res) => {
    try {

        const user_id = req.user.user_id;
        const { type } = req.params;

        // Allowed social fields
        const allowedFields = [
            "linkedin",
            "facebook",
            "instagram",
            "twitter"
        ];

        // Check valid field
        if (!allowedFields.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid social media type"
            });
        }

        // Dynamic column name is safe because
        // it comes only from allowedFields
        const [result] = await db.promise().query(
            `
            UPDATE companies
            SET
                ${type} = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        res.json({
            success: true,
            message: `${type} link deleted successfully`
        });

    } catch (error) {

        console.error(
            "DELETE COMPANY SOCIAL:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete social media link"
        });
    }
};
// =====================================================
// UPLOAD LOGO
// =====================================================


// =====================================================
// UPLOAD LOGO
// =====================================================

exports.uploadLogo = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Logo is required"
            });

        }

        const [rows] = await db.promise().query(
            `
            SELECT logo
            FROM companies
            WHERE user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });

        }

        const oldLogo = rows[0].logo;

        await db.promise().query(
            `
            UPDATE companies
            SET
                logo = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [
                req.file.filename,
                user_id
            ]
        );

        // Delete old logo
        if (oldLogo) {

            const oldPath = path.join(
                __dirname,
                "../../uploads/company/logos",
                oldLogo
            );

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }

        }

        res.json({

            success: true,

            message: "Logo uploaded successfully",

            logo: req.file.filename

        });

    } catch (error) {

        console.error(
            "UPLOAD LOGO:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to upload logo"

        });

    }

};


// =====================================================
// UPLOAD COVER
// =====================================================

exports.uploadCover = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Cover image is required"
            });

        }

        const [rows] = await db.promise().query(
            `
            SELECT cover_image
            FROM companies
            WHERE user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Company not found"
            });

        }

        const oldCover = rows[0].cover_image;

        await db.promise().query(
            `
            UPDATE companies
            SET
                cover_image = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [
                req.file.filename,
                user_id
            ]
        );

        // Delete old cover
        if (oldCover) {

            const oldPath = path.join(
                __dirname,
                "../../uploads/company/covers",
                oldCover
            );

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }

        }

        res.json({

            success: true,

            message: "Cover uploaded successfully",

            cover_image: req.file.filename

        });

    } catch (error) {

        console.error(
            "UPLOAD COVER:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to upload cover"

        });

    }

};