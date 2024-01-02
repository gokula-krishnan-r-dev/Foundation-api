const mongoose = require("mongoose");
const SubmitData = [
  {
    tag: "firstname",
    placeholder: "First Name",
    type: "text",
    description: "Enter your First Name",
  },
  {
    tag: "lastname",
    placeholder: "Last Name",
    type: "text",
    description: "Enter your Last Name",
  },
  {
    tag: "title",
    placeholder: "Title",
    type: "text",
    description: "Enter your Title",
  },
  {
    tag: "email",
    placeholder: "Email Address",
    type: "email",
    description: "Enter your Email Address",
  },
  {
    tag: "address",
    placeholder: "Mailing Address",
    type: "text",
    description: "Enter your Mailing Address",
  },
  {
    tag: "mission",
    placeholder: "Mission Statement",
    type: "text",
    description: "Enter your Organization's Mission Statement",
  },
  {
    tag: "projectTitle",
    placeholder: "Project Title",
    type: "text",
    description: "Enter your Project Title",
  },
  {
    tag: "projectDescription",
    placeholder: "Project Description",
    type: "text",
    description: "Enter your Project Description",
  },
  {
    tag: "targetPopulation",
    placeholder: "Target Population",
    type: "text",
    description: "Enter your Target Population",
  },
  {
    tag: "projectLocation",
    placeholder: "Project Location",
    type: "text",
    description: "Enter your Project Location",
  },
  {
    tag: "totalProjectBudget",
    placeholder: "Total Project Budget",
    type: "text",
    description: "Enter Total Project Budget",
  },
  {
    tag: "amountRequested",
    placeholder: "Amount Requested",
    type: "text",
    description: "Enter Amount Requested",
  },
  {
    tag: "otherFundingSources",
    placeholder: "Other Funding Sources",
    type: "text",
    description: "Enter Other Funding Sources Information",
  },
  {
    tag: "references",
    placeholder: "References or Endorsements",
    type: "text",
    description: "Enter References or Endorsements Information",
  },
  {
    tag: "consentFunds",
    placeholder: "Consent for Use of Funds",
    type: "text",
    description: "Enter Consent for Use of Funds Statement",
  },
  {
    tag: "verification",
    placeholder: "Verification Statement",
    type: "text",
    description: "Enter Verification Statement",
  },
  {
    tag: "contactPerson",
    placeholder: "Primary Contact Person",
    type: "text",
    description: "Enter Primary Contact Person Information",
  },
  {
    tag: "status",
    placeholder: "status  Application",
    type: "text",
    description: "Enter status  Application Information",
  },
];
const schemaFields = {
  createdDate: {
    type: Date,
    default: Date.now, // Set default value to current date/time
  },
  applicationId: {
    type: String,
    required: true,
  },
  file: {
    type: Object,
    required: false,
  },
};
SubmitData.forEach((field) => {
  schemaFields[field.tag] = String; // Assuming all fields are of type String
  // You can customize the types based on the field definitions in SubmitData
});

// Create a Mongoose schema using the dynamically created fields
const submissionSchema = new mongoose.Schema(schemaFields, {
  toJSON: {
    transform: function (doc, ret) {
      // Customize JSON output for createdDate
      if (ret.createdDate instanceof Date) {
        ret.createdDate = ret.createdDate.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        });
      }
    },
  },
});

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
