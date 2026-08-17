exports.statusMail = (
    employeeName,
    companyName,
    jobTitle,
    status
) => {

    let message = "";
    let title = "Application Status Updated";

    switch (status) {

        case "Pending":
            title = "Application Under Review";
            message =
                "Your application is currently under review by the company.";
            break;

        case "Shortlisted":
            title = "Congratulations! You Are Shortlisted";
            message =
                "Congratulations! Your application has been shortlisted for the next stage.";
            break;

        case "Interview":
            title = "Interview Round";
            message =
                "Congratulations! You have been selected for the interview round.";
            break;

        case "Selected":
            title = "Congratulations! You Are Selected";
            message =
                "Congratulations! You have been selected for this position.";
            break;

        case "Rejected":
            title = "Application Status";
            message =
                "Unfortunately, your application was not selected for this position. We appreciate your interest.";
            break;

        default:
            title = "Application Status Updated";
            message =
                "Your application status has been updated.";
    }

    return `

    <div style="
        margin:0;
        padding:30px 15px;
        background:#f4f7fb;
        font-family:Arial,Helvetica,sans-serif;
    ">

        <div style="
            max-width:600px;
            margin:0 auto;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 4px 15px rgba(0,0,0,0.08);
        ">

            <!-- HEADER -->

            <div style="
                background:#2563eb;
                padding:25px;
                text-align:center;
            ">

                <h1 style="
                    margin:0;
                    color:#ffffff;
                    font-size:24px;
                ">
                    Job Portal
                </h1>

                <p style="
                    margin:8px 0 0;
                    color:#dbeafe;
                    font-size:14px;
                ">
                    Application Status Notification
                </p>

            </div>


            <!-- BODY -->

            <div style="padding:30px;">

                <h2 style="
                    margin-top:0;
                    color:#1f2937;
                    font-size:22px;
                ">
                    Hello ${employeeName},
                </h2>


                <h3 style="
                    color:#2563eb;
                    margin-bottom:10px;
                ">
                    ${title}
                </h3>


                <p style="
                    color:#4b5563;
                    line-height:1.7;
                    font-size:15px;
                ">
                    ${message}
                </p>


                <!-- APPLICATION DETAILS -->

                <div style="
                    margin-top:25px;
                    padding:20px;
                    background:#f8fafc;
                    border:1px solid #e5e7eb;
                    border-radius:10px;
                ">

                    <h3 style="
                        margin-top:0;
                        color:#111827;
                        font-size:17px;
                    ">
                        Application Details
                    </h3>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        font-size:14px;
                    ">

                        <tr>

                            <td style="
                                padding:10px 0;
                                color:#6b7280;
                                width:35%;
                            ">
                                <strong>Company</strong>
                            </td>

                            <td style="
                                padding:10px 0;
                                color:#111827;
                            ">
                                ${companyName}
                            </td>

                        </tr>


                        <tr>

                            <td style="
                                padding:10px 0;
                                color:#6b7280;
                            ">
                                <strong>Job</strong>
                            </td>

                            <td style="
                                padding:10px 0;
                                color:#111827;
                            ">
                                ${jobTitle}
                            </td>

                        </tr>


                        <tr>

                            <td style="
                                padding:10px 0;
                                color:#6b7280;
                            ">
                                <strong>Status</strong>
                            </td>

                            <td style="
                                padding:10px 0;
                                font-weight:bold;
                                color:#2563eb;
                            ">
                                ${status}
                            </td>

                        </tr>

                    </table>

                </div>


                <!-- LOGIN MESSAGE -->

                <p style="
                    margin-top:25px;
                    color:#4b5563;
                    line-height:1.6;
                    font-size:14px;
                ">
                    Please login to your Job Portal account to view
                    more details about your application.
                </p>


                <p style="
                    margin-top:25px;
                    color:#374151;
                    line-height:1.6;
                ">
                    Best Wishes,<br>

                    <strong>
                        ${companyName} HR Team
                    </strong>
                </p>

            </div>


            <!-- FOOTER -->

            <div style="
                padding:18px;
                text-align:center;
                background:#f8fafc;
                border-top:1px solid #e5e7eb;
            ">

                <p style="
                    margin:0;
                    color:#9ca3af;
                    font-size:12px;
                ">
                    This is an automated email from Job Portal.
                </p>

            </div>

        </div>

    </div>

    `;
};