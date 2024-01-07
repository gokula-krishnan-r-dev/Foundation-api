const express = require("express");
const json2csv = require("json2csv").parse;
const fs = require("fs");
const path = require("path");
const Submission = require("../model/submissionModel");
const secureKey = "f70c7525463c";
const nodemailer = require("nodemailer");
const Counter = require("../model/Counter");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongoose = require("mongoose");
const multer = require("multer");
const submissionRouter = express.Router();
require("../model/pdfDetails");
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
let bucket;
mongoose.connection.on("connected", () => {
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket",
  });
  console.log(bucket);
});
const MONGODB_URI =
  "mongodb+srv://gokula:vtEmjsXnqZrqf2rv@cluster0.klfb9oe.mongodb.net/?retryWrites=true&w=majority";

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const PdfSchema = mongoose.model("PdfDetails");
const upload = multer({ storage: storage });

submissionRouter.post("/upload", upload.array("files", 3), async (req, res) => {
  console.log(req.files);
  const title = req.body.title;
  try {
    const pdfFiles = req.files.map((file) => ({
      title: title,
      pdf: file.filename,
    }));
    await PdfSchema.create(pdfFiles);
    res.send({ status: "ok" });
  } catch (error) {
    res.json({ status: error });
  }
});

submissionRouter.get("/file", async (req, res) => {
  try {
    PdfSchema.find({}).then((data) => {
      res.send({ status: "ok", data: data });
    });
  } catch (error) {}
});

const authenticate = (req, res, next) => {
  const providedKey = req.query.key; // Assuming the key is provided in the query parameters

  if (providedKey !== secureKey) {
    return res.status(401).send("Unauthorized");
  }

  next(); // Proceed to the next middleware/route handler if the key is correct
};

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
submissionRouter.post(
  "",
  upload.array("files", 3),
  authenticate,
  async (req, res) => {
    try {
      const { email, verificationCode } = req.body;
      const requiredVerificationCode = req.body.refCode; // Replace this with your actual verification code
      console.log(requiredVerificationCode, "requiredVerificationCode");
      // Check if the provided verification code matches the required code
      if (requiredVerificationCode !== "demo") {
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
      const pdfFiles = req.files?.map((file) => ({
        title: file.originalname,
        pdf: file?.filename,
      }));
      console.log(req.files);
      // Create a new Submission document using the Mongoose model
      const newSubmission = new Submission({
        ...req.body,
        applicationId,
        file: pdfFiles, // Add the generated application ID to the submission
      });
      console.log(pdfFiles, "pdfFiles");
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
  }
);
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
