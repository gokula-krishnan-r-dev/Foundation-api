const mongoose = require("mongoose");
const MONGODB_URI =
  "mongodb+srv://gokula:vtEmjsXnqZrqf2rv@cluster0.klfb9oe.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

const connectToMongoDB = mongoose.connection;

connectToMongoDB.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);
connectToMongoDB.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = connectToMongoDB;
