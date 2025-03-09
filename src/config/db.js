const mongoose = require("mongoose");
const logger = require("./logger");

// MongoDB connection options
const options = {
  // These options are no longer needed in Mongoose 6+
};

// MongoDB connection function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/instagram-bot"
    );
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
