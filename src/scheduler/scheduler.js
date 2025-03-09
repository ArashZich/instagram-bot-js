const cron = require("node-cron");
const botService = require("../services/botService");
const trendService = require("../services/trendService");
const followService = require("../services/followService");
const Setting = require("../models/setting");
const Account = require("../models/account");
const logger = require("../config/logger");

class Scheduler {
  constructor() {
    this.tasks = {};
    this.isInitialized = false;
  }

  /**
   * راه‌اندازی زمان‌بندی‌های پیش‌فرض
   */
  async start() {
    try {
      if (this.isInitialized) {
        logger.info("Scheduler already initialized");
        return true;
      }

      logger.info("Initializing scheduler");

      // دریافت تنظیمات
      const settings = await Setting.getActiveSettings();

      // زمان‌بندی شروع خودکار بات (هر روز صبح)
      this.tasks.startBot = cron.schedule("0 0 9 * * *", async () => {
        try {
          logger.info("Running scheduled task: startBot");

          // بررسی آیا بات باید در حالت فعال باشد
          if (settings.botMode === "active") {
            await botService.startBot();
          } else {
            logger.info(
              `Bot not started automatically because mode is ${settings.botMode}`
            );
          }
        } catch (error) {
          logger.error(`Error in scheduled task startBot: ${error.message}`);
        }
      });

      // زمان‌بندی توقف خودکار بات (هر روز شب)
      this.tasks.stopBot = cron.schedule("0 0 23 * * *", async () => {
        try {
          logger.info("Running scheduled task: stopBot");
          botService.stopBot();
        } catch (error) {
          logger.error(`Error in scheduled task stopBot: ${error.message}`);
        }
      });

      // زمان‌بندی بازنشانی آمار روزانه (هر روز نیمه شب)
      this.tasks.resetDailyStats = cron.schedule("0 0 0 * * *", async () => {
        try {
          logger.info("Running scheduled task: resetDailyStats");
          await botService.resetDailyStats();
        } catch (error) {
          logger.error(
            `Error in scheduled task resetDailyStats: ${error.message}`
          );
        }
      });

      // زمان‌بندی به‌روزرسانی ترندها (هر 6 ساعت)
      this.tasks.updateTrends = cron.schedule("0 0 */6 * * *", async () => {
        try {
          logger.info("Running scheduled task: updateTrends");
          await trendService.updateAllTrends();
        } catch (error) {
          logger.error(
            `Error in scheduled task updateTrends: ${error.message}`
          );
        }
      });

      // زمان‌بندی بررسی فالوبک‌ها (هر 12 ساعت)
      this.tasks.processFollowBacks = cron.schedule(
        "0 0 */12 * * *",
        async () => {
          try {
            logger.info("Running scheduled task: processFollowBacks");
            await followService.processFollowBacks();
          } catch (error) {
            logger.error(
              `Error in scheduled task processFollowBacks: ${error.message}`
            );
          }
        }
      );

      // زمان‌بندی آنفالو کردن کاربران (هر روز ساعت 3 صبح)
      this.tasks.performUnfollows = cron.schedule("0 0 3 * * *", async () => {
        try {
          logger.info("Running scheduled task: performUnfollows");

          if (settings.enabledFeatures.unfollow) {
            await botService.runSpecificTask("unfollow_users", {
              count: settings.limits.dailyUnfollows,
            });
          } else {
            logger.info("Unfollow feature is disabled in settings");
          }
        } catch (error) {
          logger.error(
            `Error in scheduled task performUnfollows: ${error.message}`
          );
        }
      });

      this.isInitialized = true;
      logger.info("Scheduler initialized successfully");
      return true;
    } catch (error) {
      logger.error(`Error initializing scheduler: ${error.message}`);
      return false;
    }
  }

  /**
   * توقف همه زمان‌بندی‌ها
   */
  stop() {
    logger.info("Stopping all scheduled tasks");

    Object.keys(this.tasks).forEach((taskName) => {
      if (this.tasks[taskName]) {
        this.tasks[taskName].stop();
        logger.info(`Stopped scheduled task: ${taskName}`);
      }
    });

    this.isInitialized = false;
    return true;
  }

  /**
   * اضافه کردن یک زمان‌بندی سفارشی
   */
  addCustomTask(taskName, cronExpression, taskFunction) {
    try {
      logger.info(
        `Adding custom scheduled task: ${taskName} with cron: ${cronExpression}`
      );

      if (this.tasks[taskName]) {
        // اگر وظیفه از قبل وجود دارد، آن را متوقف کنید
        this.tasks[taskName].stop();
      }

      // ایجاد زمان‌بندی جدید
      this.tasks[taskName] = cron.schedule(cronExpression, async () => {
        try {
          logger.info(`Running custom scheduled task: ${taskName}`);
          await taskFunction();
        } catch (error) {
          logger.error(
            `Error in custom scheduled task ${taskName}: ${error.message}`
          );
        }
      });

      return true;
    } catch (error) {
      logger.error(`Error adding custom task ${taskName}: ${error.message}`);
      return false;
    }
  }

  /**
   * بازنشانی زمان‌بندی‌ها بر اساس تنظیمات جدید
   */
  async resetSchedule() {
    try {
      logger.info("Resetting scheduler based on current settings");

      // توقف همه زمان‌بندی‌های فعلی
      this.stop();

      // راه‌اندازی مجدد با تنظیمات جدید
      await this.start();

      return true;
    } catch (error) {
      logger.error(`Error resetting scheduler: ${error.message}`);
      return false;
    }
  }

  /**
   * اجرای دستی یک وظیفه زمان‌بندی شده
   */
  async executeTask(taskName) {
    try {
      logger.info(`Manually executing scheduled task: ${taskName}`);

      switch (taskName) {
        case "startBot":
          return await botService.startBot();

        case "stopBot":
          return botService.stopBot();

        case "resetDailyStats":
          return await botService.resetDailyStats();

        case "updateTrends":
          return await trendService.updateAllTrends();

        case "processFollowBacks":
          return await followService.processFollowBacks();

        case "performUnfollows":
          const settings = await Setting.getActiveSettings();
          return await botService.runSpecificTask("unfollow_users", {
            count: settings.limits.dailyUnfollows,
          });

        default:
          throw new Error(`Unknown task: ${taskName}`);
      }
    } catch (error) {
      logger.error(`Error executing task ${taskName}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new Scheduler();
