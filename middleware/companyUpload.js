const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");

const logoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "job-portal/company/logos",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image"
    }
});

const coverStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "job-portal/company/covers",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image"
    }
});

const fileFilter = (req, file, cb) => {

    const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            )
        );
    }

    cb(null, true);
};

const uploadCompanyLogo = multer({
    storage: logoStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const uploadCompanyCover = multer({
    storage: coverStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = {
    uploadCompanyLogo,
    uploadCompanyCover
};