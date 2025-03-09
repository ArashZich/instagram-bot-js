const Account = require("../../models/account");
const Interaction = require("../../models/interaction");
const Follow = require("../../models/follow");
const Trend = require("../../models/trend");
const logger = require("../../config/logger");

/**
 * دریافت آمار کلی اکانت
 */
exports.getAccountStats = async (req, res) => {
  try {
    // دریافت اکانت فعال
    const account = await Account.findOne({ isActive: true });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No active account found",
      });
    }

    // دریافت تاریخ امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // دریافت تاریخ یک هفته پیش
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // دریافت تاریخ یک ماه پیش
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // دریافت آمار تعاملات روزانه
    const dailyStats = account.dailyStats;

    // دریافت تعداد تعاملات هفتگی
    const weeklyInteractions = await Interaction.countDocuments({
      botAccount: account._id,
      createdAt: { $gte: oneWeekAgo },
    });

    // دریافت تعداد تعاملات ماهانه
    const monthlyInteractions = await Interaction.countDocuments({
      botAccount: account._id,
      createdAt: { $gte: oneMonthAgo },
    });

    // دریافت تعداد فالوهای فعال
    const activeFollows = await Follow.countDocuments({
      botAccount: account._id,
      status: "following",
    });

    // دریافت تعداد فالوبک‌ها
    const followBacks = await Follow.countDocuments({
      botAccount: account._id,
      didFollowBack: true,
    });

    // محاسبه نرخ فالوبک
    const followBackRate =
      activeFollows > 0 ? ((followBacks / activeFollows) * 100).toFixed(2) : 0;

    // ارسال پاسخ
    res.status(200).json({
      success: true,
      stats: {
        daily: {
          likes: dailyStats.likes,
          comments: dailyStats.comments,
          directMessages: dailyStats.directMessages,
          follows: dailyStats.follows,
          unfollows: dailyStats.unfollows,
          storyViews: dailyStats.storyViews,
          total:
            dailyStats.likes +
            dailyStats.comments +
            dailyStats.directMessages +
            dailyStats.follows +
            dailyStats.unfollows +
            dailyStats.storyViews,
        },
        weekly: {
          interactions: weeklyInteractions,
        },
        monthly: {
          interactions: monthlyInteractions,
        },
        follows: {
          active: activeFollows,
          followBacks,
          followBackRate: parseFloat(followBackRate),
        },
        lastLogin: account.lastLogin,
      },
    });
  } catch (error) {
    logger.error(`Error getting account stats: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error retrieving account statistics",
      error: error.message,
    });
  }
};

/**
 * دریافت آمار تعاملات بر اساس تاریخ
 */
exports.getInteractionStats = async (req, res) => {
  try {
    // دریافت پارامترهای تاریخ
    const { startDate, endDate } = req.query;

    // تبدیل تاریخ‌ها
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();

    // دریافت اکانت فعال
    const account = await Account.findOne({ isActive: true });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No active account found",
      });
    }

    // دریافت آمار تعاملات
    const stats = await Interaction.aggregate([
      {
        $match: {
          botAccount: account._id,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$interactionType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          interactions: {
            $push: {
              type: "$_id.type",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // تبدیل داده‌ها به فرمت مناسب
    const formattedStats = stats.map((day) => {
      const interactionsByType = {};

      day.interactions.forEach((interaction) => {
        interactionsByType[interaction.type] = interaction.count;
      });

      return {
        date: day._id,
        total: day.totalCount,
        like: interactionsByType.like || 0,
        comment: interactionsByType.comment || 0,
        follow: interactionsByType.follow || 0,
        unfollow: interactionsByType.unfollow || 0,
        direct: interactionsByType.direct || 0,
        view: interactionsByType.view || 0,
      };
    });

    // ارسال پاسخ
    res.status(200).json({
      success: true,
      startDate: start,
      endDate: end,
      stats: formattedStats,
    });
  } catch (error) {
    logger.error(`Error getting interaction stats: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error retrieving interaction statistics",
      error: error.message,
    });
  }
};

/**
 * دریافت آمار ترندها
 */
exports.getTrendStats = async (req, res) => {
  try {
    // دریافت پارامترهای دسته‌بندی
    const { category, limit } = req.query;

    // تعیین محدودیت
    const queryLimit = limit ? parseInt(limit) : 10;

    // دریافت ترندهای فعال
    const trends = await Trend.find(
      category ? { category, isActive: true } : { isActive: true }
    )
      .sort({ engagementScore: -1 })
      .limit(queryLimit);

    // تبدیل داده‌ها به فرمت مناسب
    const formattedTrends = trends.map((trend) => ({
      id: trend._id,
      keyword: trend.keyword,
      hashtag: trend.hashtag,
      category: trend.category,
      postCount: trend.postCount,
      engagementScore: trend.engagementScore,
      lastFetchDate: trend.lastFetchDate,
      relatedHashtags: trend.relatedHashtags.slice(0, 5),
    }));

    // دریافت دسته‌بندی‌های موجود
    const categories = await Trend.distinct("category", { isActive: true });

    // ارسال پاسخ
    res.status(200).json({
      success: true,
      trends: formattedTrends,
      categories,
    });
  } catch (error) {
    logger.error(`Error getting trend stats: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error retrieving trend statistics",
      error: error.message,
    });
  }
};

/**
 * دریافت آمار فالو
 */
exports.getFollowStats = async (req, res) => {
  try {
    // دریافت پارامترهای تاریخ
    const { startDate, endDate } = req.query;

    // تبدیل تاریخ‌ها
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // دریافت اکانت فعال
    const account = await Account.findOne({ isActive: true });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No active account found",
      });
    }

    // دریافت آمار فالو
    const followStats = await Follow.aggregate([
      {
        $match: {
          botAccount: account._id,
          followedAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$followedAt" } },
          follows: { $sum: 1 },
          followBacks: {
            $sum: { $cond: [{ $eq: ["$didFollowBack", true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // دریافت آمار آنفالو
    const unfollowStats = await Follow.aggregate([
      {
        $match: {
          botAccount: account._id,
          unfollowedAt: { $ne: null, $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$unfollowedAt" } },
          unfollows: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // ترکیب داده‌ها
    const combinedStats = {};

    // اضافه کردن آمار فالو
    followStats.forEach((stat) => {
      combinedStats[stat._id] = {
        date: stat._id,
        follows: stat.follows,
        followBacks: stat.followBacks,
        unfollows: 0,
      };
    });

    // اضافه کردن آمار آنفالو
    unfollowStats.forEach((stat) => {
      if (combinedStats[stat._id]) {
        combinedStats[stat._id].unfollows = stat.unfollows;
      } else {
        combinedStats[stat._id] = {
          date: stat._id,
          follows: 0,
          followBacks: 0,
          unfollows: stat.unfollows,
        };
      }
    });

    // تبدیل به آرایه و مرتب‌سازی بر اساس تاریخ
    const formattedStats = Object.values(combinedStats).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // دریافت آمار کلی
    const totalFollowing = await Follow.countDocuments({
      botAccount: account._id,
      status: "following",
    });

    const totalFollowBacks = await Follow.countDocuments({
      botAccount: account._id,
      didFollowBack: true,
    });

    const followBackRate =
      totalFollowing > 0
        ? ((totalFollowBacks / totalFollowing) * 100).toFixed(2)
        : 0;

    // ارسال پاسخ
    res.status(200).json({
      success: true,
      startDate: start,
      endDate: end,
      stats: formattedStats,
      summary: {
        totalFollowing,
        totalFollowBacks,
        followBackRate: parseFloat(followBackRate),
      },
    });
  } catch (error) {
    logger.error(`Error getting follow stats: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error retrieving follow statistics",
      error: error.message,
    });
  }
};

/**
 * دریافت کاربرانی که بیشترین تعامل را داشته‌اند
 */
exports.getTopEngagedUsers = async (req, res) => {
  try {
    // دریافت پارامترها
    const { limit } = req.query;

    // تعیین محدودیت
    const queryLimit = limit ? parseInt(limit) : 10;

    // دریافت اکانت فعال
    const account = await Account.findOne({ isActive: true });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No active account found",
      });
    }

    // دریافت کاربرانی که بیشترین تعامل را داشته‌اند
    const topUsers = await Interaction.aggregate([
      {
        $match: {
          botAccount: account._id,
          successful: true,
        },
      },
      {
        $group: {
          _id: "$targetUserId",
          username: { $first: "$targetUsername" },
          interactionCount: { $sum: 1 },
          interactionTypes: { $addToSet: "$interactionType" },
          lastInteraction: { $max: "$createdAt" },
        },
      },
      {
        $sort: { interactionCount: -1 },
      },
      {
        $limit: queryLimit,
      },
    ]);

    // بررسی وضعیت فالو برای هر کاربر
    const enrichedUsers = await Promise.all(
      topUsers.map(async (user) => {
        const follow = await Follow.findOne({
          botAccount: account._id,
          targetUserId: user._id,
        });

        return {
          userId: user._id,
          username: user.username,
          interactionCount: user.interactionCount,
          interactionTypes: user.interactionTypes,
          lastInteraction: user.lastInteraction,
          isFollowing: follow ? follow.status === "following" : false,
          didFollowBack: follow ? follow.didFollowBack : false,
        };
      })
    );

    // ارسال پاسخ
    res.status(200).json({
      success: true,
      users: enrichedUsers,
    });
  } catch (error) {
    logger.error(`Error getting top engaged users: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error retrieving top engaged users",
      error: error.message,
    });
  }
};
