const botService = require("../../services/botService");
const interactionService = require("../../services/interactionService");
const followService = require("../../services/followService");
const trendService = require("../../services/trendService");
const instagramService = require("../../services/instagramService");
const logger = require("../../config/logger");

/**
 * شروع بات
 */
exports.startBot = async (req, res) => {
  try {
    const result = await botService.startBot();

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error starting bot: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error starting bot",
      error: error.message,
    });
  }
};

/**
 * توقف بات
 */
exports.stopBot = async (req, res) => {
  try {
    const result = botService.stopBot();

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error stopping bot: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error stopping bot",
      error: error.message,
    });
  }
};

/**
 * دریافت وضعیت بات
 */
exports.getBotStatus = async (req, res) => {
  try {
    const status = botService.getStatus();

    res.status(200).json({
      success: true,
      status,
    });
  } catch (error) {
    logger.error(`Error getting bot status: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error getting bot status",
      error: error.message,
    });
  }
};

/**
 * اجرای یک وظیفه خاص
 */
exports.runSpecificTask = async (req, res) => {
  try {
    const { taskName, options } = req.body;

    if (!taskName) {
      return res.status(400).json({
        success: false,
        message: "Task name is required",
      });
    }

    const result = await botService.runSpecificTask(taskName, options || {});

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error running task: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error running task",
      error: error.message,
    });
  }
};

/**
 * تعامل با یک کاربر خاص
 */
exports.interactWithUser = async (req, res) => {
  try {
    const { username, fullInteraction } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const result = await interactionService.interactWithUser(
      username,
      fullInteraction === true
    );

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error interacting with user: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error interacting with user",
      error: error.message,
    });
  }
};

/**
 * فالو کردن یک کاربر
 */
exports.followUser = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    // جستجوی کاربر
    const searchResult = await instagramService.searchUsers(username, 1);

    if (!searchResult.success || searchResult.users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = searchResult.users[0];
    const result = await followService.followUser(
      user.userId,
      user.username,
      "manual",
      "API request"
    );

    res.status(result ? 200 : 400).json({
      success: result,
      message: result
        ? `Successfully followed ${username}`
        : `Failed to follow ${username}`,
    });
  } catch (error) {
    logger.error(`Error following user: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error following user",
      error: error.message,
    });
  }
};

/**
 * آنفالو کردن یک کاربر
 */
exports.unfollowUser = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    // جستجوی کاربر
    const searchResult = await instagramService.searchUsers(username, 1);

    if (!searchResult.success || searchResult.users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = searchResult.users[0];
    const result = await followService.unfollowUser(user.userId, user.username);

    res.status(result ? 200 : 400).json({
      success: result,
      message: result
        ? `Successfully unfollowed ${username}`
        : `Failed to unfollow ${username}`,
    });
  } catch (error) {
    logger.error(`Error unfollowing user: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error unfollowing user",
      error: error.message,
    });
  }
};

/**
 * فرآیند فالوبک دادن به کاربران
 */
exports.processFollowBacks = async (req, res) => {
  try {
    const result = await followService.processFollowBacks();

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error processing follow backs: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error processing follow backs",
      error: error.message,
    });
  }
};

/**
 * بازنشانی آمار روزانه
 */
exports.resetDailyStats = async (req, res) => {
  try {
    const result = await botService.resetDailyStats();

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error resetting daily stats: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error resetting daily stats",
      error: error.message,
    });
  }
};

/**
 * به‌روزرسانی ترندها
 */
exports.updateTrends = async (req, res) => {
  try {
    const result = await trendService.updateAllTrends();

    res.status(200).json({
      success: true,
      message: "Trends updated successfully",
      results: result,
    });
  } catch (error) {
    logger.error(`Error updating trends: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error updating trends",
      error: error.message,
    });
  }
};

/**
 * یافتن کاربران فعال در ترندها
 */
exports.findActiveUsers = async (req, res) => {
  try {
    const { limit } = req.query;
    const queryLimit = limit ? parseInt(limit) : 20;

    const users = await trendService.findUsersToInteract(queryLimit);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    logger.error(`Error finding active users: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error finding active users",
      error: error.message,
    });
  }
};

/**
 * بررسی وضعیت سلامت اکانت
 */
exports.checkAccountHealth = async (req, res) => {
  try {
    const result = await instagramService.checkAccountHealth();

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error checking account health: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error checking account health",
      error: error.message,
    });
  }
};

/**
 * دریافت وضعیت اکانت
 */
exports.getAccountStatus = async (req, res) => {
  try {
    const result = await instagramService.checkAccountStatus();

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error(`Error checking account status: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error checking account status",
      error: error.message,
    });
  }
};
