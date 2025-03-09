const { IgApiClient } = require("instagram-private-api");
const Account = require("../models/account");
const Setting = require("../models/setting");
const logger = require("../config/logger");
const fs = require("fs").promises;
const path = require("path");

class InstagramService {
  constructor() {
    this.ig = null;
    this.isLoggedIn = false;
    this.lastLogin = null;
    this.activeAccount = null;
  }

  /**
   * دریافت نمونه اینستاگرام کلاینت
   */
  getClient() {
    if (!this.ig || !this.isLoggedIn) {
      throw new Error("Instagram client not initialized or not logged in");
    }
    return this.ig;
  }

  /**
   * راه‌اندازی اینستاگرام کلاینت
   */
  async initialize() {
    try {
      // ایجاد نمونه جدید از کلاینت
      this.ig = new IgApiClient();
      logger.info("Instagram client created");

      // پیدا کردن اکانت فعال
      const activeAccount = await Account.findOne({ isActive: true });

      if (!activeAccount) {
        throw new Error("No active Instagram account found in database");
      }

      this.activeAccount = activeAccount;

      // لاگین به اکانت
      await this.login(activeAccount.username, activeAccount.password);

      // ذخیره مرجع کلاینت به صورت گلوبال برای دسترسی آسان‌تر در سرویس‌های دیگر
      global.ig = this.ig;

      return this.ig;
    } catch (error) {
      logger.error(`Error initializing Instagram client: ${error.message}`);
      throw error;
    }
  }

  /**
   * لاگین به اکانت اینستاگرام
   */
  async login(username, password) {
    try {
      logger.info(`Logging in to Instagram as ${username}`);

      // تنظیم دستگاه
      this.ig.state.generateDevice(username);

      // بررسی آیا سشن ذخیره شده وجود دارد
      const hasSession = await this.loadSession();

      if (hasSession) {
        try {
          // بررسی معتبر بودن سشن با دریافت اطلاعات کاربر
          const currentUser = await this.ig.account.currentUser();
          logger.info(
            `Successfully restored session for ${currentUser.username}`
          );
          this.isLoggedIn = true;
          this.lastLogin = new Date();
          return currentUser;
        } catch (sessionError) {
          logger.warn(
            `Saved session expired, performing fresh login: ${sessionError.message}`
          );
          // ادامه به لاگین معمولی
        }
      }

      // لاگین معمولی
      await this.ig.simulate.preLoginFlow();
      const loggedInUser = await this.ig.account.login(username, password);

      // انجام مراحل پس از لاگین
      await this.ig.simulate.postLoginFlow();

      // ذخیره سشن
      await this.saveSession();

      logger.info(`Successfully logged in as ${loggedInUser.username}`);
      this.isLoggedIn = true;
      this.lastLogin = new Date();

      // به‌روزرسانی آخرین زمان لاگین در دیتابیس
      if (this.activeAccount) {
        this.activeAccount.lastLogin = new Date();
        await this.activeAccount.save();
      }

      return loggedInUser;
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      this.isLoggedIn = false;

      // مدیریت خطاهای رایج
      if (error.message.includes("checkpoint")) {
        logger.error(
          "Instagram checkpoint detected. Manual verification required."
        );
      } else if (error.message.includes("bad_password")) {
        logger.error("Incorrect password.");
      } else if (error.message.includes("invalid_user")) {
        logger.error("Username not found.");
      }

      // ثبت خطا در دیتابیس
      if (this.activeAccount) {
        await this.activeAccount.recordError(`Login error: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * ذخیره سشن به دیتابیس
   */
  async saveSession() {
    try {
      if (!this.ig || !this.activeAccount) return false;

      const serialized = await this.ig.state.serialize();

      // ذخیره سشن در دیتابیس
      this.activeAccount.sessionData = JSON.stringify(serialized);
      await this.activeAccount.save();

      logger.info("Instagram session saved to database");
      return true;
    } catch (error) {
      logger.error(`Error saving session: ${error.message}`);
      return false;
    }
  }

  /**
   * بارگذاری سشن از دیتابیس
   */
  async loadSession() {
    try {
      if (!this.ig || !this.activeAccount) return false;

      // بررسی آیا اطلاعات سشن وجود دارد
      if (!this.activeAccount.sessionData) {
        logger.info("No saved session found");
        return false;
      }

      // بارگذاری اطلاعات سشن
      const sessionData = JSON.parse(this.activeAccount.sessionData);
      await this.ig.state.deserialize(sessionData);

      logger.info("Instagram session loaded from database");
      return true;
    } catch (error) {
      logger.error(`Error loading session: ${error.message}`);
      return false;
    }
  }

  /**
   * لاگ‌اوت از اکانت اینستاگرام
   */
  async logout() {
    try {
      if (!this.ig || !this.isLoggedIn) {
        logger.info("Not logged in, nothing to logout from");
        return true;
      }

      // لاگ‌اوت از اینستاگرام
      await this.ig.account.logout();

      logger.info("Successfully logged out from Instagram");
      this.isLoggedIn = false;

      return true;
    } catch (error) {
      logger.error(`Error logging out: ${error.message}`);
      return false;
    }
  }

  /**
   * بررسی وضعیت اکانت
   */
  async checkAccountStatus() {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت اطلاعات کاربر فعلی
      const accountInfo = await this.ig.account.currentUser();

      // دریافت آمار و اطلاعات بیشتر
      const accountDetails = await this.ig.user.info(accountInfo.pk);

      // دریافت اطلاعات پست‌ها
      const userFeed = await this.ig.feed.user(accountInfo.pk);
      const posts = await userFeed.items();

      // دریافت تعداد فالوورها و فالوینگ‌ها
      const followerCount = accountDetails.follower_count;
      const followingCount = accountDetails.following_count;

      // بررسی محدودیت‌ها
      const inboxFeed = await this.ig.feed.directInbox().items();

      const accountStatus = {
        username: accountInfo.username,
        fullName: accountInfo.full_name,
        profilePicUrl: accountDetails.profile_pic_url,
        bio: accountDetails.biography,
        postsCount: accountDetails.media_count,
        followersCount: followerCount,
        followingCount: followingCount,
        isPrivate: accountDetails.is_private,
        isVerified: accountDetails.is_verified,
        lastLogin: this.lastLogin,
        recentPosts: posts.slice(0, 5).map((post) => ({
          id: post.id,
          code: post.code,
          likeCount: post.like_count,
          commentCount: post.comment_count,
          caption: post.caption ? post.caption.text : "",
          timestamp: new Date(post.taken_at * 1000),
        })),
        messageRequests: inboxFeed.filter((thread) => thread.pending).length,
        unreadMessages: inboxFeed.filter((thread) => !thread.seen).length,
      };

      // به‌روزرسانی اطلاعات اکانت در دیتابیس
      if (this.activeAccount) {
        this.activeAccount.lastLogin = new Date();
        await this.activeAccount.save();
      }

      return {
        success: true,
        status: accountStatus,
      };
    } catch (error) {
      logger.error(`Error checking account status: ${error.message}`);

      // بررسی آیا خطای سشن منقضی شده است
      if (error.message.includes("login_required")) {
        this.isLoggedIn = false;

        // تلاش مجدد برای لاگین
        if (this.activeAccount) {
          try {
            await this.login(
              this.activeAccount.username,
              this.activeAccount.password
            );
            // تلاش مجدد برای بررسی وضعیت
            return await this.checkAccountStatus();
          } catch (loginError) {
            logger.error(`Re-login failed: ${loginError.message}`);
          }
        }
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * آپلود عکس پروفایل جدید
   */
  async changeProfilePicture(imagePath) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // خواندن فایل تصویر
      const imageBuffer = await fs.readFile(imagePath);

      // آپلود عکس پروفایل
      await this.ig.account.changeProfilePicture(imageBuffer);

      logger.info("Profile picture changed successfully");

      return {
        success: true,
        message: "Profile picture changed successfully",
      };
    } catch (error) {
      logger.error(`Error changing profile picture: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * به‌روزرسانی بیو پروفایل
   */
  async updateBio(biography) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // به‌روزرسانی بیو
      await this.ig.account.setBiography(biography);

      logger.info("Biography updated successfully");

      return {
        success: true,
        message: "Biography updated successfully",
      };
    } catch (error) {
      logger.error(`Error updating biography: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * مدیریت درخواست‌های پیام
   */
  async manageMessageRequests(action = "accept") {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت صندوق ورودی
      const inboxFeed = await this.ig.feed.directInbox();
      const inbox = await inboxFeed.items();

      // پیدا کردن درخواست‌های پیام
      const pendingThreads = inbox.filter((thread) => thread.pending);

      logger.info(`Found ${pendingThreads.length} pending message requests`);

      let processedCount = 0;

      // پردازش هر درخواست
      for (const thread of pendingThreads) {
        if (action === "accept") {
          // پذیرش درخواست
          await this.ig.directThread.approve(thread.thread_id);
          logger.info(
            `Accepted message request from ${thread.users[0].username}`
          );
        } else if (action === "decline") {
          // رد درخواست
          await this.ig.directThread.decline(thread.thread_id);
          logger.info(
            `Declined message request from ${thread.users[0].username}`
          );
        }

        processedCount++;
      }

      return {
        success: true,
        message: `${processedCount} message requests ${action}ed`,
        processedCount,
      };
    } catch (error) {
      logger.error(`Error managing message requests: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * پاکسازی صندوق ورودی دایرکت
   */
  async cleanupInbox() {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت صندوق ورودی
      const inboxFeed = await this.ig.feed.directInbox();
      const inbox = await inboxFeed.items();

      logger.info(`Found ${inbox.length} threads in inbox`);

      let cleanedCount = 0;

      // پاکسازی گفتگوهای قدیمی (بیش از 30 روز)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      for (const thread of inbox) {
        // بررسی زمان آخرین پیام
        if (thread.last_activity_at < thirtyDaysAgo / 1000) {
          // پاک کردن گفتگو
          await this.ig.directThread.hide(thread.thread_id);
          cleanedCount++;
          logger.info(`Cleaned up thread with ${thread.users[0].username}`);
        }
      }

      return {
        success: true,
        message: `Cleaned up ${cleanedCount} old conversations`,
        cleanedCount,
      };
    } catch (error) {
      logger.error(`Error cleaning up inbox: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * جستجوی کاربران در اینستاگرام
   */
  async searchUsers(query, limit = 20) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // جستجوی کاربران
      const result = await this.ig.search.users(query);

      // محدود کردن نتایج
      const users = result.slice(0, limit).map((user) => ({
        userId: user.pk,
        username: user.username,
        fullName: user.full_name,
        isPrivate: user.is_private,
        profilePicUrl: user.profile_pic_url,
      }));

      return {
        success: true,
        users,
      };
    } catch (error) {
      logger.error(`Error searching users: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * دریافت اطلاعات پست
   */
  async getMediaInfo(mediaId) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت اطلاعات پست
      const mediaInfo = await this.ig.media.info(mediaId);

      if (!mediaInfo.items || mediaInfo.items.length === 0) {
        throw new Error("Media not found");
      }

      const media = mediaInfo.items[0];

      // اطلاعات پست
      const mediaData = {
        id: media.id,
        code: media.code,
        userId: media.user.pk,
        username: media.user.username,
        caption: media.caption ? media.caption.text : "",
        likeCount: media.like_count,
        commentCount: media.comment_count,
        takenAt: new Date(media.taken_at * 1000),
        isVideo: media.media_type === 2,
        imageUrl: media.image_versions2.candidates[0].url,
        locationName: media.location ? media.location.name : null,
      };

      return {
        success: true,
        media: mediaData,
      };
    } catch (error) {
      logger.error(`Error getting media info: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * دریافت کامنت‌های یک پست
   */
  async getMediaComments(mediaId, limit = 50) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت کامنت‌ها
      const commentsResponse = await this.ig.feed
        .mediaComments(mediaId)
        .items();

      // محدود کردن تعداد کامنت‌ها
      const comments = commentsResponse.slice(0, limit).map((comment) => ({
        id: comment.pk,
        userId: comment.user_id,
        username: comment.user.username,
        text: comment.text,
        createdAt: new Date(comment.created_at * 1000),
      }));

      return {
        success: true,
        comments,
      };
    } catch (error) {
      logger.error(`Error getting media comments: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * پاسخ به یک کامنت
   */
  async replyToComment(mediaId, commentId, text) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // پاسخ به کامنت
      const result = await this.ig.media.commentReply({
        mediaId,
        commentId,
        text,
      });

      logger.info(`Replied to comment ${commentId} on media ${mediaId}`);

      return {
        success: true,
        commentId: result.id,
      };
    } catch (error) {
      logger.error(`Error replying to comment: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * حذف یک کامنت
   */
  async deleteComment(mediaId, commentId) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // حذف کامنت
      const result = await this.ig.media.deleteComment({
        mediaId,
        commentId,
      });

      logger.info(`Deleted comment ${commentId} from media ${mediaId}`);

      return {
        success: true,
        status: result.status,
      };
    } catch (error) {
      logger.error(`Error deleting comment: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * دریافت لیست فالوورهای اخیر
   */
  async getRecentFollowers(limit = 20) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت اطلاعات کاربر فعلی
      const currentUser = await this.ig.account.currentUser();

      // دریافت لیست فالوورها
      const followersFeed = this.ig.feed.accountFollowers(currentUser.pk);
      const followers = await followersFeed.items();

      // محدود کردن تعداد فالوورها
      const recentFollowers = followers.slice(0, limit).map((follower) => ({
        userId: follower.pk,
        username: follower.username,
        fullName: follower.full_name,
        isPrivate: follower.is_private,
        profilePicUrl: follower.profile_pic_url,
      }));

      return {
        success: true,
        followers: recentFollowers,
      };
    } catch (error) {
      logger.error(`Error getting recent followers: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ارسال پیام به چندین کاربر
   */
  async sendBulkMessage(userIds, message) {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت تنظیمات
      const settings = await Setting.getActiveSettings();

      // بررسی محدودیت تعداد پیام
      const maxMessages = settings.limits.dailyDirectMessages;

      if (userIds.length > maxMessages) {
        logger.warn(
          `Limiting bulk message to ${maxMessages} users (out of ${userIds.length} requested)`
        );
        userIds = userIds.slice(0, maxMessages);
      }

      const results = [];

      // ارسال پیام به هر کاربر
      for (const userId of userIds) {
        try {
          // ایجاد یا دریافت گفتگو
          const thread = this.ig.entity.directThread([userId.toString()]);

          // ارسال پیام
          const result = await thread.broadcastText(message);

          results.push({
            userId,
            success: true,
            threadId: result.thread_id,
          });

          logger.info(`Sent message to user ID ${userId}`);

          // تاخیر برای جلوگیری از محدودیت
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 + Math.random() * 3000)
          );
        } catch (sendError) {
          logger.error(
            `Error sending message to user ID ${userId}: ${sendError.message}`
          );

          results.push({
            userId,
            success: false,
            error: sendError.message,
          });
        }
      }

      return {
        success: true,
        results,
        successCount: results.filter((r) => r.success).length,
        failCount: results.filter((r) => !r.success).length,
      };
    } catch (error) {
      logger.error(`Error sending bulk message: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * بررسی وضعیت سلامت اکانت
   */
  async checkAccountHealth() {
    try {
      if (!this.ig || !this.isLoggedIn) {
        throw new Error("Not logged in");
      }

      // دریافت اطلاعات کاربر فعلی
      const currentUser = await this.ig.account.currentUser();

      // بررسی وضعیت اکانت
      const accountInfo = await this.ig.user.info(currentUser.pk);

      // بررسی محدودیت‌ها
      const accountHasRestrictions =
        accountInfo.has_anonymous_profile_picture ||
        accountInfo.is_spam ||
        accountInfo.is_hidden_from_viewers ||
        (accountInfo.account_badges &&
          accountInfo.account_badges.includes("restriction"));

      const healthStatus = {
        userId: currentUser.pk,
        username: currentUser.username,
        accountAge: this.activeAccount
          ? Math.floor(
              (Date.now() - new Date(this.activeAccount.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
        isVerified: accountInfo.is_verified,
        isBusinessAccount: accountInfo.is_business,
        mediaCount: accountInfo.media_count,
        followerCount: accountInfo.follower_count,
        followingCount: accountInfo.following_count,
        hasRestrictions: accountHasRestrictions,
        isTemporarilyLocked: false, // نیاز به روش دیگری برای تشخیص دارد
        inGoodStanding: !accountHasRestrictions,
        healthScore: accountHasRestrictions ? 50 : 90, // امتیاز تخمینی سلامت اکانت
      };

      return {
        success: true,
        health: healthStatus,
      };
    } catch (error) {
      logger.error(`Error checking account health: ${error.message}`);

      // بررسی خطاهای خاص مربوط به محدودیت
      const isRestricted =
        error.message.includes("checkpoint") ||
        error.message.includes("challenge") ||
        error.message.includes("feedback_required") ||
        error.message.includes("login_required");

      return {
        success: false,
        error: error.message,
        health: {
          hasRestrictions: isRestricted,
          isTemporarilyLocked: error.message.includes("checkpoint"),
          inGoodStanding: false,
          healthScore: 30, // امتیاز پایین در صورت خطا
        },
      };
    }
  }
}

module.exports = new InstagramService();
