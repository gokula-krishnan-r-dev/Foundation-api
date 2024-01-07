const express = require("express"); //Import the express dependency
const bodyParser = require("body-parser");
const cors = require("cors");
const json2csv = require("json2csv").parse;
const fs = require("fs");
const ExcelJS = require("exceljs");
const path = require("path");
const submissionRouter = require("./Router/submissionRouter");
const { default: mongoose } = require("mongoose");
require("./service/db");
const app = express(); //Instantiate an express app, the main work horse of this server
const port = 3000; //Save the port number where your server will be listening
// Call the function to connect
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const secureKey = "f70c7525463c";
const authenticate = (req, res, next) => {
  const providedKey = req.query.key; // Assuming the key is provided in the query parameters

  if (providedKey !== secureKey) {
    return res.status(401).send("Unauthorized");
  }

  next(); // Proceed to the next middleware/route handler if the key is correct
};

app.use(cors());
//Idiomatic expression in express to route and respond to a client request

app.use("/submit-form", submissionRouter); // Use the submission routes at the '/submit-form' path
const expectedSecretCode = "demo";
// Admin schema
const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["edit", "view"],
  },
});
app.get("/excal", async (req, res) => {
  try {
    const submissions = await Submission.find({}).sort({ createdDate: -1 });

    if (submissions.length === 0) {
      return res.status(404).send("No submissions found.");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Submissions");

    // Define the columns/headers
    worksheet.columns = [
      { header: "_id", key: "_id", width: 20 },
      { header: "applicationId", key: "applicationId", width: 20 },
      { header: "createdDate", key: "createdDate", width: 30 },
    ];

    // Add data rows
    submissions.forEach((submission) => {
      worksheet.addRow(submission);
    });

    // Define the file path
    const filePath = path.join(__dirname, "submissions.xlsx");

    // Save the workbook to a file
    await workbook.xlsx.writeFile(filePath);

    console.log("Excel file exported successfully.");
    res.download(filePath); // Download the file
  } catch (error) {
    console.error("Error exporting Excel file:", error);
    res.status(500).send("An error occurred while exporting Excel file.");
  }
});

app.get("/exportData", authenticate, async (req, res) => {
  try {
    const submissions = await Submission.find({}).sort({ createdDate: -1 });

    if (submissions.length === 0) {
      return res.status(404).send("No submissions found.");
    }

    const excelFilePath = path.join(__dirname, "submissions.xlsx");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Submissions");

    // Get keys from the first submission to create columns
    const keys = Object.keys(submissions[0]);

    // Set columns dynamically based on keys
    worksheet.columns = keys.map((key) => ({
      header: key,
      key: key,
      width: 20,
    }));

    // Add data rows
    submissions.forEach((submission) => {
      worksheet.addRow(submission);
    });

    // Save Excel file
    await workbook.xlsx.writeFile(excelFilePath);
    console.log("Excel file exported successfully.");

    res.download(excelFilePath, "submissions.xlsx");
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).send("An error occurred while exporting data.");
  }
});
app.get("/csv", async (req, res) => {
  try {
    const submissions = await Submission.find({}).sort({ createdDate: -1 });

    if (submissions.length === 0) {
      return res.status(404).send("No submissions found.");
    }

    const fields = [
      "_id",
      "applicationId",
      "firstname",
      "lastname",
      "title",
      "email",
      "address",
      "mission",
      "projectTitle",
      "projectDescription",
      "targetPopulation",
      "projectLocation",
      "totalProjectBudget",
      "amountRequested",
      "otherFundingSources",
      "references",
      "consentFunds",
      "verification",
      "contactPerson",
      "status",
      "createdDate",
    ];

    const opts = { fields, header: false }; // Setting header to false will not include header row

    // Convert submissions to CSV format
    const csv = json2csv(submissions, opts);

    // Define the file path
    const filePath = path.join(__dirname, "submissions.csv");

    // Write the CSV data to a file
    fs.writeFile(filePath, csv, (err) => {
      if (err) {
        console.error("Error writing CSV file:", err);
        return res.status(500).send("Error exporting CSV.");
      }
      console.log("CSV file exported successfully.");
      res.download(filePath); // Download the file
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).send("An error occurred while fetching submissions.");
  }
});

const Admin = mongoose.model("Admin", adminSchema);

app.post("/admin", async (req, res) => {
  try {
    const { email, password, role, secretCode } = req.body;

    // Check if the email already exists in the database
    let existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      // If account exists, send the account details in the response
      return res.status(200).json({
        message: "Account found!",
        code: 200,

        admin: {
          _id: existingAdmin._id,
          email: existingAdmin.email,
          role: existingAdmin.role,
          // Add any other properties you want to include in the response
        },
      });
    }

    // Check if the secretCode matches the expected value
    // Replace with your actual secret code
    if (secretCode !== expectedSecretCode) {
      return res.status(200).json({ error: "Invalid secret code" });
    }

    const newAdmin = new Admin({ email, password, role });
    await newAdmin.save();

    // Respond with the created admin details including the _id
    res.status(201).json({
      message: "Admin account created successfully!",
      code: 201,
      admin: {
        _id: newAdmin._id, // Assuming _id is generated upon saving
        email: newAdmin.email,
        role: newAdmin.role,
        // Add any other properties you want to include in the response
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const nodemailer = require("nodemailer");
const Submission = require("./model/submissionModel");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.forwardemail.net",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: "gokulakrishnanr812@gmail.com",
    pass: "aecm enny mitt ebgy",
  },
});
const htmlTemplate = (clientName) => `
  <html>
  <head>
    <style>
      /* Add your CSS styles here */
      /* Example styles */
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        background-color: #f4f4f4;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #888;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://fmlsaputo.org/wp-content/uploads/2022/10/FML_Saputo_logo.png" alt="Your Company" style="max-width: 200px;">
        <h2>Funding Application Approved</h2>
      </div>
      <p>
        Dear ${clientName},
      </p>
      <p>
        This is an automated message to confirm that your funding application has been manually approved. Congratulations on this important milestone! Our team is now in the process of assigning a dedicated Program Coordinator to assist you further.
      </p>
      <p>
        Your Program Coordinator will be in touch shortly to provide personalized guidance and support for your project. We appreciate your patience during this period.
      </p>
      <p>
        Thank you for choosing our services. We look forward to supporting your success.
      </p>
      <div class="footer">
        <p><em>This is an automated message. Please do not reply.</em></p>
      </div>
    </div>
  </body>
  </html>
`;

app.post("/admin/status/email", async (req, res) => {
  try {
    const { email, status } = req.body;

    let statusMessage = "";
    let subject = "pending";

    if (status === "approved") {
      statusMessage = "Congratulations! Your application has been approved.";
      subject = "Automatic Response: Funding Application Approved";
    } else if (status === "rejected") {
      statusMessage =
        "We regret to inform you that your application has been rejected.";
      subject = "Application Rejected";
    } else if (status === "pending") {
      statusMessage =
        "We regret to inform you that your application has been rejected.";
      subject = "Application Rejected";
    } else {
      return res.status(200).json({ error: "Invalid status provided" });
    }
    const client = await Submission.findOne({ email }); // Assuming you have a Client model

    const clientName = client
      ? `${client.firstname} ${client.lastname}`
      : "Applicant"; // Use "Applicant" if client name not found

    const mailOptions = {
      from: "info@gmail.com", // Replace with your email
      to: email,
      subject: subject,
      html: htmlTemplate(clientName),
    };

    // Send email
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to send email" });
      } else {
        console.log("Email sent: " + info.response);

        if (status === "approved") {
          // Update status in the database
          const existingSubmission = await Submission.findOne({ email });
          if (existingSubmission) {
            existingSubmission.status = "approved"; // Update status here
            await existingSubmission.save();
          }
        } else if (status === "rejected") {
          const existingSubmission = await Submission.findOne({ email });
          if (existingSubmission) {
            existingSubmission.status = "rejected"; // Update status here
            await existingSubmission.save();
          }
        } else if (status === "pending") {
          const existingSubmission = await Submission.findOne({ email });
          if (existingSubmission) {
            existingSubmission.status = "In Pending"; // Update status here
            await existingSubmission.save();
          }
        }

        res.status(200).json({
          message: `Email sent for ${status} status`,
          code: 200,
          status: statusMessage,
          email: email,
          subject: subject,
          error: error,
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin", async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.findByIdAndDelete(id);
    res.status(200).json({ message: "Admin account deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const formDataSchema = new mongoose.Schema({
  contactPerson: String,
  organizationName: String,
  email: String,
  message: String,
});

const FormDataModel = mongoose.model("FormData", formDataSchema);

app.post("/submitFormData", async (req, res) => {
  try {
    const formData = req.body;
    const savedFormData = await FormDataModel.create(formData);
    const mailOptions = {
      from: "info@gmail.com",
      to: formData.email,
      subject: "Thank you for submitting the form",
      html: `
        <html>
          <head>
            <style>
              /* Add your CSS styles for the email here */
              /* Example styles: */
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .message {
                margin-bottom: 20px;
              }
              /* Add more styles as needed */
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Thank you for submitting the form</h2>
              </div>
              <div class="message">
                <p>Dear ${formData.organizationName},</p>
                <p>Thank you for submitting the form. We will get back to you shortly.</p>
                <p>Regards,</p>
                <p>Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({
      savedFormData,
      message: "Form data saved successfully!",
      code: 201,
      error: null,
      status: "success",
      email: formData.email,
      subject: "Thank you for submitting the form",
    });
  } catch (error) {
    res.status(500).json({ error: "Could not save form data" });
  }
});

app.get("/", (req, res) => {
  res.send("This is Website API");
});
app.listen(port, () => {
  //server starts listening for any attempts from a client to connect at port: {port}
  console.log(`Now listening on port ${port}`);
});
