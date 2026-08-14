exports.statusMail = (
    employeeName,
    companyName,
    jobTitle,
    status
) => {

    let message = "";

    switch (status) {

        case "Pending":
            message =
                "Your application is currently under review.";
            break;

        case "Shortlisted":
            message =
                "Congratulations! You have been shortlisted.";
            break;

        case "Interview":
            message =
                "Congratulations! You have been selected for the interview round.";
            break;

        case "Selected":
            message =
                "Congratulations! You have been selected.";
            break;

        case "Rejected":
            message =
                "Unfortunately, your application was not selected.";
            break;

        default:
            message =
                "Your application status has been updated.";
    }

    return `
    <div style="font-family:Arial;padding:25px">

        <h2>Hello ${employeeName},</h2>

        <p>${message}</p>

        <table cellpadding="8">

            <tr>
                <td><b>Company</b></td>
                <td>${companyName}</td>
            </tr>

            <tr>
                <td><b>Job</b></td>
                <td>${jobTitle}</td>
            </tr>

            <tr>
                <td><b>Status</b></td>
                <td>${status}</td>
            </tr>

        </table>

        <br>

        <p>
        Please login to Job Portal for more details.
        </p>

        <br>

        <h3>Best Wishes</h3>

        <h4>${companyName} HR Team</h4>

    </div>
    `;
};