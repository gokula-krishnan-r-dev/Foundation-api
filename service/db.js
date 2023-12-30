const mongoose = require("mongoose");
const MONGODB_URI =
  // "mongodb+srv://gokulakrishnanr812:vtEmjsXnqZrqf2rv@astro.w7dqrqv.mongodb.net/?retryWrites=true&w=majority";
  "mongodb+srv://gokula:vtEmjsXnqZrqf2rv@cluster0.klfb9oe.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
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
