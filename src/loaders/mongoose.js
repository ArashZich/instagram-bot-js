const mongoose = require("mongoose");
const logger = require("../config/logger");

module.exports = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/instagram-bot",
      {
        // mongoose 6+ options are no longer needed
      }
    );

    // Check connection
    if (connection) {
      logger.info("MongoDB connected successfully");
    }

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
      process.exit(1);
    });

    return connection;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};
