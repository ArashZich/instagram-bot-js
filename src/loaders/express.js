const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const logger = require("../config/logger");

module.exports = (app) => {
  // Swagger configuration
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

  // Apply middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup logging
  if (process.env.NODE_ENV !== "test") {
    app.use(
      morgan("dev", {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );
  }

  // Setup Swagger documentation
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  // Return the Express app
  return app;
};
