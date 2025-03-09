const Interaction = require("../models/interaction");
const Account = require("../models/account");
const Setting = require("../models/setting");
const Follow = require("../models/follow");
const instagramConfig = require("../config/instagram");
const logger = require("../config/logger");
const humanizer = require("../utils/humanizer");
const textGenerator = require("../utils/textGenerator");

class InteractionService {
  constructor() {
    // این متغیر به صورت گلوبال در instagram.js قرار داده شده است
    this.ig = global.ig;

    // کامنت‌های آماده فارسی برای انواع محتواها
    this.predefinedComments = {
      general: [
        "چقدر عالی! 👌",
        "محتوای خوبی بود، ممنون ✨",
        "واقعا زیباست! 😍",
        "کارت درسته 👏",
        "همیشه محتواهات جذابه 👌",
        "این پست رو خیلی دوست داشتم ❤️",
        "عالی مثل همیشه",
        "چه ایده‌ی جالبی 💡",
        "واو! فوق‌العاده‌است",
        "ممنون که به اشتراک گذاشتی 🙏",
        "لایک داره قطعاً 👍",
        "چقدر خوب 👌",
        "واقعا جالب بود 👌",
        "خیلی خوبه ادامه بده 👍",
        "پیج خوبی داری، محتوات عالیه 👏",
      ],

      nature: [
        "چه منظره زیبایی! کجاست این مکان؟ 😍",
        "طبیعت ایران بی‌نظیره ❤️",
        "عکاسیت فوق‌العاده‌است 📸",
        "منم عاشق طبیعت‌گردی هستم 🌿",
        "کاش الان اونجا بودم 🏞️",
        "این رنگ‌ها واقعا آرامش‌بخشه 💚",
        "دمت گرم، عالی ثبت کردی لحظه رو 👌",
        "طبیعت همیشه بهترین منبع آرامشه 🍃",
        "مناظر بکر ایران همیشه دلنشینه 🌄",
        "این عکس حس خوبی داره 🌿",
      ],

      food: [
        "وای چقدر خوشمزه به نظر میاد 😋",
        "دستپختت عالیه! میشه رسپی رو بذاری؟ 👨‍🍳",
        "الان گرسنه شدم 🍽️",
        "عالی شده، آفرین 👌",
        "چه رنگ و لعابی داره 😍",
        "منم باید این غذا رو امتحان کنم 👌",
        "استاد آشپزی هستی 🧑‍🍳",
        "همه چیز خیلی اشتها برانگیز به نظر میاد 👏",
        "چه تزیینی! هنرمندی واقعا 🎨",
        "دستور پختش رو میذاری؟ 🙏",
      ],

      photography: [
        "عکس فوق‌العاده‌ایه! با چه دوربینی گرفتی؟ 📸",
        "ترکیب‌بندی عالی داره 👌",
        "چه زاویه دیدی! آفرین 👏",
        "عکاسیت حرف نداره 📷",
        "نور عکس خیلی خوبه ✨",
        "این عکس رو باید قاب کرد 🖼️",
        "منم عاشق عکاسی‌ام، میشه بگی تنظیماتش چی بوده؟ 🙏",
        "چشم‌های هنرمندی داری 👁️",
        "کادربندی فوق‌العاده‌ای داره 📷",
        "چقدر حس خوبی منتقل می‌کنه این عکس 💯",
      ],

      art: [
        "چه اثر زیبایی! استعداد داری واقعا 🎨",
        "هنرت حرف نداره 👏",
        "خیلی ظریف کار کردی ✨",
        "عاشق سبک کارت هستم 💕",
        "چقدر صبر و حوصله میخواد این کار 👌",
        "کی یاد گرفتی اینقدر خوب کار کنی؟ 😍",
        "خلاقیتت تحسین برانگیزه 💫",
        "رنگ‌ها رو عالی انتخاب کردی 🎭",
        "میشه سفارش بدم ازت؟ 🙏",
        "اثر هنری فوق‌العاده‌ای خلق کردی 🖼️",
      ],

      fashion: [
        "استایلت فوق‌العاده‌است 👗",
        "این ترکیب لباس خیلی بهت میاد 👌",
        "سلیقه‌ت عالیه 💯",
        "از کجا خرید می‌کنی معمولا؟ 🛍️",
        "منم باید همچین استایلی رو امتحان کنم ✨",
        "خیلی شیک و مدرنه 👌",
        "رنگ لباست فوق‌العاده‌است 🌈",
        "استایلت همیشه الهام‌بخشه 👑",
        "خیلی خوش‌پوشی 👏",
        "کلا سلیقه خوبی داری 👔",
      ],

      personal: [
        "چه عکس زیبایی! 😊",
        "همیشه انرژی مثبت میدی 💫",
        "خوشحالم که حالت خوبه ❤️",
        "لبخندت قشنگه 😊",
        "خیلی باحالی 👍",
        "انرژیت رو دوست دارم 💕",
        "خوش به حالت! عالیه 👌",
        "همیشه خوش و خرم باشی 🙏",
        "عکست پر از حس خوبه ✨",
        "چقدر مثبتی تو! 💯",
      ],

      question: [
        "نظرت در مورد ... چیه؟",
        "میشه بیشتر توضیح بدی؟",
        "کجا می‌تونم پیداش کنم؟",
        "چند وقته این کار رو انجام می‌دی؟",
        "پیشنهادت برای تازه‌کارها چیه؟",
        "میشه راهنمایی کنی چطوری شروع کنم؟",
        "بهترین نکته‌ای که یاد گرفتی چیه؟",
        "برندی هم هست که پیشنهاد کنی؟",
        "اگر بخوام شروع کنم از کجا باید شروع کنم؟",
        "تجربه‌ات رو میشه بیشتر به اشتراک بذاری؟",
      ],
    };

    // پیام‌های دایرکت آماده فارسی برای شروع مکالمه
    this.predefinedDMs = [
      {
        subject: "معرفی و آشنایی",
        templates: [
          "سلام {username} عزیز! از محتوای پیجت خیلی خوشم اومد. مطالب مفید و جذابی داری. خواستم بگم که کارت عالیه و ازت تشکر کنم که اینا رو به اشتراک میذاری. 😊",

          "سلام {username} جان، با دیدن پستات تو اینستاگرام واقعاً تحت تاثیر قرار گرفتم! خواستم ازت بابت محتوای با کیفیتت تشکر کنم. به نظرم خیلی با استعدادی. 👏",

          "سلام {username}، اتفاقی با پیجت آشنا شدم و واقعاً مطالبت برام جالب بود. فکر کردم بیام دایرکت و یه تشکر کوچیک کنم ازت. به امید آشنایی بیشتر. ✨",

          "سلام {username} عزیز، من تازه با کارهات آشنا شدم و باید بگم خیلی کارت درسته! می‌خواستم بدونی که طرفدار جدید پیدا کردی. خوشحال میشم بیشتر با هم در ارتباط باشیم. 🙂",

          "سلام {username} جان، پیجت رو از طریق اکسپلور پیدا کردم و محتوات برام خیلی جذاب بود. خواستم بهت بگم که فالوت کردم و منتظر پست‌های جدیدت هستم! 💯",
        ],
      },
      {
        subject: "همکاری و تعامل",
        templates: [
          "سلام {username} عزیز، من هم در زمینه مشابهی فعالیت می‌کنم و محتوای پیجت برام خیلی الهام‌بخش بود. خوشحال میشم بتونیم تبادل نظر داشته باشیم و شاید در آینده همکاری کنیم. نظرت چیه؟ 🤝",

          "سلام {username} جان، کارهات واقعاً عالیه! من هم در زمینه مشابهی کار می‌کنم و فکر می‌کنم می‌تونیم ایده‌های خوبی به هم بدیم. دوست داری گاهی درباره {subject} با هم صحبت کنیم؟ 💡",

          "سلام {username}، محتوای پیجت خیلی برام جالب و آموزنده بود. من هم در این حوزه فعالیت دارم و خوشحال میشم ارتباط بیشتری با هم داشته باشیم. شاید بتونیم از تجربیات هم استفاده کنیم. چطوره؟ 📚",

          "درود بر {username} عزیز! از دیدن کارهای خلاقانه‌ات واقعاً لذت بردم. من هم در زمینه {subject} فعالیت می‌کنم و فکر می‌کنم اشتراک نظر و همکاری بین افراد همفکر می‌تونه نتایج فوق‌العاده‌ای داشته باشه. نظرت چیه؟ 🌟",

          "سلام {username} جان، من مدتیه پیجت رو دنبال می‌کنم و به نظرم محتوای با ارزشی تولید می‌کنی. دوست دارم بدونم آیا به همکاری مشترک علاقه داری؟ فکر می‌کنم می‌تونیم کارهای جالبی با هم انجام بدیم. 🤔",
        ],
      },
      {
        subject: "سوال و مشورت",
        templates: [
          "سلام {username} عزیز، من کارهات رو خیلی دوست دارم و به نظرم تو این زمینه تخصص خوبی داری. می‌خواستم اگه امکانش هست، نظرت رو درباره {subject} بدونم. ممنون میشم اگه راهنماییم کنی. 🙏",

          "سلام {username} جان، من تازه وارد حوزه {subject} شدم و از محتوای آموزنده‌ات خیلی استفاده می‌کنم. یه سوال داشتم، به نظرت برای شروع باید از کجا شروع کنم؟ هر راهنمایی کوچیکی برام ارزشمنده. ❓",

          "درود بر {username}! من یه مدته پیجت رو فالو می‌کنم و خیلی چیزا یاد گرفتم. می‌خواستم نظر تخصصیت رو درباره {subject} بدونم. تجربه‌ت تو این زمینه چیه؟ 🤔",

          "سلام {username} عزیز، من به تازگی با کارهات آشنا شدم و واقعاً تحت تاثیر تخصصت قرار گرفتم. یه سوال برام پیش اومده، میشه کمکم کنی؟ درباره {subject} می‌خواستم بیشتر بدونم. 📝",

          "سلام {username} جان، مدتیه که پیجت رو دنبال می‌کنم و از محتوات خیلی استفاده می‌کنم. یه مشکلی دارم که فکر کردم شاید تو بتونی کمکم کنی. درباره {subject} میشه راهنماییم کنی؟ خیلی ممنون میشم. 💬",
        ],
      },
      {
        subject: "تمجید و تعریف",
        templates: [
          "سلام {username} عزیز! فقط می‌خواستم بگم که محتوای پیجت فوق‌العاده‌است. واقعاً هر بار پست‌هات رو می‌بینم انرژی می‌گیرم و الهام می‌گیرم. کارت درسته! ✨👏",

          "سلام {username} جان، نمی‌دونم چطوری بگم ولی پیجت یکی از بهترین پیج‌هاییه که تا حالا دیدم! هم محتوات خلاقانه‌است، هم کاربردی. فقط خواستم بهت بگم که طرفدار کارت هستم. 💯❤️",

          "درود بر {username}! باید اعتراف کنم که استایل و محتوای پیجت رو خیلی دوست دارم. همیشه منتظر پست‌های جدیدت هستم. فقط خواستم یه خسته نباشید بگم و تشویقت کنم که ادامه بدی. 🙌",

          "سلام {username} عزیز، امروز وقت گذاشتم و کل پیجت رو مرور کردم. باید بگم که واقعاً محشره! معلومه که خیلی زحمت می‌کشی و با عشق کار می‌کنی. خواستم بدونی که این تلاشت دیده میشه و قدردانی میشه. 👏🔥",

          "سلام {username} جان، من یه مدته پیجت رو دنبال می‌کنم و هر بار از محتوات شگفت‌زده میشم. واقعاً استعداد و خلاقیت فوق‌العاده‌ای داری. فقط خواستم یه تشکر کوچیک کنم ازت بابت این همه محتوای با کیفیت. 🌟💕",
        ],
      },
      {
        subject: "پیشنهاد محتوا",
        templates: [
          "سلام {username} عزیز! من عاشق محتوای پیجت هستم و یه پیشنهاد داشتم. فکر می‌کنی میشه درباره {subject} هم محتوا بسازی؟ به نظرم خیلی جذاب میشه و مطمئنم خیلی‌ها دوست دارن نظر تو رو در این مورد بدونن. 💡",

          "سلام {username} جان، من همیشه از محتوات لذت می‌برم و یه ایده به ذهنم رسید. چطوره یه پست درمورد {subject} بذاری؟ فکر می‌کنم با توجه به تخصصت، خیلی مفید و جذاب از آب در بیاد. نظرت چیه؟ 🤔✨",

          "درود بر {username}! من یکی از طرفدارای پیجت هستم و یه پیشنهاد برات دارم. دوست دارم بیشتر درباره {subject} بدونم و فکر کردم شاید تو هم علاقه داشته باشی در این مورد محتوا تولید کنی. چه فکری می‌کنی؟ 📚",

          "سلام {username} عزیز، من همیشه محتوات رو دنبال می‌کنم و خیلی ازشون استفاده می‌کنم. یه موضوع جذاب به ذهنم رسید که فکر می‌کنم به استایل پیجت می‌خوره: {subject}. دوست داری در موردش کار کنی؟ 💭",

          "سلام {username} جان! من عاشق نگاه تخصصی و خلاقت هستم و فکر می‌کنم اگه در مورد {subject} محتوا بسازی، خیلی جذاب میشه. این موضوع تازگی‌ها خیلی مورد توجه قرار گرفته و نظر تو می‌تونه خیلی با ارزش باشه. چطوره؟ 🌟👀",
        ],
      },
    ];
  }

  /**
   * لایک کردن یک پست
   */
  async likeMedia(mediaId, username, mediaType = "post") {
    try {
      // دریافت تنظیمات بات
      const settings = await Setting.getActiveSettings();

      // بررسی آیا ویژگی لایک فعال است
      if (!settings.enabledFeatures.like) {
        logger.info(`Liking is disabled in settings`);
        return false;
      }

      // شبیه‌سازی رفتار انسانی
      if (settings.humanization.randomizeTimeBetweenActions) {
        await humanizer.simulateHumanDelay(
          instagramConfig.limits.likes.minDelaySeconds,
          instagramConfig.limits.likes.maxDelaySeconds
        );
      }

      // گاهی قبل از لایک، پروفایل کاربر را مشاهده کنید
      if (
        humanizer.shouldDoAction(
          instagramConfig.humanization.viewProfileBeforeInteractProbability
        )
      ) {
        logger.info(`Viewing profile of ${username} before liking`);
        await this.ig.user.searchExact(username).then((user) => {
          return this.ig.user.info(user.pk);
        });

        // تاخیر طبیعی بین مشاهده پروفایل و لایک
        await humanizer.simulateHumanDelay(2, 5);
      }

      // لایک کردن پست
      await this.ig.media.like({
        mediaId: mediaId,
        moduleInfo: {
          module_name: "profile",
        },
      });

      logger.info(`Liked media ${mediaId} of user ${username}`);

      // به‌روزرسانی آمار حساب کاربری
      const account = await Account.findOne({ isActive: true });
      await account.updateStats("likes");

      // ثبت تعامل در دیتابیس
      await Interaction.recordInteraction({
        targetUsername: username,
        targetUserId: mediaId.split("_")[1],
        mediaId: mediaId,
        mediaType: mediaType,
        interactionType: "like",
        botAccount: account._id,
        successful: true,
      });

      return true;
    } catch (error) {
      logger.error(`Error liking media ${mediaId}: ${error.message}`);

      // ثبت خطا
      const account = await Account.findOne({ isActive: true });
      await account.recordError(`Error liking media: ${error.message}`);

      return false;
    }
  }

  /**
   * کامنت گذاشتن روی یک پست
   */
  async commentOnMedia(
    mediaId,
    username,
    category = "general",
    mediaType = "post"
  ) {
    try {
      // دریافت تنظیمات بات
      const settings = await Setting.getActiveSettings();

      // بررسی آیا ویژگی کامنت فعال است
      if (!settings.enabledFeatures.comment) {
        logger.info(`Commenting is disabled in settings`);
        return false;
      }

      // شبیه‌سازی رفتار انسانی
      if (settings.humanization.randomizeTimeBetweenActions) {
        await humanizer.simulateHumanDelay(
          instagramConfig.limits.comments.minDelaySeconds,
          instagramConfig.limits.comments.maxDelaySeconds
        );
      }

      // انتخاب کامنت مناسب
      let commentText;

      if (this.predefinedComments[category]) {
        const comments = this.predefinedComments[category];
        commentText = comments[Math.floor(Math.random() * comments.length)];
      } else {
        // اگر دسته‌بندی وجود نداشت، از دسته عمومی استفاده کنید
        const comments = this.predefinedComments.general;
        commentText = comments[Math.floor(Math.random() * comments.length)];
      }

      // گاهی یک سوال اضافه کنید
      if (
        humanizer.shouldDoAction(0.3) &&
        !commentText.includes("?") &&
        !commentText.includes("؟")
      ) {
        const questions = this.predefinedComments.question;
        const randomQuestion =
          questions[Math.floor(Math.random() * questions.length)];
        commentText += " " + randomQuestion;
      }

      // شبیه‌سازی تایپ کردن کامنت (تاخیر بر اساس طول متن)
      if (settings.humanization.simulateTypingSpeed) {
        await humanizer.simulateTyping(commentText.length);
      }

      // ارسال کامنت به اینستاگرام
      await this.ig.media.comment({
        mediaId: mediaId,
        text: commentText,
      });

      logger.info(
        `Commented on media ${mediaId} of user ${username}: ${commentText}`
      );

      // به‌روزرسانی آمار حساب کاربری
      const account = await Account.findOne({ isActive: true });
      await account.updateStats("comments");

      // ثبت تعامل در دیتابیس
      await Interaction.recordInteraction({
        targetUsername: username,
        targetUserId: mediaId.split("_")[1],
        mediaId: mediaId,
        mediaType: mediaType,
        interactionType: "comment",
        content: commentText,
        botAccount: account._id,
        successful: true,
      });

      return {
        success: true,
        comment: commentText,
      };
    } catch (error) {
      logger.error(`Error commenting on media ${mediaId}: ${error.message}`);

      // ثبت خطا
      const account = await Account.findOne({ isActive: true });
      await account.recordError(`Error commenting: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ارسال پیام دایرکت به یک کاربر
   */
  async sendDirectMessage(
    userId,
    username,
    subject = "معرفی و آشنایی",
    customSubject = null
  ) {
    try {
      // دریافت تنظیمات بات
      const settings = await Setting.getActiveSettings();

      // بررسی آیا ویژگی دایرکت فعال است
      if (!settings.enabledFeatures.directMessage) {
        logger.info(`Direct messaging is disabled in settings`);
        return false;
      }

      // بررسی آیا قبلاً به این کاربر پیام ارسال شده است (در 7 روز گذشته)
      const previousDM = await Interaction.checkPreviousInteraction(
        (
          await Account.findOne({ isActive: true })
        )._id,
        userId,
        "direct",
        7 * 24
      );

      if (previousDM) {
        logger.info(
          `Already sent DM to ${username} in the last 7 days. Skipping.`
        );
        return {
          success: false,
          error: "Already sent DM recently",
        };
      }

      // شبیه‌سازی رفتار انسانی
      if (settings.humanization.randomizeTimeBetweenActions) {
        await humanizer.simulateHumanDelay(
          instagramConfig.limits.directMessages.minDelaySeconds,
          instagramConfig.limits.directMessages.maxDelaySeconds
        );
      }

      // انتخاب قالب پیام مناسب
      let messageText;
      const subjectData =
        this.predefinedDMs.find((dm) => dm.subject === subject) ||
        this.predefinedDMs[0];
      const templates = subjectData.templates;
      messageText = templates[Math.floor(Math.random() * templates.length)];

      // جایگزینی متغیرها در پیام
      messageText = messageText.replace(/{username}/g, username);

      if (customSubject && messageText.includes("{subject}")) {
        messageText = messageText.replace(/{subject}/g, customSubject);
      } else if (messageText.includes("{subject}")) {
        // اگر موضوع سفارشی وجود نداشت، از یک گزینه پیش‌فرض استفاده کنید
        const defaultSubjects = [
          "محتوای دیجیتال",
          "سبک زندگی",
          "خلاقیت",
          "هنر",
          "طراحی",
          "عکاسی",
        ];
        const randomSubject =
          defaultSubjects[Math.floor(Math.random() * defaultSubjects.length)];
        messageText = messageText.replace(/{subject}/g, randomSubject);
      }

      // شبیه‌سازی تایپ کردن پیام (تاخیر بر اساس طول متن)
      if (settings.humanization.simulateTypingSpeed) {
        await humanizer.simulateTyping(messageText.length);
      }

      // ارسال پیام دایرکت
      const thread = this.ig.entity.directThread([userId.toString()]);
      await thread.broadcastText(messageText);

      logger.info(`Sent DM to ${username} with subject: ${subject}`);

      // به‌روزرسانی آمار حساب کاربری
      const account = await Account.findOne({ isActive: true });
      await account.updateStats("directMessages");

      // ثبت تعامل در دیتابیس
      await Interaction.recordInteraction({
        targetUsername: username,
        targetUserId: userId,
        mediaType: "direct",
        interactionType: "direct",
        content: messageText,
        botAccount: account._id,
        successful: true,
      });

      return {
        success: true,
        message: messageText,
      };
    } catch (error) {
      logger.error(`Error sending DM to ${username}: ${error.message}`);

      // ثبت خطا
      const account = await Account.findOne({ isActive: true });
      await account.recordError(`Error sending DM: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * مشاهده استوری کاربر
   */
  async viewStory(userId, username) {
    try {
      // دریافت تنظیمات بات
      const settings = await Setting.getActiveSettings();

      // بررسی آیا ویژگی مشاهده استوری فعال است
      if (!settings.enabledFeatures.viewStory) {
        logger.info(`Story viewing is disabled in settings`);
        return false;
      }

      // شبیه‌سازی رفتار انسانی
      if (settings.humanization.randomizeTimeBetweenActions) {
        await humanizer.simulateHumanDelay(
          instagramConfig.limits.storyInteractions.minDelaySeconds,
          instagramConfig.limits.storyInteractions.maxDelaySeconds
        );
      }

      // دریافت استوری‌های کاربر
      const stories = await this.ig.feed.userStory(userId).items();

      if (stories.length === 0) {
        logger.info(`No stories found for user ${username}`);
        return {
          success: false,
          error: "No stories found",
        };
      }

      // انتخاب تعداد تصادفی استوری برای مشاهده (برای طبیعی بودن)
      const storiesToView = stories.slice(
        0,
        Math.min(stories.length, Math.floor(Math.random() * stories.length) + 1)
      );

      for (const story of storiesToView) {
        // مشاهده هر استوری با یک تاخیر کوتاه طبیعی بین هر کدام
        await this.ig.story.seen([story]);
        logger.info(`Viewed story ${story.id} of user ${username}`);

        // تاخیر کوتاه بین مشاهده استوری‌ها (1-5 ثانیه)
        await humanizer.simulateHumanDelay(1, 5);
      }

      // به‌روزرسانی آمار حساب کاربری
      const account = await Account.findOne({ isActive: true });
      await account.updateStats("storyViews");

      // ثبت تعامل در دیتابیس
      await Interaction.recordInteraction({
        targetUsername: username,
        targetUserId: userId,
        mediaType: "story",
        interactionType: "view",
        botAccount: account._id,
        successful: true,
      });

      return {
        success: true,
        viewedCount: storiesToView.length,
      };
    } catch (error) {
      logger.error(`Error viewing stories of ${username}: ${error.message}`);

      // ثبت خطا
      const account = await Account.findOne({ isActive: true });
      await account.recordError(`Error viewing stories: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * تعامل کامل با یک کاربر (تعداد مشخصی از پست‌ها، استوری‌ها، و احتمالاً پیام دایرکت)
   */
  async interactWithUser(username, fullInteraction = false) {
    try {
      logger.info(`Starting interaction with user ${username}`);

      // گام 1: یافتن کاربر و اطلاعات پروفایل
      const user = await this.ig.user.searchExact(username);
      if (!user) {
        return {
          success: false,
          error: `User ${username} not found`,
        };
      }

      const userId = user.pk;
      const userInfo = await this.ig.user.info(userId);

      // بررسی اگر کاربر خصوصی است
      if (userInfo.is_private && !userInfo.friendship_status.following) {
        logger.info(
          `User ${username} is private and we're not following them. Limited interaction possible.`
        );

        // در این مورد، فقط می‌توانیم استوری‌ها را ببینیم یا فالو کنیم
        await this.viewStory(userId, username);

        return {
          success: true,
          limited: true,
          message: "Private account, limited interaction",
        };
      }

      // گام 2: مشاهده استوری‌ها
      await this.viewStory(userId, username);

      // گام 3: گرفتن پست‌های اخیر کاربر
      const userFeed = this.ig.feed.user(userId);
      const posts = await userFeed.items();

      if (posts.length === 0) {
        logger.info(`No posts found for user ${username}`);
        return {
          success: true,
          message: "No posts to interact with",
        };
      }

      // گام 4: تعامل با تعدادی از پست‌ها (حداکثر 3 پست)
      const postsToInteract = posts.slice(0, Math.min(posts.length, 3));
      const interactions = [];

      for (const post of postsToInteract) {
        // تاخیر طبیعی بین تعاملات
        await humanizer.simulateHumanDelay(5, 15);

        // لایک کردن پست
        const liked = await this.likeMedia(
          post.id,
          username,
          post.media_type === 8 ? "carousel" : "post"
        );
        interactions.push({ type: "like", success: liked });

        // گاهی اوقات کامنت بگذارید (با احتمال 30%)
        if (humanizer.shouldDoAction(0.3)) {
          // تشخیص دسته‌بندی پست برای کامنت مناسب
          let category = "general";

          // تشخیص ساده بر اساس کپشن و هشتگ
          if (post.caption && post.caption.text) {
            const caption = post.caption.text.toLowerCase();
            if (
              caption.includes("طبیعت") ||
              caption.includes("جنگل") ||
              caption.includes("دریا") ||
              caption.includes("کوه")
            ) {
              category = "nature";
            } else if (
              caption.includes("غذا") ||
              caption.includes("رستوران") ||
              caption.includes("آشپزی") ||
              caption.includes("دستور")
            ) {
              category = "food";
            } else if (
              caption.includes("عکاسی") ||
              caption.includes("عکس") ||
              caption.includes("دوربین") ||
              caption.includes("فوتوگرافی")
            ) {
              category = "photography";
            } else if (
              caption.includes("هنر") ||
              caption.includes("نقاشی") ||
              caption.includes("طراحی")
            ) {
              category = "art";
            } else if (
              caption.includes("مد") ||
              caption.includes("لباس") ||
              caption.includes("استایل") ||
              caption.includes("فشن")
            ) {
              category = "fashion";
            }
          }

          const commented = await this.commentOnMedia(
            post.id,
            username,
            category
          );
          interactions.push({
            type: "comment",
            success: commented.success,
            comment: commented.comment,
          });
        }
      }

      // گام 5: اگر تعامل کامل درخواست شده است، پیام مستقیم ارسال کنید
      if (fullInteraction && humanizer.shouldDoAction(0.4)) {
        // تشخیص موضوع مناسب برای DM بر اساس محتوای پروفایل
        let dmSubject = "معرفی و آشنایی";
        let customSubject = null;

        if (userInfo.biography) {
          const bio = userInfo.biography.toLowerCase();

          if (
            bio.includes("همکاری") ||
            bio.includes("تبلیغات") ||
            bio.includes("بیزینس")
          ) {
            dmSubject = "همکاری و تعامل";

            // تشخیص زمینه کاری
            if (bio.includes("عکاسی")) customSubject = "عکاسی";
            else if (bio.includes("طراحی")) customSubject = "طراحی گرافیک";
            else if (bio.includes("موسیقی")) customSubject = "موسیقی";
            else if (bio.includes("ورزش")) customSubject = "ورزش و سلامتی";
            else if (bio.includes("غذا")) customSubject = "آشپزی";
          }
        }

        const dmResult = await this.sendDirectMessage(
          userId,
          username,
          dmSubject,
          customSubject
        );
        interactions.push({
          type: "directMessage",
          success: dmResult.success,
          message: dmResult.message,
        });
      }

      logger.info(
        `Completed interaction with user ${username}: ${interactions.length} interactions`
      );

      return {
        success: true,
        username,
        userId,
        interactions,
      };
    } catch (error) {
      logger.error(
        `Error during interaction with ${username}: ${error.message}`
      );

      // ثبت خطا
      const account = await Account.findOne({ isActive: true });
      await account.recordError(
        `Error interacting with user: ${error.message}`
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new InteractionService();
