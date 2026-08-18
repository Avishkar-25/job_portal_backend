const multer = require("multer");
const path = require("path");

// =====================================================
// MEMORY STORAGE
// Files will be uploaded to Cloudinary from controller
// =====================================================

const storage = multer.memoryStorage();


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {

    // ==========================================
    // PROFILE PHOTO
    // ==========================================

    if (file.fieldname === "profile_photo") {

        const ext = path
            .extname(file.originalname)
            .toLowerCase();

        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ];

        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (
            allowedExtensions.includes(ext) &&
            allowedMimeTypes.includes(file.mimetype)
        ) {

            return cb(null, true);

        }

        return cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            )
        );
    }


    // ==========================================
    // RESUME
    // ==========================================

    if (file.fieldname === "resume") {

        const ext = path
            .extname(file.originalname)
            .toLowerCase();

        if (
            ext === ".pdf" &&
            file.mimetype === "application/pdf"
        ) {

            return cb(null, true);

        }

        return cb(
            new Error(
                "Only PDF resume is allowed."
            )
        );
    }


    // ==========================================
    // INVALID FIELD
    // ==========================================

    return cb(
        new Error(
            "Invalid upload field."
        )
    );

};


// =====================================================
// MULTER
// =====================================================

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});


module.exports = upload;