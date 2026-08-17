const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",

    port: 587,

    secure: false,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    connectionTimeout: 15000,

    greetingTimeout: 15000,

    socketTimeout: 15000,

    requireTLS: true

});


// =====================================================
// SMTP TEST
// =====================================================

transporter.verify((error, success) => {

    if (error) {

        console.error(
            "❌ SMTP ERROR:",
            error.message
        );

    } else {

        console.log(
            "✅ SMTP SERVER READY"
        );

    }

});


module.exports = transporter;