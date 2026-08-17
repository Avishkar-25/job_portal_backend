const { BrevoClient } = require("@getbrevo/brevo");

console.log("📧 Loading Brevo mailer...");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

console.log("✅ Brevo client initialized");

const sendEmail = async ({
    to,
    toName = "",
    subject,
    html,
    text = ""
}) => {

    try {

        console.log("📨 Sending email to:", to);

        console.log(
            "Brevo sender:",
            process.env.BREVO_SENDER_EMAIL
        );

        const response =
            await brevo.transactionalEmails.sendTransacEmail({

                sender: {
                    name:
                        process.env.BREVO_SENDER_NAME ||
                        "Job Portal",

                    email:
                        process.env.BREVO_SENDER_EMAIL
                },

                to: [
                    {
                        email: to,
                        name: toName
                    }
                ],

                subject,

                htmlContent: html,

                ...(text
                    ? {
                        textContent: text
                    }
                    : {})
            });

        console.log("✅ EMAIL SENT SUCCESSFULLY");

        console.log(
            "📧 Message ID:",
            response.messageId
        );

        return {
            success: true,
            messageId: response.messageId
        };

    } catch (error) {

        console.error(
            "❌ BREVO ERROR:"
        );

        console.error(
            error?.response?.body ||
            error?.body ||
            error?.message ||
            error
        );

        throw error;
    }
};

module.exports = sendEmail;