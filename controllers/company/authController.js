const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ===============================
// Company Register
// ===============================
exports.registerCompany = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      company_name,
      phone,
      industry,
      address,
    } = req.body;

    // Validation
    if (
      !name ||
      !email ||
      !password ||
      !company_name ||
      !phone ||
      !industry ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check Email
    const [existingUser] = await db.promise().query(
      "SELECT * FROM users WHERE email=?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert User
    const [userResult] = await db.promise().query(
      `
      INSERT INTO users
      (
        name,
        email,
        password,
        user_type
      )
      VALUES
      (?,?,?,'company')
      `,
      [name, email, hashedPassword]
    );

    const user_id = userResult.insertId;

    // Insert Company
    await db.promise().query(
      `
      INSERT INTO companies
      (
        user_id,
        company_name,
        email,
        phone,
        industry,
        address
      )
      VALUES
      (?,?,?,?,?,?)
      `,
      [
        user_id,
        company_name,
        email,
        phone,
        industry,
        address,
      ]
    );

    // JWT
    const token = jwt.sign(
      {
        user_id,
        user_type: "company",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Company Registered Successfully",
      token,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================================
// Company Login
// =======================================
exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required.",
      });
    }

    // Check Company User
    const [users] = await db.promise().query(
      `
      SELECT *
      FROM users
      WHERE email = ?
      AND user_type = 'company'
      `,
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company account not found.",
      });
    }

    const user = users[0];

    // Verify Password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password.",
      });
    }

    // Get Company Details
    const [companies] = await db.promise().query(
      `
      SELECT *
      FROM companies
      WHERE user_id = ?
      `,
      [user.user_id]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: companies[0],
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};