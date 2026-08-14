const jwt=require("jsonwebtoken");


const verifyToken=(req,res,next)=>{
try{
const authHeader=req.headers.authorization;
if(!authHeader)
{
return res.status(401).json({
message:"Token Required"
});
}
const token=authHeader.split(" ")[1];
const decoded=jwt.verify(
token,
process.env.JWT_SECRET
);

req.user=decoded;
next();
}
catch(error)
{
return res.status(401).json({
message:"Invalid Token"
});
}
};

// ===============================
// Company Login
// ===============================
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

    // Check User
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
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password.",
      });
    }

    // Company Details
    const [companies] = await db.promise().query(
      `
      SELECT *
      FROM companies
      WHERE user_id = ?
      `,
      [user.user_id]
    );

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
      company: companies[0],
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports=verifyToken;
