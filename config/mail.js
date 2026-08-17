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
    socketTimeout: 20000
});

transporter.verify((error, success) => {

    if (error) {

        console.error("SMTP ERROR:", error);

    } else {

        console.log("SMTP SERVER READY");

    }

});

module.exports = transporter;