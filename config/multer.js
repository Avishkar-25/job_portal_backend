const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ===============================
// Upload Directories
// ===============================

const profileDir = path.join(__dirname, "../uploads/employee/profiles");
const resumeDir = path.join(__dirname, "../uploads/employee/resumes");

const companyLogoDir = path.join(
    __dirname,
    "../uploads/company/logos"
);

const companyCoverDir = path.join(
    __dirname,
    "../uploads/company/covers"
);

// ===============================
// Create Directories
// ===============================

[
    profileDir,
    resumeDir,
    companyLogoDir,
    companyCoverDir
].forEach((dir) => {

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }

});

// ===============================
// Storage
// ===============================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        switch (file.fieldname) {

            case "profile_photo":
                cb(null, profileDir);
                break;

            case "resume":
                cb(null, resumeDir);
                break;

            case "logo":
                cb(null, companyLogoDir);
                break;

            case "cover_image":
                cb(null, companyCoverDir);
                break;

            default:
                cb(new Error("Invalid upload field."));
        }

    },

    filename: (req, file, cb) => {

        const fileName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, fileName);

    }

});

// ===============================
// File Filter
// ===============================

const fileFilter = (req, file, cb) => {

    // Images
    if (
        file.fieldname === "profile_photo" ||
        file.fieldname === "logo" ||
        file.fieldname === "cover_image"
    ) {

        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ];

        const ext = path
            .extname(file.originalname)
            .toLowerCase();

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

    // Resume
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
            new Error("Only PDF resume is allowed.")
        );
    }

    cb(new Error("Invalid upload field."));
};

// ===============================
// Multer
// ===============================

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});

module.exports = upload;