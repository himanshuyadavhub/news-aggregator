const mongoose = require("mongoose");
const config = require('../config/config');

const mongo_uri = config.mongo_uri;

const connectDB = async () => {
  try {
    await mongoose.connect(mongo_uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.log(error)
    console.log("Something went wrong with Database connection");
    process.exit(1);
  }
};

module.exports = connectDB;
