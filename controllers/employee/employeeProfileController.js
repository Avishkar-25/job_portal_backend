const db = require("../../config/db");
const multer = require("multer");
const path = require("path");
const cloudinary = require("../../config/cloudinary");
const streamifier = require("streamifier");

// =====================================================
// CLOUDINARY MULTER CONFIGURATION
// =====================================================

// =====================================================
// PROFILE PHOTO UPLOAD
// =====================================================

const uploadProfile = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, PNG and WEBP images are allowed"
        )
      );
    }

    cb(null, true);
  },
});

exports.uploadProfileMiddleware =
  uploadProfile.single("profile_photo");

// =====================================================
// RESUME UPLOAD
// =====================================================

const uploadResume = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    if (
      ext !== ".pdf" ||
      file.mimetype !== "application/pdf"
    ) {
      return cb(
        new Error("Only PDF files are allowed")
      );
    }

    cb(null, true);
  },
});

exports.uploadResumeMiddleware =
  uploadResume.single("resume");

// =====================================================
// HELPER - DELETE CLOUDINARY FILE FROM URL
// =====================================================

const deleteCloudinaryFile = async (
  fileUrl,
  resourceType = "image"
) => {
  try {
    if (!fileUrl) {
      return;
    }

    const uploadIndex =
      fileUrl.indexOf("/upload/");

    if (uploadIndex === -1) {
      return;
    }

    let publicId =
      fileUrl.substring(uploadIndex + 8);

    // Remove version
    publicId = publicId.replace(
      /^v\d+\//,
      ""
    );

    // Remove extension
    publicId = publicId.replace(
      /\.[^/.]+$/,
      ""
    );

    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType,
      }
    );

    console.log(
      `Cloudinary ${resourceType} deleted:`,
      publicId
    );
  } catch (error) {
    console.log(
      `Cloudinary ${resourceType} delete error:`,
      error.message
    );
  }
};

// =====================================================
// CHECK EMPLOYEE PROFILE COMPLETION
// =====================================================

exports.checkProfileCompletion = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const [employee] =
      await db.promise().query(
        `
        SELECT
          employee_id,
          full_name,
          profession,
          email,
          phone,
          gender,
          dob,
          address,
          city,
          state,
          country,
          pincode,
          experience,
          about,
          professional_summary,
          resume
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        profileComplete: false,
        message:
          "Employee profile not found",
      });
    }

    const emp = employee[0];
    const employee_id = emp.employee_id;

    // Education
    const [education] =
      await db.promise().query(
        `
        SELECT qualification_id
        FROM employee_qualifications
        WHERE employee_id = ?
        LIMIT 1
        `,
        [employee_id]
      );

    // Skills
    const [skills] =
      await db.promise().query(
        `
        SELECT skill_id
        FROM skill
        WHERE employee_id = ?
        LIMIT 1
        `,
        [employee_id]
      );

    // Career
    const [career] =
      await db.promise().query(
        `
        SELECT career_id
        FROM employee_career_preferences
        WHERE employee_id = ?
        LIMIT 1
        `,
        [employee_id]
      );

    const requiredFields = {
      full_name: emp.full_name,
      profession: emp.profession,
      email: emp.email,
      phone: emp.phone,
      gender: emp.gender,
      dob: emp.dob,
      address: emp.address,
      city: emp.city,
      state: emp.state,
      country: emp.country,
      pincode: emp.pincode,
      experience: emp.experience,
      about: emp.about,
      professional_summary:
        emp.professional_summary,
      resume: emp.resume,
    };

    const missingFields = [];

    Object.keys(requiredFields).forEach(
      (field) => {
        const value =
          requiredFields[field];

        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          missingFields.push(field);
        }
      }
    );

    if (education.length === 0) {
      missingFields.push("education");
    }

    if (skills.length === 0) {
      missingFields.push("skills");
    }

    if (career.length === 0) {
      missingFields.push(
        "careerPreferences"
      );
    }

    const totalFields = 18;

    const completedFields =
      totalFields -
      missingFields.length;

    let percentage = Math.round(
      (completedFields /
        totalFields) *
        100
    );

    if (percentage < 0) {
      percentage = 0;
    }

    const profileComplete =
      missingFields.length === 0;

    return res.json({
      success: true,
      profileComplete,
      percentage,
      missingFields,
      message: profileComplete
        ? "Profile is complete"
        : "Please complete your profile before applying",
    });
  } catch (error) {
    console.log(
      "Profile Completion Error:",
      error
    );

    return res.status(500).json({
      success: false,
      profileComplete: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// GET EMPLOYEE PROFILE
// =====================================================

exports.getEmployeeProfile = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const [employee] =
      await db.promise().query(
        `
        SELECT
          employee_id,
          user_id,
          full_name,
          profession,
          email,
          phone,
          gender,
          dob,
          address,
          city,
          state,
          country,
          pincode,
          experience,
          current_company,
          current_salary,
          expected_salary,
          resume,
          profile_photo,
          linkedin,
          github,
          portfolio,
          about,
          professional_summary,
          status
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id =
      employee[0].employee_id;

    const [education] =
      await db.promise().query(
        `
        SELECT
          qualification_id,
          qualification,
          college_name,
          passing_year,
          cgpa
        FROM employee_qualifications
        WHERE employee_id = ?
        ORDER BY qualification_id DESC
        `,
        [employee_id]
      );

    const [careerPreferences] =
      await db.promise().query(
        `
        SELECT
          career_id,
          employee_id,
          job_type,
          availability,
          preferred_locations,
          updated_at
        FROM employee_career_preferences
        WHERE employee_id = ?
        ORDER BY career_id DESC
        LIMIT 1
        `,
        [employee_id]
      );

    return res.json({
      success: true,
      profile: {
        ...employee[0],
        education,
        careerPreferences:
          careerPreferences.length > 0
            ? careerPreferences[0]
            : null,
      },
    });
  } catch (error) {
    console.log(
      "Get Employee Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// UPDATE EMPLOYEE PROFILE
// =====================================================

exports.updateEmployeeProfile = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const {
      full_name,
      profession,
      email,
      phone,
      gender,
      dob,
      address,
      city,
      state,
      country,
      pincode,
      experience,
      current_company,
      current_salary,
      expected_salary,
      linkedin,
      github,
      portfolio,
      about,
      professional_summary,
    } = req.body;

    const fields = [];
    const values = [];

    const addField = (
      field,
      value
    ) => {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        values.push(
          value === "" ? null : value
        );
      }
    };

    addField("full_name", full_name);
    addField("profession", profession);
    addField("email", email);
    addField("phone", phone);
    addField("gender", gender);
    addField("dob", dob);
    addField("address", address);
    addField("city", city);
    addField("state", state);
    addField("country", country);
    addField("pincode", pincode);
    addField("experience", experience);
    addField(
      "current_company",
      current_company
    );
    addField(
      "current_salary",
      current_salary
    );
    addField(
      "expected_salary",
      expected_salary
    );
    addField("linkedin", linkedin);
    addField("github", github);
    addField("portfolio", portfolio);
    addField("about", about);
    addField(
      "professional_summary",
      professional_summary
    );

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No fields provided for update",
      });
    }

    fields.push("updated_at = NOW()");
    values.push(user_id);

    const [result] =
      await db.promise().query(
        `
        UPDATE employee
        SET ${fields.join(", ")}
        WHERE user_id = ?
        `,
        values
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Profile Updated Successfully",
    });
  } catch (error) {
    console.log(
      "Update Employee Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// UPLOAD PROFILE PHOTO - CLOUDINARY
// =====================================================

exports.uploadProfilePhoto = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const [employee] =
      await db.promise().query(
        `
        SELECT
          employee_id,
          profile_photo
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Delete old image
    if (employee[0].profile_photo) {
      await deleteCloudinaryFile(
        employee[0].profile_photo,
        "image"
      );
    }

    // Upload new image
    const uploadResult =
      await new Promise(
        (resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder:
                  "job-portal/profile-photos",

                resource_type: "image",

                public_id:
                  `employee_${user_id}_${Date.now()}`,
              },

              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

          streamifier
            .createReadStream(
              req.file.buffer
            )
            .pipe(stream);
        }
      );

    const imageUrl =
      uploadResult.secure_url;

    const publicId =
      uploadResult.public_id;

    await db.promise().query(
      `
      UPDATE employee
      SET
        profile_photo = ?,
        updated_at = NOW()
      WHERE user_id = ?
      `,
      [
        imageUrl,
        user_id,
      ]
    );

    return res.json({
      success: true,
      message:
        "Profile photo uploaded successfully",
      profile_photo: imageUrl,
      public_id: publicId,
    });
  } catch (error) {
    console.log(
      "Upload Profile Photo Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

// =====================================================
// GET CAREER PREFERENCE
// =====================================================

exports.getCareerPreference = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const [employee] =
      await db.promise().query(
        `
        SELECT employee_id
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.json({
        success: false,
      });
    }

    const employee_id =
      employee[0].employee_id;

    const [career] =
      await db.promise().query(
        `
        SELECT
          job_type,
          availability,
          preferred_locations
        FROM employee_career_preferences
        WHERE employee_id = ?
        `,
        [employee_id]
      );

    return res.json({
      success: true,

      career:
        career.length > 0
          ? career[0]
          : {
              job_type: "",
              availability: "",
              preferred_locations: "",
            },
    });
  } catch (error) {
    console.log(
      "Get Career Preference Error:",
      error
    );

    return res.status(500).json({
      success: false,
    });
  }
};

// =====================================================
// UPDATE CAREER PREFERENCE
// =====================================================

exports.updateCareerPreference = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const {
      job_type,
      availability,
      preferred_locations,
    } = req.body;

    const [employee] =
      await db.promise().query(
        `
        SELECT employee_id
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id =
      employee[0].employee_id;

    const [check] =
      await db.promise().query(
        `
        SELECT career_id
        FROM employee_career_preferences
        WHERE employee_id = ?
        `,
        [employee_id]
      );

    if (check.length > 0) {
      await db.promise().query(
        `
        UPDATE employee_career_preferences
        SET
          job_type = ?,
          availability = ?,
          preferred_locations = ?
        WHERE employee_id = ?
        `,
        [
          job_type,
          availability,
          preferred_locations,
          employee_id,
        ]
      );
    } else {
      await db.promise().query(
        `
        INSERT INTO employee_career_preferences
        (
          employee_id,
          job_type,
          availability,
          preferred_locations
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          employee_id,
          job_type,
          availability,
          preferred_locations,
        ]
      );
    }

    return res.json({
      success: true,
      message: "Career Updated",
    });
  } catch (error) {
    console.log(
      "Update Career Preference Error:",
      error
    );

    return res.status(500).json({
      success: false,
    });
  }
};

// =====================================================
// GET ABOUT
// =====================================================

exports.getAbout = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const [rows] =
      await db.promise().query(
        `
        SELECT about
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.json({
      success: true,
      about: rows[0].about,
    });
  } catch (error) {
    console.log(
      "Get About Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// UPDATE ABOUT
// =====================================================

exports.updateAbout = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;
    const { about } = req.body;

    const [result] =
      await db.promise().query(
        `
        UPDATE employee
        SET
          about = ?,
          updated_at = NOW()
        WHERE user_id = ?
        `,
        [about || null, user_id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.json({
      success: true,
      message:
        "About updated successfully",
    });
  } catch (error) {
    console.log(
      "Update About Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================================
// GET EDUCATION
// =====================================================

exports.getEducation = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const [employee] =
      await db.promise().query(
        `
        SELECT employee_id
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id =
      employee[0].employee_id;

    const [education] =
      await db.promise().query(
        `
        SELECT
          qualification_id,
          employee_id,
          qualification,
          college_name,
          passing_year,
          cgpa
        FROM employee_qualifications
        WHERE employee_id = ?
        ORDER BY passing_year DESC
        `,
        [employee_id]
      );

    return res.json({
      success: true,
      education,
    });
  } catch (error) {
    console.log(
      "Get Education Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch education",
    });
  }
};

// =====================================================
// ADD EDUCATION
// =====================================================

exports.addEducation = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const {
      qualification,
      college_name,
      passing_year,
      cgpa,
    } = req.body;

    if (
      !qualification ||
      !college_name ||
      !passing_year ||
      !cgpa
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All education fields are required",
      });
    }

    const [employee] =
      await db.promise().query(
        `
        SELECT employee_id
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id =
      employee[0].employee_id;

    const [result] =
      await db.promise().query(
        `
        INSERT INTO employee_qualifications
        (
          employee_id,
          qualification,
          college_name,
          passing_year,
          cgpa
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          employee_id,
          qualification,
          college_name,
          passing_year,
          cgpa,
        ]
      );

    return res.status(201).json({
      success: true,
      message:
        "Education added successfully",
      qualification_id:
        result.insertId,
    });
  } catch (error) {
    console.log(
      "Add Education Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add education",
    });
  }
};

// =====================================================
// UPDATE EDUCATION
// =====================================================

exports.updateEducation = async (
  req,
  res
) => {
  try {
    const { qualification_id } =
      req.params;

    const {
      qualification,
      college_name,
      passing_year,
      cgpa,
    } = req.body;

    if (
      !qualification ||
      !college_name ||
      !passing_year ||
      !cgpa
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All education fields are required",
      });
    }

    const [result] =
      await db.promise().query(
        `
        UPDATE employee_qualifications
        SET
          qualification = ?,
          college_name = ?,
          passing_year = ?,
          cgpa = ?
        WHERE qualification_id = ?
        `,
        [
          qualification,
          college_name,
          passing_year,
          cgpa,
          qualification_id,
        ]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Education not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Education updated successfully",
    });
  } catch (error) {
    console.log(
      "Update Education Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update education",
    });
  }
};

// =====================================================
// DELETE EDUCATION
// =====================================================

exports.deleteEducation = async (
  req,
  res
) => {
  try {
    const { qualification_id } =
      req.params;

    const [result] =
      await db.promise().query(
        `
        DELETE FROM employee_qualifications
        WHERE qualification_id = ?
        `,
        [qualification_id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Education not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Education deleted successfully",
    });
  } catch (error) {
    console.log(
      "Delete Education Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete education",
    });
  }
};

// =====================================================
// GET SKILLS
// =====================================================

exports.getSkills = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const [employee] =
      await db.promise().query(
        `
        SELECT employee_id
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id =
      employee[0].employee_id;

    const [skills] =
      await db.promise().query(
        `
        SELECT
          skill_id,
          employee_id,
          skill_name,
          skill_level,
          created_at
        FROM skill
        WHERE employee_id = ?
        ORDER BY skill_id DESC
        `,
        [employee_id]
      );

    return res.json({
      success: true,
      skills,
    });
  } catch (error) {
    console.log(
      "Get Skills Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch skills",
    });
  }
};

// =====================================================
// ADD SKILL
// =====================================================

exports.addSkill = async (
  req,
  res
) => {
  try {
    const { user_id } = req.params;

    const {
      skill_name,
      skill_level,
    } = req.body;

    if (
      !skill_name ||
      !skill_level
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Skill name and skill level are required",
      });
    }

    const validLevels = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
    ];

    if (
      !validLevels.includes(
        skill_level
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid skill level",
      });
    }

    const [employee] =
      await db.promise().query(
        `
        SELECT employee_id
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee_id =
      employee[0].employee_id;

    const [result] =
      await db.promise().query(
        `
        INSERT INTO skill
        (
          employee_id,
          skill_name,
          skill_level
        )
        VALUES (?, ?, ?)
        `,
        [
          employee_id,
          skill_name.trim(),
          skill_level,
        ]
      );

    return res.status(201).json({
      success: true,
      message:
        "Skill added successfully",
      skill_id:
        result.insertId,
    });
  } catch (error) {
    console.log(
      "Add Skill Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add skill",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE SKILL
// =====================================================

exports.updateSkill = async (
  req,
  res
) => {
  try {
    const { skill_id } =
      req.params;

    const {
      skill_name,
      skill_level,
    } = req.body;

    if (
      !skill_name ||
      !skill_level
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Skill name and skill level are required",
      });
    }

    const validLevels = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
    ];

    if (
      !validLevels.includes(
        skill_level
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid skill level",
      });
    }

    const [result] =
      await db.promise().query(
        `
        UPDATE skill
        SET
          skill_name = ?,
          skill_level = ?
        WHERE skill_id = ?
        `,
        [
          skill_name.trim(),
          skill_level,
          skill_id,
        ]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Skill updated successfully",
    });
  } catch (error) {
    console.log(
      "Update Skill Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update skill",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE SKILL
// =====================================================

exports.deleteSkill = async (
  req,
  res
) => {
  try {
    const { skill_id } =
      req.params;

    const [result] =
      await db.promise().query(
        `
        DELETE FROM skill
        WHERE skill_id = ?
        `,
        [skill_id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Skill deleted successfully",
    });
  } catch (error) {
    console.log(
      "Delete Skill Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete skill",
      error: error.message,
    });
  }
};

// =====================================================
// GET PROFESSIONAL DETAILS
// =====================================================

exports.getProfessionalDetails =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const [rows] =
        await db.promise().query(
          `
          SELECT
            employee_id,
            experience,
            current_company,
            current_salary,
            expected_salary
          FROM employee
          WHERE user_id = ?
          `,
          [user_id]
        );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      return res.json({
        success: true,
        professional: rows[0],
      });
    } catch (error) {
      console.log(
        "Get Professional Details Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get professional details",
      });
    }
  };

// =====================================================
// UPDATE PROFESSIONAL DETAILS
// =====================================================

exports.updateProfessionalDetails =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const {
        experience,
        current_company,
        current_salary,
        expected_salary,
      } = req.body;

      const [result] =
        await db.promise().query(
          `
          UPDATE employee
          SET
            experience = ?,
            current_company = ?,
            current_salary = ?,
            expected_salary = ?,
            updated_at = NOW()
          WHERE user_id = ?
          `,
          [
            experience || null,
            current_company || null,
            current_salary || null,
            expected_salary || null,
            user_id,
          ]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Professional details updated successfully",
      });
    } catch (error) {
      console.log(
        "Update Professional Details Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update professional details",
      });
    }
  };

// =====================================================
// GET PROFESSIONAL SUMMARY
// =====================================================

exports.getProfessionalSummary =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const [rows] =
        await db.promise().query(
          `
          SELECT
            employee_id,
            professional_summary
          FROM employee
          WHERE user_id = ?
          `,
          [user_id]
        );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      return res.json({
        success: true,
        summary:
          rows[0]
            .professional_summary ||
          "",
      });
    } catch (error) {
      console.log(
        "Get Professional Summary Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get professional summary",
      });
    }
  };

// =====================================================
// UPDATE PROFESSIONAL SUMMARY
// =====================================================

exports.updateProfessionalSummary =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const {
        professional_summary,
      } = req.body;

      const [result] =
        await db.promise().query(
          `
          UPDATE employee
          SET
            professional_summary = ?,
            updated_at = NOW()
          WHERE user_id = ?
          `,
          [
            professional_summary ||
              null,
            user_id,
          ]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Professional Summary updated successfully",
      });
    } catch (error) {
      console.log(
        "Update Professional Summary Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update professional summary",
      });
    }
  };

// =====================================================
// UPLOAD / UPDATE RESUME - CLOUDINARY
// =====================================================

exports.uploadEmployeeResume =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a PDF resume",
        });
      }

      const [employee] =
        await db.promise().query(
          `
          SELECT
            employee_id,
            resume
          FROM employee
          WHERE user_id = ?
          `,
          [user_id]
        );

      if (employee.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      // Delete old resume
      if (employee[0].resume) {
        await deleteCloudinaryFile(
          employee[0].resume,
          "raw"
        );
      }

      // Upload new resume
      const uploadResult =
        await new Promise(
          (resolve, reject) => {
            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    "job-portal/resumes",

                  resource_type: "raw",

                  public_id:
                    `resume_${user_id}_${Date.now()}`,
                },

                (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );

            streamifier
              .createReadStream(
                req.file.buffer
              )
              .pipe(stream);
          }
        );

      const resumeUrl =
        uploadResult.secure_url;

      const publicId =
        uploadResult.public_id;

      await db.promise().query(
        `
        UPDATE employee
        SET
          resume = ?,
          updated_at = NOW()
        WHERE user_id = ?
        `,
        [
          resumeUrl,
          user_id,
        ]
      );

      return res.json({
        success: true,

        message:
          "Resume uploaded successfully",

        resume: {
          original_name:
            req.file.originalname,

          filename:
            req.file.originalname,

          url:
            resumeUrl,

          public_id:
            publicId,
        },
      });
    } catch (error) {
      console.log(
        "Upload Resume Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to upload resume",
        error: error.message,
      });
    }
  };

// =====================================================
// GET RESUME
// =====================================================

exports.getEmployeeResume =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const [employee] =
        await db.promise().query(
          `
          SELECT
            employee_id,
            resume
          FROM employee
          WHERE user_id = ?
          `,
          [user_id]
        );

      if (employee.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      if (!employee[0].resume) {
        return res.json({
          success: true,
          resume: null,
        });
      }

      const resumeUrl =
        employee[0].resume;

      const filename =
        resumeUrl.split("/").pop() ||
        "resume.pdf";

      return res.json({
        success: true,

        resume: {
          original_name:
            filename,

          filename:
            filename,

          uploaded_at: null,

          url:
            resumeUrl,
        },
      });
    } catch (error) {
      console.log(
        "Get Resume Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get resume",
        error: error.message,
      });
    }
  };

// =====================================================
// DELETE RESUME
// =====================================================

exports.deleteEmployeeResume =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const [employee] =
        await db.promise().query(
          `
          SELECT
            employee_id,
            resume
          FROM employee
          WHERE user_id = ?
          `,
          [user_id]
        );

      if (employee.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      if (!employee[0].resume) {
        return res.json({
          success: true,
          message:
            "No resume to delete",
        });
      }

      // Delete from Cloudinary
      await deleteCloudinaryFile(
        employee[0].resume,
        "raw"
      );

      // Delete from DB
      await db.promise().query(
        `
        UPDATE employee
        SET
          resume = NULL,
          updated_at = NOW()
        WHERE user_id = ?
        `,
        [user_id]
      );

      return res.json({
        success: true,
        message:
          "Resume deleted successfully",
      });
    } catch (error) {
      console.log(
        "Delete Resume Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete resume",
        error: error.message,
      });
    }
  };

// =====================================================
// GET SOCIAL PROFILES
// =====================================================

exports.getSocialProfiles =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const [rows] =
        await db.promise().query(
          `
          SELECT
            employee_id,
            linkedin,
            github,
            portfolio
          FROM employee
          WHERE user_id = ?
          `,
          [user_id]
        );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      return res.json({
        success: true,
        social: rows[0],
      });
    } catch (error) {
      console.log(
        "Get Social Profiles Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get social profiles",
      });
    }
  };

// =====================================================
// UPDATE SOCIAL PROFILES
// =====================================================

exports.updateSocialProfiles =
  async (req, res) => {
    try {
      const { user_id } =
        req.params;

      const {
        linkedin,
        github,
        portfolio,
      } = req.body;

      const [result] =
        await db.promise().query(
          `
          UPDATE employee
          SET
            linkedin = ?,
            github = ?,
            portfolio = ?,
            updated_at = NOW()
          WHERE user_id = ?
          `,
          [
            linkedin || null,
            github || null,
            portfolio || null,
            user_id,
          ]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Social profiles updated successfully",
      });
    } catch (error) {
      console.log(
        "Update Social Profiles Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update social profiles",
      });
    }
  };

// =====================================================
// DELETE SOCIAL PROFILE
// =====================================================

exports.deleteSocialProfile =
  async (req, res) => {
    try {
      const {
        user_id,
        type,
      } = req.params;

      let column;

      if (type === "linkedin") {
        column = "linkedin";
      } else if (
        type === "github"
      ) {
        column = "github";
      } else if (
        type === "portfolio"
      ) {
        column = "portfolio";
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Invalid social profile type",
        });
      }

      const [result] =
        await db.promise().query(
          `
          UPDATE employee
          SET
            ${column} = NULL,
            updated_at = NOW()
          WHERE user_id = ?
          `,
          [user_id]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      return res.json({
        success: true,
        message:
          `${type} profile deleted successfully`,
      });
    } catch (error) {
      console.log(
        "Delete Social Profile Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete social profile",
      });
    }
  };

// =====================================================
// GET ADDRESS
// =====================================================

exports.getAddress = async (
  req,
  res
) => {
  try {
    const { user_id } =
      req.params;

    const [rows] =
      await db.promise().query(
        `
        SELECT
          employee_id,
          address,
          city,
          state,
          pincode,
          country
        FROM employee
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found",
      });
    }

    return res.json({
      success: true,
      address: rows[0],
    });
  } catch (error) {
    console.log(
      "Get Address Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get address",
    });
  }
};

// =====================================================
// UPDATE ADDRESS
// =====================================================

exports.updateAddress = async (
  req,
  res
) => {
  try {
    const { user_id } =
      req.params;

    const {
      address,
      city,
      state,
      pincode,
      country,
    } = req.body;

    const [result] =
      await db.promise().query(
        `
        UPDATE employee
        SET
          address = ?,
          city = ?,
          state = ?,
          pincode = ?,
          country = ?,
          updated_at = NOW()
        WHERE user_id = ?
        `,
        [
          address || null,
          city || null,
          state || null,
          pincode || null,
          country || null,
          user_id,
        ]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Address updated successfully",
    });
  } catch (error) {
    console.log(
      "Update Address Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update address",
    });
  }
};

// =====================================================
// DELETE ADDRESS
// =====================================================

exports.deleteAddress = async (
  req,
  res
) => {
  try {
    const { user_id } =
      req.params;

    const [result] =
      await db.promise().query(
        `
        UPDATE employee
        SET
          address = NULL,
          city = NULL,
          state = NULL,
          pincode = NULL,
          country = NULL,
          updated_at = NOW()
        WHERE user_id = ?
        `,
        [user_id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Address deleted successfully",
    });
  } catch (error) {
    console.log(
      "Delete Address Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete address",
    });
  }
};