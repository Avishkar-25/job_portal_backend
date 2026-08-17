const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {

    if (error) {
        console.error("❌ SMTP ERROR:", error.message);
    } else {
        console.log("✅ SMTP SERVER READY");
    }

});

module.exports = transporter;