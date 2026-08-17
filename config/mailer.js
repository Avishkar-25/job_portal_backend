
const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
    timeoutInSeconds: 15,
    maxRetries: 2
});

const sendEmail = async ({
    to,
    toName = "",
    subject,
    html,
    text = ""
}) => {

    try {

        const response =
            await brevo.transactionalEmails.sendTransacEmail({

                sender: {
                    name: process.env.BREVO_SENDER_NAME || "Job Portal",
                    email: process.env.BREVO_SENDER_EMAIL
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
                    ? { textContent: text }
                    : {})
            });


        console.log(
            "✅ Email sent successfully:",
            to
        );

        console.log(
            "📧 Brevo Message ID:",
            response.messageId
        );


        return {
            success: true,
            messageId: response.messageId
        };


    } catch (error) {

        console.error(
            "❌ Brevo Email Error:",
            error
        );

        throw error;
    }
};


module.exports = sendEmail;

