const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ===============================
// Upload Directories
// ===============================

const profileDir = path.join(__dirname, "../uploads/profiles");
const resumeDir = path.join(__dirname, "../uploads/resumes");
const companyLogoDir = path.join(__dirname, "../uploads/company/logos");
const companyCoverDir = path.join(__dirname, "../uploads/company/covers");

// ===============================
// Create Directories
// ===============================

[
  profileDir,
  resumeDir,
  companyLogoDir,
  companyCoverDir,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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
  },
});

// ===============================
// File Filter
// ===============================

const fileFilter = (req, file, cb) => {
  // Image Uploads
  if (
    file.fieldname === "profile_photo" ||
    file.fieldname === "logo" ||
    file.fieldname === "cover_image"
  ) {
    const allowed = /jpeg|jpg|png|webp/;

    const ext = allowed.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mime = allowed.test(
      file.mimetype.split("/")[1]
    );

    if (ext && mime) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP image files are allowed."
      )
    );
  }

  // Resume Upload
  if (file.fieldname === "resume") {
    const ext = path.extname(file.originalname).toLowerCase();

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
// Multer Upload
// ===============================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = upload;