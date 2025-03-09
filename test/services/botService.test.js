const botService = require("../../src/services/botService");
const Setting = require("../../src/models/setting");
const Account = require("../../src/models/account");

// Mock dependencies
jest.mock("../../src/models/setting");
jest.mock("../../src/models/account");
jest.mock("../../src/services/trendService");
jest.mock("../../src/services/followService");
jest.mock("../../src/services/interactionService");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("Bot Service", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock active settings
    Setting.getActiveSettings.mockResolvedValue({
      botMode: "active",
      enabledFeatures: {
        like: true,
        comment: true,
        follow: false,
        unfollow: false,
        directMessage: true,
        viewStory: true,
      },
      limits: {
        dailyLikes: 50,
        dailyComments: 20,
        dailyFollows: 10,
        dailyUnfollows: 10,
        dailyDirectMessages: 5,
        dailyStoryViews: 50,
      },
      schedule: {
        startHour: 9,
        endHour: 23,
        activeOnWeekends: true,
      },
    });

    // Mock active account
    Account.findOne.mockResolvedValue({
      _id: "test-account-id",
      username: "test_user",
      dailyStats: {
        likes: 0,
        comments: 0,
        follows: 0,
        unfollows: 0,
        directMessages: 0,
        storyViews: 0,
      },
      updateStats: jest.fn().mockResolvedValue(true),
      resetDailyStats: jest.fn().mockResolvedValue(true),
      recordError: jest.fn().mockResolvedValue(true),
    });
  });

  describe("startBot", () => {
    it("should start the bot successfully", async () => {
      // Override isRunning and startBot for this test
      const originalIsRunning = botService.isRunning;
      const originalRunWorkflow = botService.runMainWorkflow;

      botService.isRunning = false;
      botService.runMainWorkflow = jest.fn().mockResolvedValue(true);

      const result = await botService.startBot();

      expect(result.success).toBe(true);
      expect(botService.isRunning).toBe(true);
      expect(botService.currentTask).not.toBeNull();
      expect(Setting.getActiveSettings).toHaveBeenCalled();
      expect(botService.runMainWorkflow).toHaveBeenCalled();

      // Restore original properties
      botService.isRunning = originalIsRunning;
      botService.runMainWorkflow = originalRunWorkflow;
    });

    it("should not start if bot is already running", async () => {
      // Override isRunning
      const originalIsRunning = botService.isRunning;
      botService.isRunning = true;

      const result = await botService.startBot();

      expect(result.success).toBe(false);
      expect(result.message).toContain("already running");

      // Restore original property
      botService.isRunning = originalIsRunning;
    });

    it("should not start if bot mode is not active", async () => {
      // Override getActiveSettings to return non-active mode
      Setting.getActiveSettings.mockResolvedValueOnce({
        botMode: "maintenance",
        enabledFeatures: {
          like: true,
          comment: true,
        },
      });

      const originalIsRunning = botService.isRunning;
      botService.isRunning = false;

      const result = await botService.startBot();

      expect(result.success).toBe(false);
      expect(result.message).toContain("maintenance mode");

      // Restore original property
      botService.isRunning = originalIsRunning;
    });
  });

  describe("stopBot", () => {
    it("should stop the bot successfully", () => {
      // Set bot as running
      const originalIsRunning = botService.isRunning;
      const originalCurrentTask = botService.currentTask;

      botService.isRunning = true;
      botService.currentTask = "test-task";

      const result = botService.stopBot();

      expect(result.success).toBe(true);
      expect(botService.isRunning).toBe(false);
      expect(botService.currentTask).toBeNull();
      expect(result.lastTask).toBe("test-task");

      // Restore original properties
      botService.isRunning = originalIsRunning;
      botService.currentTask = originalCurrentTask;
    });

    it("should return error if bot is not running", () => {
      // Set bot as not running
      const originalIsRunning = botService.isRunning;
      botService.isRunning = false;

      const result = botService.stopBot();

      expect(result.success).toBe(false);
      expect(result.message).toContain("not running");

      // Restore original property
      botService.isRunning = originalIsRunning;
    });
  });

  describe("getStatus", () => {
    it("should return current bot status", () => {
      // Set bot status
      const originalIsRunning = botService.isRunning;
      const originalCurrentTask = botService.currentTask;

      botService.isRunning = true;
      botService.currentTask = "test-task";

      const status = botService.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.currentTask).toBe("test-task");

      // Restore original properties
      botService.isRunning = originalIsRunning;
      botService.currentTask = originalCurrentTask;
    });
  });

  describe("resetDailyStats", () => {
    it("should reset daily stats successfully", async () => {
      const result = await botService.resetDailyStats();

      expect(result.success).toBe(true);
      expect(Account.findOne).toHaveBeenCalledWith({ isActive: true });
      expect(Account.findOne().resetDailyStats).toHaveBeenCalled();
    });

    it("should handle errors during reset", async () => {
      // Mock failure
      Account.findOne.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const result = await botService.resetDailyStats();

      expect(result.success).toBe(false);
      expect(result.message).toContain("Error");
    });
  });

  describe("isWithinActiveHours", () => {
    it("should return true for valid hours", () => {
      // Mock current date/time to be within active hours
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super();
        }
        getHours() {
          return 14; // Middle of the day
        }
        getDay() {
          return 2; // Tuesday (weekday)
        }
      };

      const settings = {
        schedule: {
          startHour: 9,
          endHour: 23,
          activeOnWeekends: true,
        },
      };

      const result = botService.isWithinActiveHours(settings);

      expect(result).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });

    it("should return false for hours outside schedule", () => {
      // Mock current date/time to be outside active hours
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super();
        }
        getHours() {
          return 3; // Early morning
        }
        getDay() {
          return 3; // Wednesday (weekday)
        }
      };

      const settings = {
        schedule: {
          startHour: 9,
          endHour: 23,
          activeOnWeekends: true,
        },
      };

      const result = botService.isWithinActiveHours(settings);

      expect(result).toBe(false);

      // Restore original Date
      global.Date = originalDate;
    });

    it("should respect weekend settings", () => {
      // Mock current date/time to be on weekend
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super();
        }
        getHours() {
          return 14; // Middle of the day
        }
        getDay() {
          return 6; // Saturday (weekend)
        }
      };

      // Test when weekends are disabled
      const settings = {
        schedule: {
          startHour: 9,
          endHour: 23,
          activeOnWeekends: false,
        },
      };

      const result = botService.isWithinActiveHours(settings);

      expect(result).toBe(false);

      // Restore original Date
      global.Date = originalDate;
    });
  });
});
