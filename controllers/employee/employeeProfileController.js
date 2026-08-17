const db = require("../../config/db");
const multer = require("multer");
const path = require("path");

const cloudinary = require("../../config/cloudinary");
const streamifier = require("streamifier");
// =======================================
// Resume Upload Configuration - Cloudinary
// =======================================

const uploadResume = multer({

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
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

  }

});

// =======================================
// Resume Upload Configuration
// =======================================

const resumeDir = path.join(
  __dirname,
  "../uploads/resumes"
);

if (!fs.existsSync(resumeDir)) {

  fs.mkdirSync(resumeDir, {
    recursive: true
  });

}


const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, resumeDir);

  },

  filename: (req, file, cb) => {

    const uniqueName =
      "resume_" +
      Date.now() +
      "_" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);

  }

});


const uploadResume = multer({

  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const ext =
      path.extname(file.originalname)
        .toLowerCase();

    if (
      ext !== ".pdf" ||
      file.mimetype !== "application/pdf"
    ) {

      return cb(
        new Error(
          "Only PDF files are allowed"
        )
      );

    }

    cb(null, true);

  }

});

// =======================================
// CHECK EMPLOYEE PROFILE COMPLETION
// =======================================

exports.checkProfileCompletion = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Get employee basic details
    const [employee] = await db.promise().query(
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
        message: "Employee profile not found",
      });
    }

    const emp = employee[0];
    const employee_id = emp.employee_id;

    // =======================================
    // Check Education
    // =======================================

    const [education] = await db.promise().query(
      `
      SELECT qualification_id
      FROM employee_qualifications
      WHERE employee_id = ?
      LIMIT 1
      `,
      [employee_id]
    );

    // =======================================
    // Check Skills
    // =======================================

    const [skills] = await db.promise().query(
      `
      SELECT skill_id
      FROM skill
      WHERE employee_id = ?
      LIMIT 1
      `,
      [employee_id]
    );

    // =======================================
    // Check Career Preference
    // =======================================

    const [career] = await db.promise().query(
      `
      SELECT career_id
      FROM employee_career_preferences
      WHERE employee_id = ?
      LIMIT 1
      `,
      [employee_id]
    );

    // =======================================
    // Required Profile Fields
    // =======================================

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
      professional_summary: emp.professional_summary,
      resume: emp.resume,
    };

    // =======================================
    // Find Missing Fields
    // =======================================

    const missingFields = [];

    Object.keys(requiredFields).forEach((field) => {
      const value = requiredFields[field];

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        missingFields.push(field);
      }
    });

    // Education
    if (education.length === 0) {
      missingFields.push("education");
    }

    // Skills
    if (skills.length === 0) {
      missingFields.push("skills");
    }

    // Career Preference
    if (career.length === 0) {
      missingFields.push("careerPreferences");
    }

    // =======================================
    // Profile Percentage
    // =======================================

    const totalFields = 18;

    const completedFields =
      totalFields - missingFields.length;

    let percentage = Math.round(
      (completedFields / totalFields) * 100
    );

    // Prevent negative
    if (percentage < 0) {
      percentage = 0;
    }

    const profileComplete =
      missingFields.length === 0;

    // =======================================
    // Response
    // =======================================

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

    res.status(500).json({
      success: false,
      profileComplete: false,
      message: "Server Error",
    });
  }
};
// ======================================
// GET EMPLOYEE PROFILE
// ======================================
exports.getEmployeeProfile = async (req, res) => {

  try {

    const { user_id } = req.params;


    // ==============================
    // Employee Data
    // ==============================

    const [employee] = await db.promise().query(

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

      WHERE user_id=?

      `,

      [user_id]

    );


    if (employee.length === 0) {

      return res.status(404).json({

        success: false,
        message: "Employee not found"

      });

    }


    const employee_id = employee[0].employee_id;


    // ==============================
    // Education Data
    // ==============================

    const [education] = await db.promise().query(

      `
      SELECT

        qualification_id,
        qualification,
        college_name,
        passing_year,
        cgpa

      FROM employee_qualifications

      WHERE employee_id=?

      ORDER BY qualification_id DESC

      `,

      [employee_id]

    );


    // ==============================
    // Career Preferences
    // ==============================

    const [careerPreferences] = await db.promise().query(

      `
      SELECT

        career_id,
        employee_id,
        job_type,
        availability,
        preferred_locations,
        updated_at

      FROM employee_career_preferences

      WHERE employee_id=?

      ORDER BY career_id DESC

      LIMIT 1

      `,

      [employee_id]

    );


    // ==============================
    // Response
    // ==============================

    res.json({

      success: true,

      profile: {

        ...employee[0],

        education,

        careerPreferences:
          careerPreferences.length > 0
            ? careerPreferences[0]
            : null

      }

    });


  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,
      message: "Server Error"

    });

  }

}; 




// ======================================
// UPDATE EMPLOYEE PROFILE
// ======================================

exports.updateEmployeeProfile = async (req, res) => {
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

    // =======================================
    // Dynamic Update
    // =======================================

    const fields = [];
    const values = [];

    if (full_name !== undefined) {
      fields.push("full_name = ?");
      values.push(full_name);
    }

    // Profession
    if (profession !== undefined) {
      fields.push("profession = ?");
      values.push(profession);
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    if (phone !== undefined) {
      fields.push("phone = ?");
      values.push(phone);
    }

    if (gender !== undefined) {
      fields.push("gender = ?");
      values.push(
        gender !== "" ? gender : null
      );
    }

    if (dob !== undefined) {
      fields.push("dob = ?");
      values.push(
        dob !== "" ? dob : null
      );
    }

    if (address !== undefined) {
      fields.push("address = ?");
      values.push(address);
    }

    if (city !== undefined) {
      fields.push("city = ?");
      values.push(city);
    }

    if (state !== undefined) {
      fields.push("state = ?");
      values.push(state);
    }

    if (country !== undefined) {
      fields.push("country = ?");
      values.push(country);
    }

    if (pincode !== undefined) {
      fields.push("pincode = ?");
      values.push(pincode);
    }

    if (experience !== undefined) {
      fields.push("experience = ?");
      values.push(experience);
    }

    if (current_company !== undefined) {
      fields.push("current_company = ?");
      values.push(current_company);
    }

    if (current_salary !== undefined) {
      fields.push("current_salary = ?");
      values.push(current_salary);
    }

    if (expected_salary !== undefined) {
      fields.push("expected_salary = ?");
      values.push(expected_salary);
    }

    if (linkedin !== undefined) {
      fields.push("linkedin = ?");
      values.push(linkedin);
    }

    if (github !== undefined) {
      fields.push("github = ?");
      values.push(github);
    }

    if (portfolio !== undefined) {
      fields.push("portfolio = ?");
      values.push(portfolio);
    }

    if (about !== undefined) {
      fields.push("about = ?");
      values.push(about);
    }

    if (professional_summary !== undefined) {
      fields.push("professional_summary = ?");
      values.push(professional_summary);
    }

    // =======================================
    // No Data
    // =======================================

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    // =======================================
    // Updated At
    // =======================================

    fields.push("updated_at = NOW()");

    // user_id last
    values.push(user_id);

    // =======================================
    // Update Query
    // =======================================

    const [result] = await db.promise().query(
      `
      UPDATE employee
      SET
        ${fields.join(", ")}
      WHERE user_id = ?
      `,
      values
    );

    // =======================================
    // Employee Not Found
    // =======================================

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // =======================================
    // Success
    // =======================================

    res.json({
      success: true,
      message: "Profile Updated Successfully",
    });

  } catch (error) {

    console.log(
      "Update Employee Profile Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};





// ======================================
// UPLOAD PROFILE PHOTO
// ======================================

// ======================================
// UPLOAD PROFILE PHOTO - CLOUDINARY
// ======================================

exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { user_id } = req.params;

    // ======================================
    // Check file
    // ======================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    // ======================================
    // Get old profile photo
    // ======================================

    const [oldData] = await db.promise().query(
      `
      SELECT profile_photo
      FROM employee
      WHERE user_id = ?
      `,
      [user_id]
    );

    // ======================================
    // Check employee
    // ======================================

    if (oldData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ======================================
    // Delete old Cloudinary image
    // ======================================

    if (oldData[0].profile_photo) {
      try {
        const cloudinary = require("../../config/cloudinary");

        const oldUrl = oldData[0].profile_photo;

        // Extract public_id from Cloudinary URL
        const uploadIndex = oldUrl.indexOf("/upload/");

        if (uploadIndex !== -1) {
          let publicId = oldUrl.substring(
            uploadIndex + 8
          );

          // Remove version e.g. v123456789/
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
            publicId
          );

          console.log(
            "Old Cloudinary image deleted:",
            publicId
          );
        }
      } catch (deleteError) {
        console.log(
          "Old Cloudinary image delete error:",
          deleteError.message
        );
      }
    }

    // ======================================
    // New Cloudinary Image
    // ======================================

    const imageUrl = req.file.path;

    // Cloudinary public ID
    const publicId = req.file.filename;

    // ======================================
    // Update Database
    // ======================================

    const [result] = await db.promise().query(
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

    // ======================================
    // Database update failed
    // ======================================

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ======================================
    // Success
    // ======================================

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


// Career Preferences
exports.getCareerPreference = async (req, res) => {

try{

const { user_id } = req.params;

const [employee] = await db.promise().query(

`SELECT employee_id
FROM employee
WHERE user_id=?`,

[user_id]

);

if(employee.length===0){

return res.json({
success:false
});

}

const employee_id = employee[0].employee_id;

const [career] = await db.promise().query(

`
SELECT
job_type,
availability,
preferred_locations

FROM employee_career_preferences

WHERE employee_id=?
`,

[employee_id]

);

res.json({

success:true,

career:

career.length>0

? career[0]

:{

job_type:"",
availability:"",
preferred_locations:""

}

});

}

catch(err){

console.log(err);

res.status(500).json({

success:false

});

}

};

// Update Career Perferences
exports.updateCareerPreference = async(req,res)=>{

try{

const {user_id}=req.params;

const{

job_type,
availability,
preferred_locations

}=req.body;


const [employee]=await db.promise().query(

`
SELECT employee_id
FROM employee
WHERE user_id=?
`,

[user_id]

);

const employee_id=employee[0].employee_id;


const [check]=await db.promise().query(

`
SELECT career_id
FROM employee_career_preferences
WHERE employee_id=?
`,

[employee_id]

);


if(check.length>0){

await db.promise().query(

`
UPDATE employee_career_preferences

SET

job_type=?,
availability=?,
preferred_locations=?

WHERE employee_id=?
`,

[
job_type,
availability,
preferred_locations,
employee_id
]

);

}
else{

await db.promise().query(

`
INSERT INTO employee_career_preferences

(

employee_id,
job_type,
availability,
preferred_locations

)

VALUES(?,?,?,?)

`,

[
employee_id,
job_type,
availability,
preferred_locations
]

);

}

res.json({

success:true,

message:"Career Updated"

});

}

catch(err){

console.log(err);

res.status(500).json({

success:false

});

}

};

// ======================================
// GET ABOUT
// ======================================
exports.getAbout = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await db.promise().query(
      `
      SELECT about
      FROM employee
      WHERE user_id=?
      `,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      about: rows[0].about,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// ======================================
// UPDATE ABOUT
// ======================================
exports.updateAbout = async (req, res) => {
  try {

    // console.log("params =", req.params);
    // console.log("body =", req.body);

    const { user_id } = req.params;
    const { about } = req.body;

    // console.log("user_id =", user_id);

    await db.promise().query(
      `
      UPDATE employee
      SET
      about=?,
      updated_at=NOW()
      WHERE user_id=?
      `,
      [about, user_id]
    );

    res.json({
      success: true,
      message: "About updated successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



// =====================================================
// GET EDUCATION BY USER ID
// =====================================================
exports.getEducation = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Find employee
    const [employee] = await db.promise().query(
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

    const employee_id = employee[0].employee_id;

    // Get education
    const [education] = await db.promise().query(
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

    res.json({
      success: true,
      education,
    });

  } catch (err) {
    console.log("Get Education Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch education",
    });
  }
};


// =====================================================
// ADD EDUCATION
// =====================================================
exports.addEducation = async (req, res) => {
  try {
    const { user_id } = req.params;

    const {
      qualification,
      college_name,
      passing_year,
      cgpa,
    } = req.body;

    // Validation
    if (
      !qualification ||
      !college_name ||
      !passing_year ||
      !cgpa
    ) {
      return res.status(400).json({
        success: false,
        message: "All education fields are required",
      });
    }

    // Find employee
    const [employee] = await db.promise().query(
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

    const employee_id = employee[0].employee_id;

    // Insert
    const [result] = await db.promise().query(
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

    res.status(201).json({
      success: true,
      message: "Education added successfully",
      qualification_id: result.insertId,
    });

  } catch (err) {
    console.log("Add Education Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to add education",
    });
  }
};


// =====================================================
// UPDATE EDUCATION
// =====================================================
exports.updateEducation = async (req, res) => {
  try {
    const { qualification_id } = req.params;

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
        message: "All education fields are required",
      });
    }

    const [result] = await db.promise().query(
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

    res.json({
      success: true,
      message: "Education updated successfully",
    });

  } catch (err) {
    console.log("Update Education Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update education",
    });
  }
};


// =====================================================
// DELETE EDUCATION
// =====================================================
exports.deleteEducation = async (req, res) => {
  try {
    const { qualification_id } = req.params;

    const [result] = await db.promise().query(
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

    res.json({
      success: true,
      message: "Education deleted successfully",
    });

  } catch (err) {
    console.log("Delete Education Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete education",
    });
  }
};

// =====================================================
// GET SKILLS
// =====================================================

exports.getSkills = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Find employee_id from user_id
    const [employee] = await db.promise().query(
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

    const employee_id = employee[0].employee_id;

    // Get skills
    const [skills] = await db.promise().query(
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

    res.json({
      success: true,
      skills,
    });

  } catch (err) {
    console.log("Get Skills Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch skills",
    });
  }
};


// =====================================================
// ADD SKILL
// =====================================================

exports.addSkill = async (req, res) => {
  try {
    const { user_id } = req.params;

    const {
      skill_name,
      skill_level,
    } = req.body;

    console.log("================================");
    console.log("ADD SKILL");
    console.log("user_id:", user_id);
    console.log("body:", req.body);
    console.log("================================");

    // Validation
    if (!skill_name || !skill_level) {
      return res.status(400).json({
        success: false,
        message: "Skill name and skill level are required",
      });
    }

    // Validate enum
    const validLevels = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
    ];

    if (!validLevels.includes(skill_level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill level",
      });
    }

    // Find employee
    const [employee] = await db.promise().query(
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

    const employee_id = employee[0].employee_id;

    console.log("employee_id:", employee_id);

    // Insert
    const [result] = await db.promise().query(
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

    res.status(201).json({
      success: true,
      message: "Skill added successfully",
      skill_id: result.insertId,
    });

  } catch (err) {
    console.log("Add Skill Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to add skill",
      error: err.message,
    });
  }
};


// =====================================================
// UPDATE SKILL
// =====================================================

exports.updateSkill = async (req, res) => {
  try {
    const { skill_id } = req.params;

    const {
      skill_name,
      skill_level,
    } = req.body;

    if (!skill_name || !skill_level) {
      return res.status(400).json({
        success: false,
        message: "Skill name and skill level are required",
      });
    }

    const validLevels = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
    ];

    if (!validLevels.includes(skill_level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill level",
      });
    }

    const [result] = await db.promise().query(
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

    res.json({
      success: true,
      message: "Skill updated successfully",
    });

  } catch (err) {
    console.log("Update Skill Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update skill",
      error: err.message,
    });
  }
};


// =====================================================
// DELETE SKILL
// =====================================================

exports.deleteSkill = async (req, res) => {
  try {
    const { skill_id } = req.params;

    const [result] = await db.promise().query(
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

    res.json({
      success: true,
      message: "Skill deleted successfully",
    });

  } catch (err) {
    console.log("Delete Skill Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete skill",
      error: err.message,
    });
  }
};

// =======================================
// Get Professional Details
// =======================================
exports.getProfessionalDetails = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await db.promise().query(
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
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      professional: rows[0],
    });

  } catch (err) {
    console.log("Get Professional Details Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to get professional details",
    });
  }
};


// =======================================
// Update Professional Details
// =======================================
exports.updateProfessionalDetails = async (req, res) => {
  try {
    const { user_id } = req.params;

    const {
      experience,
      current_company,
      current_salary,
      expected_salary,
    } = req.body;

    const [result] = await db.promise().query(
      `
      UPDATE employee
      SET
        experience = ?,
        current_company = ?,
        current_salary = ?,
        expected_salary = ?
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
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Professional details updated successfully",
    });

  } catch (err) {
    console.log("Update Professional Details Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update professional details",
    });
  }
};
// =======================================
// Get Professional Summary
// =======================================
exports.getProfessionalSummary = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await db.promise().query(
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
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      summary: rows[0].professional_summary || "",
    });

  } catch (err) {
    console.log("Get Professional Summary Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to get professional summary",
    });
  }
};


// =======================================
// Add / Update Professional Summary
// =======================================
exports.updateProfessionalSummary = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { professional_summary } = req.body;

    const [result] = await db.promise().query(
      `
      UPDATE employee
      SET professional_summary = ?
      WHERE user_id = ?
      `,
      [
        professional_summary || null,
        user_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Professional Summary updated successfully",
    });

  } catch (err) {
    console.log(
      "Update Professional Summary Error:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Failed to update professional summary",
    });
  }
};
// =======================================
// Upload / Update Resume
// =======================================

// =======================================
// Upload / Update Resume - Cloudinary
// =======================================

exports.uploadEmployeeResume = async (req, res) => {
  try {
    const { user_id } = req.params;

    // =======================================
    // Check User ID
    // =======================================

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // =======================================
    // Check File
    // =======================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF resume",
      });
    }

    // =======================================
    // Find Employee
    // =======================================

    const [employee] = await db.promise().query(
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
        message: "Employee not found",
      });
    }

    // =======================================
    // Delete Old Resume From Cloudinary
    // =======================================

    if (employee[0].resume) {
      try {
        const cloudinary = require("../../config/cloudinary");

        const oldUrl = employee[0].resume;

        // Find /upload/ in URL
        const uploadIndex = oldUrl.indexOf("/upload/");

        if (uploadIndex !== -1) {
          let publicId = oldUrl.substring(
            uploadIndex + 8
          );

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
              resource_type: "raw",
            }
          );

          console.log(
            "Old resume deleted from Cloudinary:",
            publicId
          );
        }
      } catch (deleteError) {
        console.log(
          "Old resume delete error:",
          deleteError.message
        );
      }
    }

    // =======================================
    // New Cloudinary Resume
    // =======================================

    const resumeUrl = req.file.path;

    const publicId = req.file.filename;

    // =======================================
    // Update Database
    // =======================================

    const [result] = await db.promise().query(
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

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // =======================================
    // Success
    // =======================================

    return res.json({
      success: true,

      message:
        "Resume uploaded successfully",

      resume: {
        original_name:
          req.file.originalname,

        filename:
          req.file.filename,

        url:
          resumeUrl,

        public_id:
          publicId,
      },
    });

  } catch (err) {
    console.log(
      "Upload Resume Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to upload resume",
      error: err.message,
    });
  }
};
// =======================================
// Get Resume
// =======================================

// =======================================
// Get Resume
// =======================================

exports.getEmployeeResume = async (req, res) => {
  try {
    const { user_id } = req.params;

    // =======================================
    // Find Employee
    // =======================================

    const [employee] = await db.promise().query(
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
        message: "Employee not found",
      });
    }

    // =======================================
    // Resume Not Found
    // =======================================

    if (!employee[0].resume) {
      return res.json({
        success: true,
        resume: null,
      });
    }

    // =======================================
    // Cloudinary Resume URL
    // =======================================

    const resumeUrl = employee[0].resume;

    const filename =
      resumeUrl.split("/").pop() || "resume.pdf";

    // =======================================
    // Response
    // =======================================

    return res.json({
      success: true,

      resume: {
        original_name: filename,

        filename: filename,

        uploaded_at: null,

        url: resumeUrl,
      },
    });

  } catch (err) {
    console.log(
      "Get Resume Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get resume",
      error: err.message,
    });
  }
};
// =======================================
// Delete Resume
// =======================================

// =======================================
// Delete Resume - Cloudinary
// =======================================

exports.deleteEmployeeResume = async (req, res) => {
  try {
    const { user_id } = req.params;

    // =======================================
    // Find Employee
    // =======================================

    const [employee] = await db.promise().query(
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
        message: "Employee not found",
      });
    }

    // =======================================
    // No Resume
    // =======================================

    if (!employee[0].resume) {
      return res.json({
        success: true,
        message: "No resume to delete",
      });
    }

    // =======================================
    // Delete From Cloudinary
    // =======================================

    try {
      const cloudinary =
        require("../../config/cloudinary");

      const resumeUrl =
        employee[0].resume;

      const uploadIndex =
        resumeUrl.indexOf("/upload/");

      if (uploadIndex !== -1) {
        let publicId =
          resumeUrl.substring(
            uploadIndex + 8
          );

        // Remove version
        publicId =
          publicId.replace(
            /^v\d+\//,
            ""
          );

        // Remove extension
        publicId =
          publicId.replace(
            /\.[^/.]+$/,
            ""
          );

        await cloudinary.uploader.destroy(
          publicId,
          {
            resource_type: "raw",
          }
        );

        console.log(
          "Resume deleted from Cloudinary:",
          publicId
        );
      }

    } catch (cloudinaryError) {
      console.log(
        "Cloudinary Delete Error:",
        cloudinaryError.message
      );
    }

    // =======================================
    // Remove Resume From Database
    // =======================================

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

    // =======================================
    // Success
    // =======================================

    return res.json({
      success: true,
      message:
        "Resume deleted successfully",
    });

  } catch (err) {
    console.log(
      "Delete Resume Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete resume",
      error: err.message,
    });
  }
};
// =======================================
// Get Social Profiles
// =======================================
exports.getSocialProfiles = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await db.promise().query(
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
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      social: rows[0],
    });

  } catch (err) {
    console.log("Get Social Profiles Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to get social profiles",
    });
  }
};


// =======================================
// Update Social Profiles
// =======================================
exports.updateSocialProfiles = async (req, res) => {
  try {
    const { user_id } = req.params;

    const {
      linkedin,
      github,
      portfolio
    } = req.body;

    const [result] = await db.promise().query(
      `
      UPDATE employee
      SET
        linkedin = ?,
        github = ?,
        portfolio = ?
      WHERE user_id = ?
      `,
      [
        linkedin || null,
        github || null,
        portfolio || null,
        user_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Social profiles updated successfully",
    });

  } catch (err) {
    console.log("Update Social Profiles Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update social profiles",
    });
  }
};


// =======================================
// Delete Social Profile
// =======================================
exports.deleteSocialProfile = async (req, res) => {
  try {
    const { user_id, type } = req.params;

    let column;

    if (type === "linkedin") {
      column = "linkedin";
    } else if (type === "github") {
      column = "github";
    } else if (type === "portfolio") {
      column = "portfolio";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid social profile type",
      });
    }

    const [result] = await db.promise().query(
      `
      UPDATE employee
      SET ${column} = NULL
      WHERE user_id = ?
      `,
      [user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: `${type} profile deleted successfully`,
    });

  } catch (err) {
    console.log("Delete Social Profile Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete social profile",
    });
  }
};

// =======================================
// Get Address
// =======================================
exports.getAddress = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await db.promise().query(
      `
      SELECT
        employee_id,
        address,
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
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      address: rows[0],
    });

  } catch (err) {

    console.log("Get Address Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to get address",
    });

  }
};


// =======================================
// Update Address
// =======================================
exports.updateAddress = async (req, res) => {
  try {

    const { user_id } = req.params;

    const {
      address,
      state,
      pincode,
      country
    } = req.body;


    const [result] = await db.promise().query(
      `
      UPDATE employee
      SET
        address = ?,
        state = ?,
        pincode = ?,
        country = ?
      WHERE user_id = ?
      `,
      [
        address || null,
        state || null,
        pincode || null,
        country || null,
        user_id
      ]
    );


    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });

    }


    res.json({
      success: true,
      message: "Address updated successfully",
    });


  } catch (err) {

    console.log("Update Address Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to update address",
    });

  }
};


// =======================================
// Delete Address
// =======================================
exports.deleteAddress = async (req, res) => {
  try {

    const { user_id } = req.params;


    const [result] = await db.promise().query(
      `
      UPDATE employee
      SET
        address = NULL,
        state = NULL,
        pincode = NULL,
        country = NULL
      WHERE user_id = ?
      `,
      [user_id]
    );


    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });

    }


    res.json({
      success: true,
      message: "Address deleted successfully",
    });


  } catch (err) {

    console.log("Delete Address Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });

  }
};