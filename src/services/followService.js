const Follow = require("../models/follow");
const Account = require("../models/account");
const Interaction = require("../models/interaction");
const Setting = require("../models/setting");
const logger = require("../config/logger");
const humanizer = require("../utils/humanizer");
const instagramConfig = require("../config/instagram");

class FollowService {
  constructor() {
    // این متغیر به صورت گلوبال در instagram.js قرار داده شده است
    this.ig = global.ig;
  }

  /**
   * فالو کردن یک کاربر جدید
   */
  async followUser(
    userId,
    username,
    discoveryMethod = "hashtag",
    discoverySource = null
  ) {
    try {
      // دریافت تنظیمات بات
      const settings = await Setting.getActiveSettings();

      // بررسی آیا ویژگی فالو فعال است
      if (!settings.enabledFeatures.follow) {
        logger.info(`Following is disabled in settings`);
        return false;
      }

      // شبیه‌سازی رفتار انسانی
      if (settings.humanization.randomizeTimeBetweenActions) {
        await humanizer.simulateHumanDelay(
          instagramConfig.limits.follows.minDelaySeconds,
          instagramConfig.limits.follows.maxDelaySeconds
        );
      }

      // بررسی اطلاعات کاربر
      const userInfo = await this.ig.user.info(userId);

      // بررسی معیارهای هدف
      if (
        userInfo.follower_count < settings.targetCriteria.minFollowers ||
        userInfo.follower_count > settings.targetCriteria.maxFollowers
      ) {
        logger.info(
          `User ${username} doesn't meet follower count criteria (${userInfo.follower_count} followers)`
        );
        return false;
      }

      // محاسبه نرخ تعامل (تقریبی)
      let engagementRate = null;
      if (userInfo.follower_count > 0 && userInfo.media_count > 0) {
        try {
          // تلاش برای دریافت پست‌های اخیر برای محاسبه نرخ تعامل
          const userFeed = this.ig.feed.user(userId);
          const posts = await userFeed.items();

          if (posts && posts.length > 0) {
            let totalEngagement = 0;

            posts.slice(0, Math.min(posts.length, 5)).forEach((post) => {
              const likes = post.like_count || 0;
              const comments = post.comment_count || 0;
              totalEngagement += likes + comments;
            });

            engagementRate =
              (totalEngagement /
                Math.min(posts.length, 5) /
                userInfo.follower_count) *
              100;

            if (engagementRate < settings.targetCriteria.minEngagementRate) {
              logger.info(
                `User ${username} doesn't meet engagement rate criteria (${engagementRate.toFixed(
                  2
                )}%)`
              );
              return false;
            }
          }
        } catch (error) {
          logger.warn(
            `Could not calculate engagement rate for ${username}: ${error.message}`
          );
        }
      }

      // فالو کردن کاربر
      await this.ig.friendship.create(userId);

      logger.info(`Followed user ${username}`);

      // به‌روزرسانی آمار حساب کاربری
      const account = await Account.findOne({ isActive: true });
      await account.updateStats("follows");

      // ذخیره رکورد فالو در دیتابیس
      const followData = {
        targetUsername: username,
        targetUserId: userId,
        status: "following",
        engagementRate,
        followerCount: userInfo.follower_count,
        followingCount: userInfo.following_count,
        discoveryMethod,
        discoverySource,
        botAccount: account._id,
      };

      await Follow.create(followData);

      // ثبت تعامل
      await Interaction.recordInteraction({
        targetUsername: username,
        targetUserId: userId,
        mediaType: "profile",
        interactionType: "follow",
        botAccount: account._id,
        successful: true,
      });

      return true;
    } catch (error) {
      logger.error(`Error following user ${username}: ${error.message}`);

      // ثبت خطا
      const account = await Account.findOne({ isActive: true });
      await account.recordError(`Error following user: ${error.message}`);

      return false;
    }
  }

  /**
   * آنفالو کردن یک کاربر
   */
  async unfollowUser(userId, username) {
    try {
      // دریافت تنظیمات بات
      const settings = await Setting.getActiveSettings();

      // بررسی آیا ویژگی آنفالو فعال است
      if (!settings.enabledFeatures.unfollow) {
        logger.info(`Unfollowing is disabled in settings`);
        return false;
      }

      // شبیه‌سازی رفتار انسانی
      if (settings.humanization.randomizeTimeBetweenActions) {
        await humanizer.simulateHumanDelay(
          instagramConfig.limits.unfollows.minDelaySeconds,
          instagramConfig.limits.unfollows.maxDelaySeconds
        );
      }

      // آنفالو کردن کاربر
      await this.ig.friendship.destroy(userId);

      logger.info(`Unfollowed user ${username}`);

      // به‌روزرسانی آمار حساب کاربری
      const account = await Account.findOne({ isActive: true });
      await account.updateStats("unfollows");

      // به‌روزرسانی رکورد فالو در دیتابیس
      const followRecord = await Follow.findOne({
        targetUserId: userId,
        botAccount: account._id,
        status: "following",
      });

      if (followRecord) {
        await followRecord.updateStatus("unfollowed");
      }

      // ثبت تعامل
      await Interaction.recordInteraction({
        targetUsername: username,
        targetUserId: userId,
        mediaType: "profile",
        interactionType: "unfollow",
        botAccount: account._id,
        successful: true,
      });

      return true;
    } catch (error) {
      logger.error(`Error unfollowing user ${username}: ${error.message}`);

      // ثبت خطا
      const account = await Account.findOne({ isActive: true });
      await account.recordError(`Error unfollowing user: ${error.message}`);

      return false;
    }
  }

  /**
   * بررسی آیا یک کاربر ما را فالو کرده است
   */
  async checkIfUserFollowsBack(userId, username) {
    try {
      // دریافت اطلاعات فالوورها
      const friendship = await this.ig.friendship.show(userId);

      // بررسی آیا کاربر ما را فالو می‌کند
      const followsBack = friendship.followed_by;

      if (followsBack) {
        logger.info(`User ${username} is following us back`);
      } else {
        logger.info(`User ${username} is not following us back`);
      }

      return followsBack;
    } catch (error) {
      logger.error(
        `Error checking if ${username} follows back: ${error.message}`
      );
      return false;
    }
  }

  /**
   * پردازش فالوبک‌ها - بررسی کاربرانی که فالو کرده‌ایم تا ببینیم آیا ما را فالو کرده‌اند
   */
  async processFollowBacks() {
    try {
      // دریافت حساب کاربری فعال
      const account = await Account.findOne({ isActive: true });

      // پیدا کردن کاربرانی که فالو کرده‌ایم اما هنوز نمی‌دانیم آیا فالوبک داده‌اند یا خیر
      const followedUsers = await Follow.find({
        botAccount: account._id,
        status: "following",
        didFollowBack: false,
      })
        .sort({ followedAt: 1 })
        .limit(50);

      if (followedUsers.length === 0) {
        logger.info("No users to check for follow backs");
        return {
          success: true,
          message: "No users to check",
          processedCount: 0,
        };
      }

      logger.info(
        `Found ${followedUsers.length} users to check for follow backs`
      );

      let followBackCount = 0;

      for (const followRecord of followedUsers) {
        // بررسی فالو بک با تاخیر بین هر درخواست
        const followsBack = await this.checkIfUserFollowsBack(
          followRecord.targetUserId,
          followRecord.targetUsername
        );

        if (followsBack) {
          // به‌روزرسانی رکورد فالو
          await followRecord.markFollowedBack();
          followBackCount++;
        }

        // تاخیر بین درخواست‌ها
        await humanizer.simulateHumanDelay(2, 5);
      }

      logger.info(
        `Processed ${followedUsers.length} users, ${followBackCount} follow backs found`
      );

      return {
        success: true,
        message: "Follow backs processed successfully",
        processedCount: followedUsers.length,
        followBackCount,
      };
    } catch (error) {
      logger.error(`Error processing follow backs: ${error.message}`);

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * دریافت آمار فالو و آنفالو
   */
  async getFollowStats(startDate, endDate) {
    try {
      const account = await Account.findOne({ isActive: true });

      if (!account) {
        throw new Error("No active account found");
      }

      // دریافت آمار از دیتابیس
      const stats = await Follow.getFollowStats(
        account._id,
        startDate,
        endDate
      );

      // دریافت کل تعداد فالوها و آنفالوها
      const totalFollowing = await Follow.countDocuments({
        botAccount: account._id,
        status: "following",
      });

      const followBackRate = await Follow.aggregate([
        {
          $match: {
            botAccount: account._id,
            status: "following",
          },
        },
        {
          $group: {
            _id: null,
            totalFollowing: { $sum: 1 },
            followBacks: {
              $sum: { $cond: [{ $eq: ["$didFollowBack", true] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            followBackRate: { $divide: ["$followBacks", "$totalFollowing"] },
          },
        },
      ]);

      return {
        success: true,
        stats: stats[0] || {
          totalFollowed: 0,
          totalUnfollowed: 0,
          followBackRate: 0,
        },
        totalFollowing,
        followBackRate:
          followBackRate.length > 0 ? followBackRate[0].followBackRate : 0,
      };
    } catch (error) {
      logger.error(`Error getting follow stats: ${error.message}`);

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * یافتن کاربرانی که بهترین عملکرد را در تعامل داشته‌اند
   */
  async findBestPerformingUsers(limit = 10) {
    try {
      const account = await Account.findOne({ isActive: true });

      if (!account) {
        throw new Error("No active account found");
      }

      // پیدا کردن کاربرانی که بیشترین تعاملات را داشته‌اند
      const bestUsers = await Interaction.getMostEngagedUsers(
        account._id,
        limit
      );

      // برای هر کاربر، بررسی کنید آیا آنها ما را دنبال کرده‌اند
      for (const user of bestUsers) {
        const followRecord = await Follow.findOne({
          botAccount: account._id,
          targetUserId: user._id,
        });

        user.isFollowing = followRecord
          ? followRecord.status === "following"
          : false;
        user.didFollowBack = followRecord ? followRecord.didFollowBack : false;
      }

      return {
        success: true,
        users: bestUsers,
      };
    } catch (error) {
      logger.error(`Error finding best performing users: ${error.message}`);

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }
}

module.exports = new FollowService();
