const logger = require("../config/logger");
const textGenerator = require("../utils/textGenerator");
const Trend = require("../models/trend");
const Setting = require("../models/setting");
const humanizer = require("../utils/humanizer");

class ContentService {
  constructor() {
    // این متغیر به صورت گلوبال در instagram.js قرار داده شده است
    this.ig = global.ig;

    // انواع محتوا
    this.contentTypes = [
      "طبیعت",
      "آشپزی",
      "هنر",
      "موسیقی",
      "عکاسی",
      "ورزش",
      "سفر",
      "مد",
      "تکنولوژی",
      "کتاب",
      "فیلم",
      "سبک زندگی",
    ];
  }

  /**
   * تولید محتوای مناسب برای یک هشتگ
   * @param {string} hashtag - هشتگ مورد نظر
   * @param {string} category - دسته‌بندی محتوا
   * @returns {string} - متن تولید شده
   */
  async generateContentForHashtag(hashtag, category = "عمومی") {
    try {
      logger.info(
        `Generating content for hashtag: ${hashtag}, category: ${category}`
      );

      // یافتن ترند مرتبط در دیتابیس
      const trend =
        (await Trend.findOne({ hashtag })) ||
        (await Trend.findOne({ relatedHashtags: hashtag }));

      let topic = "";
      let relatedHashtags = [];

      if (trend) {
        topic = trend.keyword || trend.hashtag;
        relatedHashtags = [...trend.relatedHashtags, trend.hashtag];
      } else {
        // اگر ترند در دیتابیس یافت نشد، خود هشتگ را استفاده کنید
        topic = hashtag;

        // یافتن هشتگ‌های مرتبط
        const relatedTags = await this.findRelatedHashtags(hashtag);
        relatedHashtags = [hashtag, ...relatedTags.slice(0, 5)];
      }

      // تولید کپشن
      const caption = textGenerator.generateCaption(topic, relatedHashtags);

      return {
        success: true,
        content: caption,
        hashtags: relatedHashtags,
        topic,
      };
    } catch (error) {
      logger.error(
        `Error generating content for hashtag ${hashtag}: ${error.message}`
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * یافتن هشتگ‌های مرتبط با یک هشتگ
   */
  async findRelatedHashtags(hashtag) {
    try {
      logger.info(`Finding related hashtags for: ${hashtag}`);

      // جستجوی هشتگ در اینستاگرام
      const result = await this.ig.feed.tags(hashtag).items();

      if (!result || result.length === 0) {
        logger.info(`No posts found for hashtag: ${hashtag}`);
        return [];
      }

      // استخراج هشتگ‌های مرتبط از کپشن‌های پست‌ها
      const relatedHashtags = new Set();

      for (const post of result.slice(0, 5)) {
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

      return Array.from(relatedHashtags);
    } catch (error) {
      logger.error(`Error finding related hashtags: ${error.message}`);
      return [];
    }
  }

  /**
   * انتخاب یک هشتگ تصادفی از ترندهای فعال
   */
  async getRandomTrendingHashtag() {
    try {
      // دریافت ترندهای فعال
      const trends = await Trend.getActiveTrends(10);

      if (trends.length === 0) {
        // اگر ترندی وجود نداشت، از موارد پیش‌فرض استفاده کنید
        const defaultTrends = [
          "طبیعت_ایران",
          "آشپزی_ایرانی",
          "عکاسی",
          "هنر_ایرانی",
          "موسیقی_سنتی",
          "کافه_گردی",
          "فوتبال",
          "کتاب_خوب",
          "سفر",
          "استایل",
        ];

        return defaultTrends[Math.floor(Math.random() * defaultTrends.length)];
      }

      // انتخاب یک ترند تصادفی
      const randomTrend = trends[Math.floor(Math.random() * trends.length)];
      return randomTrend.hashtag;
    } catch (error) {
      logger.error(`Error getting random trending hashtag: ${error.message}`);
      return "ایران";
    }
  }

  /**
   * تولید متن مناسب برای بیو پروفایل
   */
  generateBio(category = "عمومی") {
    const bioTemplates = [
      "📍 تهران | {category} | {content}",
      "{content} | عاشق {category} 💕",
      "📚 {category} | {content} | تولید محتوا ✏️",
      "👋 {content} | {category} | DM برای همکاری 📩",
      "{content} | {category} | هر روز اینجا با شما هستم 🌟",
    ];

    const bioContents = {
      عمومی: [
        "زندگی با عشق و خلاقیت",
        "اشتراک لحظات ناب زندگی",
        "همراه با شما در لحظات خاص",
        "ثبت لحظات خاص و تجربیات جدید",
        "به دنبال آرامش و موفقیت",
      ],
      عکاسی: [
        "عکاس و علاقه‌مند به ثبت لحظات",
        "دنیا را از دریچه دوربین می‌بینم",
        "هنر دیدن و ثبت کردن لحظه‌ها",
        "عکاسی: هنر خلق خاطرات ماندگار",
        "قاب‌بندی زیبایی‌های زندگی",
      ],
      هنری: [
        "هنرمند و طراح گرافیک",
        "دنیا را رنگی می‌بینم",
        "خلق آثار هنری و به اشتراک گذاری",
        "هنر زندگی را زیباتر می‌کند",
        "طراح، نقاش و عاشق هنر",
      ],
      آشپزی: [
        "آشپز با عشق و علاقه",
        "دستورهای آشپزی خانگی و سنتی",
        "آشپزی با طعم خانگی و سلامت",
        "عاشق آشپزی و امتحان دستورهای جدید",
        "آشپزی: هنر خلق طعم‌های ماندگار",
      ],
      سفر: [
        "گردشگر و ماجراجو",
        "ایرانگردی و معرفی مکان‌های دیدنی",
        "هر جمعه یک سفر جدید",
        "سفر کردن بخشی از زندگی من",
        "کوله‌پشتی به دوش و آماده‌ی سفر",
      ],
      تکنولوژی: [
        "تکنولوژیست و علاقه‌مند به دنیای دیجیتال",
        "برنامه‌نویس و توسعه‌دهنده وب",
        "دنیای تکنولوژی و ترندهای روز",
        "عاشق گجت‌ها و تکنولوژی‌های جدید",
        "برنامه‌نویس، توسعه‌دهنده و طراح UX",
      ],
      موسیقی: [
        "موسیقی نبض زندگی من",
        "نوازنده و عاشق موسیقی",
        "زندگی بدون موسیقی سکوت است",
        "موسیقی زبان جهانی احساسات",
        "نت به نت با عشق و احساس",
      ],
    };

    // انتخاب الگوی تصادفی
    const template =
      bioTemplates[Math.floor(Math.random() * bioTemplates.length)];

    // انتخاب محتوای مناسب برای دسته‌بندی
    const contentArray = bioContents[category] || bioContents["عمومی"];
    const content =
      contentArray[Math.floor(Math.random() * contentArray.length)];

    // ساخت بیو
    let bio = template
      .replace("{category}", category)
      .replace("{content}", content);

    // افزودن ایموجی
    if (humanizer.shouldDoAction(0.8)) {
      const emojis = textGenerator.commonEmojis
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      if (!bio.includes("📍") && humanizer.shouldDoAction(0.3)) {
        bio = "📍 تهران | " + bio;
      }

      if (!bio.includes("📩") && humanizer.shouldDoAction(0.5)) {
        bio += " | DM برای همکاری 📩";
      }

      if (humanizer.shouldDoAction(0.3)) {
        bio += " " + emojis.join("");
      }
    }

    return bio;
  }

  /**
   * تولید متن پاسخ به کامنت‌ها
   * @param {string} username - نام کاربری فرد کامنت‌گذار
   * @param {string} comment - متن کامنت
   * @returns {string} - پاسخ به کامنت
   */
  generateCommentReply(username, comment) {
    // تشخیص نوع کامنت
    let replyType = "general";

    if (comment.includes("?") || comment.includes("؟")) {
      replyType = "question";
    } else if (
      comment.includes("قشنگ") ||
      comment.includes("زیبا") ||
      comment.includes("عالی") ||
      comment.includes("خوب") ||
      comment.includes("به به")
    ) {
      replyType = "compliment";
    } else if (comment.includes("ممنون") || comment.includes("تشکر")) {
      replyType = "thanks";
    }

    // پاسخ‌های آماده برای انواع کامنت‌ها
    const replies = {
      general: [
        "@{username} ممنون از نظرت 🙏",
        "@{username} خیلی لطف داری 🌹",
        "@{username} ممنون که وقت گذاشتی و نظر دادی 👍",
        "@{username} درود بر تو 🌺",
        "@{username} با تشکر از همراهیت ✨",
      ],
      question: [
        "@{username} سوال خوبی پرسیدی! {answer}",
        "@{username} ممنون از سوالت. {answer}",
        "@{username} این سوال خیلی برام جالب بود. {answer}",
        "@{username} سوال به جایی بود. {answer}",
        "@{username} در مورد سوالت باید بگم که {answer}",
      ],
      compliment: [
        "@{username} خیلی ممنون از لطفت 🙏 خوشحالم که خوشت اومده",
        "@{username} لطف داری عزیزم 💕",
        "@{username} نظر لطفته، خیلی ممنون 😊",
        "@{username} انرژی مثبتت رو دوست دارم، مرسی 🌸",
        "@{username} مرسی از انرژی خوبت ✨",
      ],
      thanks: [
        "@{username} خواهش می‌کنم عزیز 🌹",
        "@{username} قابلی نداشت 💕",
        "@{username} این منم که باید تشکر کنم 🙏",
        "@{username} خوشحالم که تونستم کمکی کرده باشم ✨",
        "@{username} وظیفه بود قربانت 🌺",
      ],
    };

    // انتخاب یک پاسخ تصادفی مناسب با نوع کامنت
    let reply =
      replies[replyType][Math.floor(Math.random() * replies[replyType].length)];

    // جایگزینی نام کاربری
    reply = reply.replace(/{username}/g, username);

    // اگر کامنت سوالی است، پاسخ مناسب را جایگزین کنید
    if (replyType === "question") {
      const answers = [
        "به زودی پست کامل‌تری در این مورد میذارم",
        "پیشنهاد می‌کنم استوری‌های هایلایت رو هم ببینی، اونجا توضیح دادم",
        "این سوال رو زیاد ازم می‌پرسن، به زودی یه پست کامل در موردش میذارم",
        "اگه مایل باشی می‌تونیم در دایرکت بیشتر صحبت کنیم",
        "نظر من اینه که هر کسی باید با توجه به شرایط خودش تصمیم بگیره",
      ];

      const answer = answers[Math.floor(Math.random() * answers.length)];
      reply = reply.replace(/{answer}/g, answer);
    }

    return reply;
  }

  /**
   * تولید پست با استفاده از عکس و متن مناسب
   * @param {string} imageUrl - آدرس عکس یا مسیر فایل
   * @param {string} caption - کپشن پست
   */
  async createPost(imageUrl, caption) {
    try {
      logger.info("Creating new post");

      // بررسی آیا اینستاگرام کلاینت آماده است
      if (!this.ig) {
        throw new Error("Instagram client not initialized");
      }

      // آپلود عکس
      const publishResult = await this.ig.publish.photo({
        file: imageUrl, // می‌تواند مسیر فایل یا Buffer باشد
        caption,
      });

      logger.info(
        `Post created successfully with ID: ${publishResult.media.id}`
      );

      return {
        success: true,
        postId: publishResult.media.id,
        code: publishResult.media.code,
      };
    } catch (error) {
      logger.error(`Error creating post: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ایجاد استوری با استفاده از عکس
   * @param {string} imageUrl - آدرس عکس یا مسیر فایل
   */
  async createStory(imageUrl) {
    try {
      logger.info("Creating new story");

      // بررسی آیا اینستاگرام کلاینت آماده است
      if (!this.ig) {
        throw new Error("Instagram client not initialized");
      }

      // آپلود استوری
      const publishResult = await this.ig.publish.story({
        file: imageUrl,
      });

      logger.info(
        `Story created successfully with ID: ${publishResult.media.id}`
      );

      return {
        success: true,
        storyId: publishResult.media.id,
      };
    } catch (error) {
      logger.error(`Error creating story: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * دریافت عکس‌های محبوب مرتبط با یک هشتگ برای الهام گرفتن
   * توجه: این عکس‌ها نباید مستقیماً استفاده شوند، فقط برای ایده گرفتن هستند
   */
  async getInspirationalImages(hashtag, limit = 5) {
    try {
      logger.info(`Getting inspirational images for hashtag: ${hashtag}`);

      // جستجوی هشتگ
      const result = await this.ig.feed.tags(hashtag).items();

      if (!result || result.length === 0) {
        logger.info(`No posts found for hashtag: ${hashtag}`);
        return [];
      }

      // انتخاب پست‌های محبوب با تعداد لایک بالا
      const popularPosts = result
        .filter((post) => post.image_versions2 && post.like_count)
        .sort((a, b) => b.like_count - a.like_count)
        .slice(0, limit);

      // استخراج اطلاعات پست‌ها
      const inspirationalPosts = popularPosts.map((post) => ({
        postId: post.id,
        code: post.code,
        url: post.image_versions2.candidates[0].url,
        likeCount: post.like_count,
        commentCount: post.comment_count,
        username: post.user.username,
      }));

      return inspirationalPosts;
    } catch (error) {
      logger.error(`Error getting inspirational images: ${error.message}`);
      return [];
    }
  }
}

module.exports = new ContentService();
