const Interaction = require("../models/interaction");
const Account = require("../models/account");
const Follow = require("../models/follow");
const Setting = require("../models/setting");
const logger = require("../config/logger");
const interactionService = require("./interactionService");
const trendService = require("./trendService");
const followService = require("./followService");
const humanizer = require("../utils/humanizer");

class BotService {
  constructor() {
    this.isRunning = false;
    this.currentTask = null;
  }

  /**
   * شروع فعالیت بات با بررسی تنظیمات و برنامه زمانی
   */
  async startBot() {
    try {
      // بررسی آیا بات در حال حاضر در حال اجراست
      if (this.isRunning) {
        logger.info("Bot is already running");
        return {
          success: false,
          message: "Bot is already running",
          currentTask: this.currentTask,
        };
      }

      // دریافت تنظیمات فعال
      const settings = await Setting.getActiveSettings();

      // بررسی آیا بات فعال است
      if (settings.botMode !== "active") {
        logger.info(
          `Bot is not in active mode. Current mode: ${settings.botMode}`
        );
        return {
          success: false,
          message: `Bot is in ${settings.botMode} mode`,
        };
      }

      // بررسی آیا الان زمان فعالیت بات است
      if (!this.isWithinActiveHours(settings)) {
        const currentHour = new Date().getHours();
        logger.info(
          `Outside of active hours (${settings.schedule.startHour}-${settings.schedule.endHour}). Current hour: ${currentHour}`
        );
        return {
          success: false,
          message: "Outside of active hours",
        };
      }

      this.isRunning = true;
      this.currentTask = "initialization";

      logger.info("Bot started successfully");

      // آغاز جریان کار اصلی بات
      this.runMainWorkflow(settings).catch((error) => {
        logger.error(`Error in main workflow: ${error.message}`);
        this.isRunning = false;
        this.currentTask = null;
      });

      return {
        success: true,
        message: "Bot started successfully",
      };
    } catch (error) {
      logger.error(`Error starting bot: ${error.message}`);
      this.isRunning = false;
      this.currentTask = null;

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * توقف فعالیت بات
   */
  stopBot() {
    if (!this.isRunning) {
      return {
        success: false,
        message: "Bot is not running",
      };
    }

    logger.info("Stopping bot");
    this.isRunning = false;
    const lastTask = this.currentTask;
    this.currentTask = null;

    return {
      success: true,
      message: "Bot stopped successfully",
      lastTask,
    };
  }

  /**
   * بررسی وضعیت فعلی بات
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentTask: this.currentTask,
    };
  }

  /**
   * بررسی آیا زمان فعلی در محدوده زمان فعالیت بات است
   */
  isWithinActiveHours(settings) {
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = یکشنبه، 6 = شنبه

    // بررسی آیا امروز آخر هفته است (شنبه یا یکشنبه)
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    // اگر آخر هفته است و بات نباید در آخر هفته فعال باشد
    if (isWeekend && !settings.schedule.activeOnWeekends) {
      return false;
    }

    // بررسی برنامه زمانی سفارشی برای روز خاص
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][dayOfWeek];
    const customSchedule =
      settings.schedule.customSchedule &&
      settings.schedule.customSchedule.get(dayName);

    if (customSchedule && !customSchedule.active) {
      return false;
    }

    if (customSchedule) {
      return (
        currentHour >= customSchedule.startHour &&
        currentHour < customSchedule.endHour
      );
    }

    // استفاده از برنامه زمانی پیش‌فرض
    return (
      currentHour >= settings.schedule.startHour &&
      currentHour < settings.schedule.endHour
    );
  }

  /**
   * جریان کار اصلی بات
   */
  async runMainWorkflow(settings) {
    try {
      // گام 1: به‌روزرسانی ترندها
      this.currentTask = "updating_trends";
      logger.info("Starting trend update");
      await trendService.updateAllTrends();

      if (!this.isRunning) return; // بررسی آیا بات متوقف شده است

      // گام 2: یافتن کاربران برای تعامل
      this.currentTask = "finding_users";
      logger.info("Finding users to interact with");
      const usersToInteract = await trendService.findUsersToInteract(30);

      if (!this.isRunning) return;
      if (usersToInteract.length === 0) {
        logger.info("No users found to interact with");
        this.isRunning = false;
        this.currentTask = null;
        return;
      }

      // گام 3: انجام تعاملات با کاربران
      this.currentTask = "interacting_with_users";

      for (const user of usersToInteract) {
        if (!this.isRunning) break;

        logger.info(`Interacting with user: ${user.username}`);

        // بررسی آیا به محدودیت‌های روزانه رسیده‌ایم
        const account = await Account.findOne({ isActive: true });
        const reachedLikesLimit =
          account.dailyStats.likes >= settings.limits.dailyLikes;
        const reachedCommentsLimit =
          account.dailyStats.comments >= settings.limits.dailyComments;
        const reachedDMsLimit =
          account.dailyStats.directMessages >=
          settings.limits.dailyDirectMessages;

        if (reachedLikesLimit && reachedCommentsLimit && reachedDMsLimit) {
          logger.info("Reached daily interaction limits");
          break;
        }

        // تعیین نوع تعامل بر اساس محدودیت‌ها
        const shouldDoFullInteraction =
          !reachedCommentsLimit && !reachedDMsLimit;

        // تعامل با کاربر
        await interactionService.interactWithUser(
          user.username,
          shouldDoFullInteraction
        );

        // تاخیر بین تعاملات
        await humanizer.simulateHumanDelay(20, 60);
      }

      // گام 4: اگر فالو/آنفالو فعال است، آنها را انجام دهید
      if (
        settings.enabledFeatures.follow ||
        settings.enabledFeatures.unfollow
      ) {
        this.currentTask = "follow_unfollow";

        if (settings.enabledFeatures.unfollow) {
          logger.info("Starting unfollow operations");
          await this.performUnfollows(settings);
        }

        if (!this.isRunning) return;

        if (settings.enabledFeatures.follow) {
          logger.info("Starting follow operations");
          await this.performFollows(settings);
        }
      }

      // پایان جریان کار
      logger.info("Main workflow completed successfully");
      this.isRunning = false;
      this.currentTask = null;
    } catch (error) {
      logger.error(`Error in main workflow: ${error.message}`);
      this.isRunning = false;
      this.currentTask = null;
      throw error;
    }
  }

  /**
   * انجام عملیات آنفالو بر اساس معیارها
   */
  async performUnfollows(settings) {
    try {
      // بررسی آیا به محدودیت روزانه آنفالو رسیده‌ایم
      const account = await Account.findOne({ isActive: true });

      if (account.dailyStats.unfollows >= settings.limits.dailyUnfollows) {
        logger.info("Reached daily unfollow limit");
        return;
      }

      // یافتن کاربرانی که باید آنفالو شوند (فالو شده بیش از 3 روز و فالو بک نداده‌اند)
      const usersToUnfollow = await Follow.findUsersToUnfollow(
        account._id,
        3, // تعداد روزها
        settings.limits.dailyUnfollows - account.dailyStats.unfollows // تعداد مجاز باقیمانده
      );

      if (usersToUnfollow.length === 0) {
        logger.info("No users to unfollow at this time");
        return;
      }

      logger.info(`Found ${usersToUnfollow.length} users to unfollow`);

      // آنفالو کردن کاربران
      for (const followRecord of usersToUnfollow) {
        if (!this.isRunning) break;

        logger.info(`Unfollowing user: ${followRecord.targetUsername}`);

        // انجام عملیات آنفالو
        await followService.unfollowUser(
          followRecord.targetUserId,
          followRecord.targetUsername
        );

        // تاخیر بین آنفالوها
        await humanizer.simulateHumanDelay(30, 60);
      }
    } catch (error) {
      logger.error(`Error performing unfollows: ${error.message}`);
      throw error;
    }
  }

  /**
   * انجام عملیات فالو بر اساس معیارها
   */
  async performFollows(settings) {
    try {
      // بررسی آیا به محدودیت روزانه فالو رسیده‌ایم
      const account = await Account.findOne({ isActive: true });

      if (account.dailyStats.follows >= settings.limits.dailyFollows) {
        logger.info("Reached daily follow limit");
        return;
      }

      const remainingFollows =
        settings.limits.dailyFollows - account.dailyStats.follows;

      // یافتن کاربران برای فالو کردن
      const targetUsers = await trendService.findUsersToInteract(
        remainingFollows * 2
      );

      if (targetUsers.length === 0) {
        logger.info("No suitable users found to follow");
        return;
      }

      // فیلتر کردن کاربرانی که از قبل فالو شده‌اند
      const usersToFollow = [];
      for (const user of targetUsers) {
        // بررسی آیا این کاربر از قبل فالو شده است
        const existingFollow = await Follow.findOne({
          botAccount: account._id,
          targetUserId: user.userId,
          status: { $in: ["following", "pending"] },
        });

        if (!existingFollow && usersToFollow.length < remainingFollows) {
          usersToFollow.push(user);
        }

        // اگر به تعداد کافی کاربر پیدا کردیم، خروج از حلقه
        if (usersToFollow.length >= remainingFollows) {
          break;
        }
      }

      logger.info(`Found ${usersToFollow.length} new users to follow`);

      // فالو کردن کاربران
      for (const user of usersToFollow) {
        if (!this.isRunning) break;

        logger.info(`Following user: ${user.username}`);

        // انجام عملیات فالو
        await followService.followUser(
          user.userId,
          user.username,
          "hashtag",
          user.fromTrend ? user.fromTrend.hashtag : null
        );

        // تاخیر بین فالوها
        await humanizer.simulateHumanDelay(30, 60);
      }
    } catch (error) {
      logger.error(`Error performing follows: ${error.message}`);
      throw error;
    }
  }

  /**
   * اجرای یک وظیفه خاص به صورت اتوماتیک
   */
  async runSpecificTask(taskName, options = {}) {
    try {
      // اگر بات در حال اجراست، آن را متوقف کنید
      if (this.isRunning) {
        this.stopBot();
      }

      this.isRunning = true;
      this.currentTask = taskName;

      logger.info(`Starting specific task: ${taskName}`);

      switch (taskName) {
        case "update_trends":
          await trendService.updateAllTrends();
          break;

        case "follow_users":
          const followCount = options.count || 10;
          const settings = await Setting.getActiveSettings();
          settings.limits.dailyFollows = followCount;
          settings.enabledFeatures.follow = true;
          await this.performFollows(settings);
          break;

        case "unfollow_users":
          const unfollowCount = options.count || 10;
          const unfollowSettings = await Setting.getActiveSettings();
          unfollowSettings.limits.dailyUnfollows = unfollowCount;
          unfollowSettings.enabledFeatures.unfollow = true;
          await this.performUnfollows(unfollowSettings);
          break;

        case "interact_with_user":
          if (!options.username) {
            throw new Error("username is required for interact_with_user task");
          }
          await interactionService.interactWithUser(options.username, true);
          break;

        case "follow_back":
          await followService.processFollowBacks();
          break;

        default:
          throw new Error(`Unknown task: ${taskName}`);
      }

      logger.info(`Task ${taskName} completed successfully`);
      this.isRunning = false;
      this.currentTask = null;

      return {
        success: true,
        message: `Task ${taskName} completed successfully`,
      };
    } catch (error) {
      logger.error(`Error running task ${taskName}: ${error.message}`);
      this.isRunning = false;
      this.currentTask = null;

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * بازنشانی آمار روزانه
   */
  async resetDailyStats() {
    try {
      logger.info("Resetting daily stats");

      const accounts = await Account.find({ isActive: true });

      for (const account of accounts) {
        await account.resetDailyStats();
      }

      logger.info("Daily stats reset successfully");

      return {
        success: true,
        message: "Daily stats reset successfully",
      };
    } catch (error) {
      logger.error(`Error resetting daily stats: ${error.message}`);

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }
}

module.exports = new BotService();
