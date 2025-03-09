const Trend = require("../models/trend");
const Account = require("../models/account");
const logger = require("../config/logger");
const humanizer = require("../utils/humanizer");

class TrendService {
  constructor() {
    // این متغیر به صورت گلوبال در instagram.js قرار داده شده است
    this.ig = global.ig;

    // موضوعات ترند فارسی برای جستجو
    this.trendTopics = [
      // سبک زندگی و عمومی
      {
        keyword: "طبیعت گردی",
        hashtags: ["طبیعت_ایران", "طبیعت_گردی", "ایرانگردی"],
      },
      { keyword: "سفر", hashtags: ["سفر", "گردشگری", "ایران_زیبا", "سفرنامه"] },
      {
        keyword: "کافه گردی",
        hashtags: ["کافه_گردی", "کافه", "قهوه", "لاته_آرت"],
      },
      {
        keyword: "زندگی روزمره",
        hashtags: ["زندگی", "لایف_استایل", "روزمرگی"],
      },

      // غذا و آشپزی
      {
        keyword: "آشپزی",
        hashtags: ["آشپزی_ایرانی", "دستپخت", "آشپزباشی", "غذای_خانگی"],
      },
      {
        keyword: "شیرینی پزی",
        hashtags: ["شیرینی_خانگی", "دسر", "کیک_خانگی", "شیرینی_پزی"],
      },
      {
        keyword: "غذای سالم",
        hashtags: ["غذای_سالم", "سالم_خوری", "وگان", "گیاهخواری"],
      },

      // هنر و طراحی
      {
        keyword: "هنر",
        hashtags: ["هنرمندان_ایرانی", "هنر_مدرن", "گالری", "نمایشگاه_هنری"],
      },
      {
        keyword: "صنایع دستی",
        hashtags: ["صنایع_دستی", "هنر_دستی", "هنر_ایرانی", "سنتی"],
      },
      {
        keyword: "خوشنویسی",
        hashtags: ["خوشنویسی", "خطاطی", "تایپوگرافی", "نستعلیق"],
      },
      {
        keyword: "طراحی",
        hashtags: ["طراحی_گرافیک", "گرافیک_دیزاین", "طراحی_لوگو", "پوستر"],
      },

      // موسیقی
      {
        keyword: "موسیقی سنتی",
        hashtags: ["موسیقی_سنتی", "موسیقی_ایرانی", "سنتور", "موسیقی_اصیل"],
      },
      {
        keyword: "موسیقی",
        hashtags: ["موسیقی", "موزیک", "خواننده", "آهنگساز"],
      },
      { keyword: "ساز", hashtags: ["نوازنده", "پیانو", "گیتار", "ویولن"] },

      // مد و زیبایی
      { keyword: "مد", hashtags: ["استایل", "فشن", "مد_روز", "استایل_ایرانی"] },
      { keyword: "آرایش", hashtags: ["میکاپ", "آرایش", "زیبایی", "بیوتی"] },
      {
        keyword: "مدل مو",
        hashtags: ["مدل_مو", "هیرکات", "آرایشگاه", "رنگ_مو"],
      },

      // ورزش و سلامتی
      {
        keyword: "یوگا",
        hashtags: ["یوگا", "مدیتیشن", "تمرین_در_خانه", "یوگا_درمانی"],
      },
      {
        keyword: "بدنسازی",
        hashtags: ["فیتنس", "بدنسازی", "تناسب_اندام", "باشگاه"],
      },
      {
        keyword: "طب سنتی",
        hashtags: ["طب_سنتی", "گیاهان_دارویی", "درمان_طبیعی", "سلامتی"],
      },

      // تکنولوژی و دیجیتال
      {
        keyword: "برنامه نویسی",
        hashtags: ["برنامه_نویسی", "کدنویسی", "توسعه_وب", "طراحی_سایت"],
      },
      {
        keyword: "بازی",
        hashtags: ["گیمر", "بازی_کامپیوتری", "گیمینگ", "پلی_استیشن"],
      },
      {
        keyword: "موبایل",
        hashtags: ["گوشی_هوشمند", "اندروید", "آیفون", "تکنولوژی"],
      },

      // کتاب و فرهنگ
      {
        keyword: "کتاب",
        hashtags: ["کتابخوان", "کتاب_خوب", "کتابخانه", "رمان"],
      },
      { keyword: "شعر", hashtags: ["شاعر", "شعر_فارسی", "شعر_نو", "ادبیات"] },
      {
        keyword: "فیلم",
        hashtags: ["سینما", "فیلم_ایرانی", "سینمای_ایران", "بازیگر"],
      },

      // خانه و دکوراسیون
      {
        keyword: "دکوراسیون",
        hashtags: ["دکوراسیون_داخلی", "چیدمان", "دیزاین_خانه", "دکور"],
      },
      {
        keyword: "گیاهان آپارتمانی",
        hashtags: ["گیاهان_آپارتمانی", "گل_و_گیاه", "ساکولنت", "کاکتوس"],
      },
      {
        keyword: "مینیمال",
        hashtags: ["مینیمال", "ساده_زیستی", "طراحی_مینیمال", "سادگی"],
      },
    ];
  }

  /**
   * دریافت هشتگ‌های ترند از دیتابیس یا ایجاد مجموعه پیش‌فرض
   */
  async getTrendingHashtags(limit = 5, category = null) {
    try {
      // ابتدا تلاش کنید تا روندهای موجود در پایگاه داده را دریافت کنید
      const trends = await Trend.getActiveTrends(limit, category);

      // اگر ترندی در دیتابیس یافت نشد، از موارد پیش‌فرض استفاده کنید
      if (trends.length === 0) {
        logger.info("No trends found in database, initializing default trends");
        await this.initializeDefaultTrends();
        return Trend.getActiveTrends(limit, category);
      }

      return trends;
    } catch (error) {
      logger.error(`Error fetching trending hashtags: ${error.message}`);
      throw error;
    }
  }

  /**
   * ذخیره ترندهای پیش‌فرض در دیتابیس
   */
  async initializeDefaultTrends() {
    try {
      // بررسی کنید آیا قبلاً ترند‌هایی در دیتابیس وجود دارد
      const existingTrends = await Trend.countDocuments();

      if (existingTrends > 0) {
        logger.info(`${existingTrends} trends already exist in database`);
        return;
      }

      // ایجاد ترندهای پیش‌فرض
      for (const defaultTrend of Trend.defaultTrends) {
        await Trend.create(defaultTrend);
      }

      logger.info(`Initialized ${Trend.defaultTrends.length} default trends`);
    } catch (error) {
      logger.error(`Error initializing default trends: ${error.message}`);
      throw error;
    }
  }

  /**
   * جستجوی هشتگ‌های مرتبط با یک موضوع
   */
  async searchRelatedHashtags(hashtag) {
    try {
      logger.info(`Searching for hashtags related to: ${hashtag}`);

      // جستجوی تگ در اینستاگرام
      const result = await this.ig.feed.tags(hashtag).items();

      if (!result || result.length === 0) {
        logger.info(`No posts found for hashtag: ${hashtag}`);
        return [];
      }

      // استخراج هشتگ‌های مرتبط از کپشن‌های پست‌ها
      const relatedHashtags = new Set();

      for (const post of result.slice(0, 10)) {
        if (post.caption && post.caption.text) {
          const caption = post.caption.text;
          const hashtagRegex = /#([\u0600-\u06FFa-zA-Z0-9_]+)/g;
          const matches = caption.match(hashtagRegex);

          if (matches) {
            matches.forEach((tag) => {
              const cleanTag = tag.substring(1); // حذف # از ابتدای هشتگ
              if (cleanTag !== hashtag && cleanTag.length > 1) {
                relatedHashtags.add(cleanTag);
              }
            });
          }
        }
      }

      logger.info(
        `Found ${relatedHashtags.size} related hashtags for: ${hashtag}`
      );
      return Array.from(relatedHashtags);
    } catch (error) {
      logger.error(
        `Error searching related hashtags for ${hashtag}: ${error.message}`
      );
      return [];
    }
  }

  /**
   * بروزرسانی وضعیت هشتگ‌های ترند
   */
  async updateTrendStats(trendId) {
    try {
      const trend = await Trend.findById(trendId);

      if (!trend) {
        throw new Error(`Trend with ID ${trendId} not found`);
      }

      // دریافت پست‌های اخیر با این هشتگ
      const posts = await this.ig.feed.tags(trend.hashtag).items();

      if (!posts || posts.length === 0) {
        logger.info(`No recent posts found for hashtag: ${trend.hashtag}`);
        return false;
      }

      // محاسبه امتیاز درگیری بر اساس تعداد پست‌ها و لایک‌ها و کامنت‌ها
      let totalEngagement = 0;
      let postCount = posts.length;

      // پیدا کردن نمونه‌های با بیشترین تعامل
      const samplePosts = [];

      for (const post of posts.slice(0, 20)) {
        const likes = post.like_count || 0;
        const comments = post.comment_count || 0;
        const engagement = likes + comments * 2; // کامنت‌ها ارزش بیشتری دارند

        totalEngagement += engagement;

        // اضافه کردن به نمونه‌های برتر
        if (
          samplePosts.length < 5 ||
          engagement > samplePosts[samplePosts.length - 1].engagementRate
        ) {
          const engagementRate = engagement;

          samplePosts.push({
            postId: post.id,
            postUrl: `https://www.instagram.com/p/${post.code}/`,
            engagementRate,
            likesCount: likes,
            commentsCount: comments,
          });

          // مرتب‌سازی بر اساس میزان تعامل
          samplePosts.sort((a, b) => b.engagementRate - a.engagementRate);

          // فقط 5 نمونه برتر را نگه دارید
          if (samplePosts.length > 5) {
            samplePosts.pop();
          }
        }
      }

      // بروزرسانی هشتگ‌های مرتبط
      const relatedHashtags = await this.searchRelatedHashtags(trend.hashtag);

      // بروزرسانی آمار ترند
      const engagementScore = totalEngagement / postCount;
      await trend.updateStats(postCount, engagementScore);

      // بروزرسانی هشتگ‌های مرتبط و نمونه‌های برتر
      trend.relatedHashtags = relatedHashtags.slice(0, 10);
      trend.samplePosts = samplePosts;
      trend.lastFetchDate = new Date();
      await trend.save();

      logger.info(`Updated stats for trend: ${trend.hashtag}`);
      return true;
    } catch (error) {
      logger.error(`Error updating trend stats: ${error.message}`);
      return false;
    }
  }

  /**
   * جستجوی کاربران فعال در یک هشتگ ترند
   */
  async findActiveUsersInTrend(hashtag, limit = 20) {
    try {
      logger.info(`Finding active users in hashtag: ${hashtag}`);

      // دریافت پست‌های اخیر با این هشتگ
      const posts = await this.ig.feed.tags(hashtag).items();

      if (!posts || posts.length === 0) {
        logger.info(`No posts found for hashtag: ${hashtag}`);
        return [];
      }

      // گردآوری کاربران منحصر به فرد
      const uniqueUsers = new Map();

      for (const post of posts) {
        if (post.user && post.user.pk && post.user.username) {
          // محاسبه امتیاز درگیری برای پست
          const likes = post.like_count || 0;
          const comments = post.comment_count || 0;
          const engagement = likes + comments * 2;

          // اگر کاربر قبلاً دیده شده، امتیاز درگیری را به‌روز کنید
          if (uniqueUsers.has(post.user.pk)) {
            const user = uniqueUsers.get(post.user.pk);
            user.engagement += engagement;
            user.postCount += 1;
          } else {
            // کاربر جدید را اضافه کنید
            uniqueUsers.set(post.user.pk, {
              userId: post.user.pk,
              username: post.user.username,
              fullName: post.user.full_name || "",
              isPrivate: post.user.is_private || false,
              engagement,
              postCount: 1,
              samplePost: {
                mediaId: post.id,
                code: post.code,
              },
            });
          }
        }
      }

      // تبدیل به آرایه و مرتب‌سازی بر اساس تعامل
      const users = Array.from(uniqueUsers.values());
      users.sort((a, b) => b.engagement - a.engagement);

      // فیلتر کردن کاربران خصوصی (مگر اینکه آنها را دنبال کنیم)
      const filteredUsers = users.filter((user) => !user.isPrivate);

      return filteredUsers.slice(0, limit);
    } catch (error) {
      logger.error(
        `Error finding active users in trend ${hashtag}: ${error.message}`
      );
      return [];
    }
  }

  /**
   * یافتن و افزودن ترندهای جدید به دیتابیس
   */
  async discoverNewTrends() {
    try {
      logger.info("Discovering new trends");

      // استفاده از موضوعات از پیش تعریف شده برای جستجو
      const randomTopics = [...this.trendTopics]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

      let newTrendsFound = 0;

      for (const topic of randomTopics) {
        logger.info(`Exploring topic: ${topic.keyword}`);

        // انتخاب یک هشتگ تصادفی از این موضوع
        const randomHashtag =
          topic.hashtags[Math.floor(Math.random() * topic.hashtags.length)];

        // جستجوی هشتگ‌های مرتبط
        const relatedHashtags = await this.searchRelatedHashtags(randomHashtag);

        // بررسی هر هشتگ مرتبط
        for (const tag of relatedHashtags.slice(0, 3)) {
          // بررسی آیا این هشتگ قبلاً در سیستم وجود دارد
          const existingTrend = await Trend.findOne({ hashtag: tag });

          if (!existingTrend) {
            // دریافت پست‌ها برای ارزیابی محبوبیت
            const posts = await this.ig.feed.tags(tag).items();

            if (posts && posts.length > 10) {
              // محاسبه امتیاز درگیری
              let totalEngagement = 0;

              for (const post of posts.slice(0, 20)) {
                const likes = post.like_count || 0;
                const comments = post.comment_count || 0;
                totalEngagement += likes + comments * 2;
              }

              const engagementScore =
                totalEngagement / Math.min(posts.length, 20);

              // اگر امتیاز درگیری بالاتر از آستانه است، آن را به عنوان یک ترند جدید اضافه کنید
              if (engagementScore > 50) {
                await Trend.create({
                  keyword: topic.keyword,
                  hashtag: tag,
                  category: this.getCategoryForTopic(topic.keyword),
                  language: "fa",
                  postCount: posts.length,
                  engagementScore,
                  relatedHashtags: relatedHashtags.slice(0, 5),
                  description: `ترند مرتبط با ${topic.keyword}`,
                  discoveredAt: new Date(),
                });

                logger.info(
                  `Added new trend: ${tag} with engagement score: ${engagementScore}`
                );
                newTrendsFound++;
              }
            }
          } else {
            // اگر ترند موجود است، فقط آمار آن را به‌روزرسانی کنید
            await this.updateTrendStats(existingTrend._id);
          }

          // تاخیر بین درخواست‌ها برای جلوگیری از محدودیت‌های API
          await humanizer.simulateHumanDelay(3, 8);
        }
      }

      logger.info(`Discovered ${newTrendsFound} new trends`);
      return newTrendsFound;
    } catch (error) {
      logger.error(`Error discovering new trends: ${error.message}`);
      throw error;
    }
  }

  /**
   * تشخیص دسته‌بندی بر اساس موضوع
   */
  getCategoryForTopic(topic) {
    const categoryMapping = {
      "طبیعت گردی": "عمومی",
      سفر: "عمومی",
      "کافه گردی": "سرگرمی",
      "زندگی روزمره": "عمومی",
      آشپزی: "آشپزی",
      "شیرینی پزی": "آشپزی",
      "غذای سالم": "آشپزی",
      هنر: "هنری",
      "صنایع دستی": "هنری",
      خوشنویسی: "هنری",
      طراحی: "هنری",
      "موسیقی سنتی": "هنری",
      موسیقی: "هنری",
      ساز: "هنری",
      مد: "مد",
      آرایش: "مد",
      "مدل مو": "مد",
      یوگا: "سلامت",
      بدنسازی: "سلامت",
      "طب سنتی": "سلامت",
      "برنامه نویسی": "تکنولوژی",
      بازی: "تکنولوژی",
      موبایل: "تکنولوژی",
      کتاب: "فرهنگی",
      شعر: "فرهنگی",
      فیلم: "فرهنگی",
      دکوراسیون: "عمومی",
      "گیاهان آپارتمانی": "عمومی",
      مینیمال: "عمومی",
    };

    return categoryMapping[topic] || "عمومی";
  }

  /**
   * جستجوی کاربران فعال در چندین هشتگ ترند برای تعامل
   */
  async findUsersToInteract(limit = 20) {
    try {
      // دریافت ترندهای فعال از دیتابیس
      const trends = await this.getTrendingHashtags(5);

      if (trends.length === 0) {
        logger.info("No active trends found for finding users");
        return [];
      }

      const allUsers = [];

      // بررسی هر ترند
      for (const trend of trends) {
        // یافتن کاربران فعال در این هشتگ
        const users = await this.findActiveUsersInTrend(trend.hashtag, 10);

        // افزودن اطلاعات ترند به هر کاربر
        users.forEach((user) => {
          user.fromTrend = {
            trendId: trend._id,
            hashtag: trend.hashtag,
            keyword: trend.keyword,
            category: trend.category,
          };
        });

        allUsers.push(...users);

        // تاخیر بین درخواست‌ها
        await humanizer.simulateHumanDelay(5, 10);
      }

      // حذف تکرارها با حفظ نمونه با بالاترین امتیاز برای هر کاربر
      const uniqueUsers = allUsers.reduce((acc, current) => {
        const existingUser = acc.find((item) => item.userId === current.userId);

        if (!existingUser || current.engagement > existingUser.engagement) {
          if (existingUser) {
            // جایگزینی نمونه موجود با نمونه‌ای با امتیاز بالاتر
            const index = acc.findIndex(
              (item) => item.userId === current.userId
            );
            acc[index] = current;
          } else {
            // افزودن کاربر جدید
            acc.push(current);
          }
        }

        return acc;
      }, []);

      // مرتب‌سازی بر اساس امتیاز تعامل و محدود کردن به تعداد درخواستی
      uniqueUsers.sort((a, b) => b.engagement - a.engagement);

      logger.info(
        `Found ${uniqueUsers.length} unique users to interact with from trending hashtags`
      );
      return uniqueUsers.slice(0, limit);
    } catch (error) {
      logger.error(`Error finding users to interact: ${error.message}`);
      return [];
    }
  }

  /**
   * به‌روزرسانی همه ترندها
   */
  async updateAllTrends() {
    try {
      logger.info("Starting update of all trends");

      // دریافت همه ترندهای فعال
      const allTrends = await Trend.find({ isActive: true });

      logger.info(`Found ${allTrends.length} active trends to update`);

      let updatedCount = 0;

      for (const trend of allTrends) {
        // به‌روزرسانی هر ترند
        const success = await this.updateTrendStats(trend._id);

        if (success) {
          updatedCount++;
        }

        // تاخیر بین به‌روزرسانی‌ها
        await humanizer.simulateHumanDelay(5, 10);
      }

      // کشف ترندهای جدید
      const newTrendsCount = await this.discoverNewTrends();

      logger.info(
        `Updated ${updatedCount} existing trends and discovered ${newTrendsCount} new trends`
      );

      return {
        updatedCount,
        newTrendsCount,
        totalTrends: allTrends.length + newTrendsCount,
      };
    } catch (error) {
      logger.error(`Error updating all trends: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new TrendService();
