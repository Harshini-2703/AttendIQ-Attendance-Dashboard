const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log("MongoDB URI not found. Running with in-memory demo data.");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    return true;
  } catch (error) {
    console.log("Database connection failed. Running with in-memory demo data.");
    console.log(error.message);
    return false;
  }
};

module.exports = connectDB;
