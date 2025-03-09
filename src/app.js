const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
require("dotenv").config();

// Import loaders
const mongooseLoader = require("./loaders/mongoose");
const instagramLoader = require("./loaders/instagram");
const scheduler = require("./scheduler/scheduler");
const logger = require("./config/logger");

// Import routes
const statsRoutes = require("./api/routes/stats");
const actionsRoutes = require("./api/routes/actions");
const settingsRoutes = require("./api/routes/settings");

// Initialize app
const app = express();

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Instagram Bot API",
      version: "1.0.0",
      description:
        "API for controlling Instagram bot with human-like interactions",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ["./src/api/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// API routes
app.use("/api/stats", statsRoutes);
app.use("/api/actions", actionsRoutes);
app.use("/api/settings", settingsRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

// Start server and initialize connections
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize MongoDB connection
    await mongooseLoader();
    logger.info("MongoDB connected");

    // Initialize Instagram client
    await instagramLoader();
    logger.info("Instagram client initialized");

    // Start the scheduler
    scheduler.start();
    logger.info("Task scheduler started");

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
