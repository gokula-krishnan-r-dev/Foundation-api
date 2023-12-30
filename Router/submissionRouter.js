const express = require("express");
const json2csv = require("json2csv").parse;
const fs = require("fs");
const path = require("path");
const Submission = require("../model/submissionModel");
const secureKey = "f70c7525463c";
const nodemailer = require("nodemailer");
const Counter = require("../model/Counter");

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
const authenticate = (req, res, next) => {
  const providedKey = req.query.key; // Assuming the key is provided in the query parameters

  if (providedKey !== secureKey) {
    return res.status(401).send("Unauthorized");
  }

  next(); // Proceed to the next middleware/route handler if the key is correct
};

const submissionRouter = express.Router();

submissionRouter.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params; // Get the ID from the request parameters

  try {
    const submission = await Submission.findById(id); // Find a document by ID

    if (!submission) {
      return res.status(404).send("Submission not found");
    }

    res.json(submission); // Send the retrieved document as JSON
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).send("An error occurred while fetching submission.");
  }
});
submissionRouter.get("", authenticate, async (req, res) => {
  try {
    const submissions = await Submission.find({}).sort({ createdDate: -1 }); // Sort by createdDate in descending order

    res.json(submissions); // Send the retrieved documents as JSON
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).send("An error occurred while fetching submissions.");
  }
});
submissionRouter.post("", authenticate, async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const requiredVerificationCode = req.body.refCode; // Replace this with your actual verification code

    // Check if the provided verification code matches the required code
    if (!requiredVerificationCode) {
      return res.status(200).json({
        message: "Invalid verification code. Submission aborted.",
        status: "error",
        code: 400,
        errorMessage:
          "Please provide a valid verification code to submit the form.",
      });
    }
    const counter = await Counter.findOneAndUpdate(
      { _id: "applicationId" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    const applicationId = `APP-${counter.sequence_value
      .toString()
      .padStart(4, "0")}`;

    // Check if the email already exists in the database
    const existingSubmission = await Submission.findOne({ email });

    if (existingSubmission) {
      return res.status(200).json({
        message: "Email already exists. Submission aborted.",
        status: "error",
        code: 400,
        errorMessage:
          "The provided email already exists in our records. Please use a different email address.",
      });
    }

    // Create a new Submission document using the Mongoose model
    const newSubmission = new Submission({
      ...req.body,
      applicationId, // Add the generated application ID to the submission
    });
    // Save the submitted data to MongoDB
    const saved = await newSubmission.save();
    const mailOptions = {
      from: "info@gmail.com", // Replace with your email
      to: email,
      subject: "Thank you for submitting the form",
      text: "Thank you for submitting your details. Upon review, our team will contact you shortly for further professional engagement",
    };
    const mailOptions1 = {
      from: "info@gmail.com", // Replace with your email
      to: "gokulakrishnanr812@gmail.com",
      subject: "Thank you for submitting the form",
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333;">New Submission Details</h2>
      <p><strong>Submission ID:</strong> ${saved._id}</p>
      <p><strong>Email:</strong> ${email}</p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px;">Field</th>
          <th style="padding: 10px;">Value</th>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>First Name</strong></td>
          <td style="padding: 10px;">${saved.firstname}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Last Name</strong></td>
          <td style="padding: 10px;">${saved.lastname}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Title</strong></td>
          <td style="padding: 10px;">${saved.title}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Address</strong></td>
          <td style="padding: 10px;">${saved.address}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>mission</strong></td>
          <td style="padding: 10px;">${saved.mission}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>projectTitle</strong></td>
          <td style="padding: 10px;">${saved.projectTitle}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>projectDescription</strong></td>
          <td style="padding: 10px;">${saved.projectDescription}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>targetPopulation</strong></td>
          <td style="padding: 10px;">${saved.targetPopulation}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>projectLocation</strong></td>
          <td style="padding: 10px;">${saved.projectLocation}</td>
        </tr>
        <!-- Add more fields as needed -->
      </table>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);

    res.status(201).json({
      id: saved._id,
      message: "Successfully submitted form",
      status: "success",
      data: saved,
      code: 201,
      applicationId,
    });
  } catch (error) {
    console.error("Error handling form submission:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});
submissionRouter.put("/:id", authenticate, async (req, res) => {
  const { id } = req.params; // Get the ID from the request parameters
  const updatedData = req.body; // Updated data from the request body

  try {
    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedSubmission) {
      return res.status(404).send("Submission not found");
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).send("An error occurred while updating the submission.");
  }
});
submissionRouter.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params; // Get the ID from the request parameters

  try {
    const deletedSubmission = await Submission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return res.status(200).send("Submission not found");
    }

    res.json(deletedSubmission);
  } catch (error) {
    console.error("Error deleting submission:", error);
    res.status(500).send("An error occurred while deleting the submission.");
  }
});

submissionRouter.get("/csv", authenticate, async (req, res) => {
  try {
    const submissions = await Submission.find({}).sort({ createdDate: -1 }); // Sort by createdDate in descending order

    console.log(submissions);
    if (submissions.length === 0) {
      return res.status(404).send("No submissions found.");
    }

    // Convert submissions to CSV format
    const csv = json2csv(submissions, {
      fields: ["field1", "field2", "field3"],
    }); // Replace 'field1', 'field2', 'field3' with your actual fields

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

module.exports = submissionRouter;
