const request = require("supertest");
const express = require("express");
const actionsRoutes = require("../../../src/api/routes/actions");
const actionsController = require("../../../src/api/controllers/actionsController");

// Mock dependencies
jest.mock("../../../src/api/controllers/actionsController");

describe("Actions API Routes", () => {
  let app;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use("/api/actions", actionsRoutes);

    // Mock controller methods
    actionsController.startBot.mockImplementation((req, res) => {
      res
        .status(200)
        .json({ success: true, message: "Bot started successfully" });
    });

    actionsController.stopBot.mockImplementation((req, res) => {
      res
        .status(200)
        .json({ success: true, message: "Bot stopped successfully" });
    });

    actionsController.getBotStatus.mockImplementation((req, res) => {
      res.status(200).json({
        success: true,
        status: { isRunning: true, currentTask: "test-task" },
      });
    });

    actionsController.runSpecificTask.mockImplementation((req, res) => {
      const { taskName } = req.body;
      if (!taskName) {
        return res
          .status(400)
          .json({ success: false, message: "Task name is required" });
      }
      res.status(200).json({
        success: true,
        message: `Task ${taskName} completed successfully`,
      });
    });

    actionsController.interactWithUser.mockImplementation((req, res) => {
      const { username } = req.body;
      if (!username) {
        return res
          .status(400)
          .json({ success: false, message: "Username is required" });
      }
      res.status(200).json({
        success: true,
        message: `Interaction with ${username} completed successfully`,
      });
    });
  });

  describe("POST /api/actions/start", () => {
    it("should start the bot successfully", async () => {
      const response = await request(app).post("/api/actions/start").send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("started successfully");
      expect(actionsController.startBot).toHaveBeenCalled();
    });
  });

  describe("POST /api/actions/stop", () => {
    it("should stop the bot successfully", async () => {
      const response = await request(app).post("/api/actions/stop").send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("stopped successfully");
      expect(actionsController.stopBot).toHaveBeenCalled();
    });
  });

  describe("GET /api/actions/status", () => {
    it("should get the bot status successfully", async () => {
      const response = await request(app).get("/api/actions/status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status.isRunning).toBe(true);
      expect(response.body.status.currentTask).toBe("test-task");
      expect(actionsController.getBotStatus).toHaveBeenCalled();
    });
  });

  describe("POST /api/actions/run-task", () => {
    it("should run a specific task successfully", async () => {
      const response = await request(app)
        .post("/api/actions/run-task")
        .send({ taskName: "update_trends" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "update_trends completed successfully"
      );
      expect(actionsController.runSpecificTask).toHaveBeenCalled();
    });

    it("should return error if task name is missing", async () => {
      const response = await request(app)
        .post("/api/actions/run-task")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Task name is required");
      expect(actionsController.runSpecificTask).toHaveBeenCalled();
    });
  });

  describe("POST /api/actions/interact", () => {
    it("should interact with user successfully", async () => {
      const response = await request(app)
        .post("/api/actions/interact")
        .send({ username: "test_user", fullInteraction: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "test_user completed successfully"
      );
      expect(actionsController.interactWithUser).toHaveBeenCalled();
    });

    it("should return error if username is missing", async () => {
      const response = await request(app)
        .post("/api/actions/interact")
        .send({ fullInteraction: true });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Username is required");
      expect(actionsController.interactWithUser).toHaveBeenCalled();
    });
  });
});
