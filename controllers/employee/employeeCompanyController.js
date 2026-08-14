const db = require("../../config/db");

// ==========================================
// GET COMPANY PROFILE FOR EMPLOYEE
// ==========================================

exports.getCompanyProfile = async (req, res) => {
  try {
    const { company_id } = req.params;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        company_id,
        user_id,
        company_name,
        email,
        phone,
        industry,
        website,
        logo,
        cover_image,
        description,
        founded_year,
        company_size,
        headquarters,
        gst_number,
        cin_number,
        pan_number,
        linkedin,
        facebook,
        instagram,
        twitter,
        address,
        city,
        state,
        country,
        pincode,
        verification_status,
        account_status,
        created_at,
        updated_at
      FROM companies
      WHERE company_id = ?
      `,
      [company_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const company = rows[0];

    return res.status(200).json({
      success: true,
      message: "Company profile fetched successfully",
      company,
    });

  } catch (error) {
    console.error("Employee Company Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};