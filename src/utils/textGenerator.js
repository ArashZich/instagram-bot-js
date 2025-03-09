/**
 * ماژول تولید متن طبیعی
 * این ماژول توابعی را برای تولید کامنت‌ها و پیام‌های طبیعی فراهم می‌کند
 */

const humanizer = require("./humanizer");

class TextGenerator {
  constructor() {
    // ایموجی‌های رایج فارسی
    this.commonEmojis = [
      "😊",
      "❤️",
      "👍",
      "🙏",
      "😍",
      "✨",
      "👌",
      "💕",
      "🌹",
      "👏",
      "💪",
      "🔥",
      "💯",
      "🌸",
      "👑",
      "🧿",
      "🤲",
      "👀",
      "🌟",
      "💫",
      "🌺",
      "💪",
      "👋",
      "😎",
      "🎉",
      "👍🏻",
      "🙌",
      "🌞",
      "🤩",
      "🌷",
      "🌻",
      "✌",
      "🥰",
      "💐",
      "🍃",
      "🌱",
      "🌿",
      "🌳",
      "🌲",
      "🍀",
      "🌵",
      "🌴",
    ];

    // الگوهای شروع پیام‌ها
    this.greetingPatterns = [
      "سلام {username} عزیز",
      "سلام {username} جان",
      "درود بر {username}",
      "سلام {username}",
      "سلام دوست عزیز",
      "سلام و درود",
      "به به {username} عزیز",
      "سلام و احترام",
    ];

    // الگوهای پایانی
    this.closingPatterns = [
      "موفق باشی",
      "به امید دیدار",
      "روز خوبی داشته باشی",
      "ممنون از وقتت",
      "با تشکر",
      "با احترام",
      "خوشحال میشم نظرت رو بدونم",
      "منتظر پاسخت هستم",
    ];

    // سوالات رایج برای افزودن به پیام‌ها
    this.commonQuestions = [
      "نظرت چیه؟",
      "موافقی؟",
      "تو هم همینطور فکر می‌کنی؟",
      "تجربه مشابهی داشتی؟",
      "پیشنهاد بهتری داری؟",
      "دوست داری در این مورد بیشتر صحبت کنیم؟",
      "نظر دیگه‌ای داری؟",
      "چیز دیگه‌ای هست که بخوای بدونی؟",
    ];

    // کلمات متداول برای تمجید
    this.praiseWords = [
      "عالی",
      "فوق‌العاده",
      "جالب",
      "زیبا",
      "خلاقانه",
      "هوشمندانه",
      "جذاب",
      "محشر",
      "شگفت‌انگیز",
      "بی‌نظیر",
      "خارق‌العاده",
      "درخشان",
      "خوشگل",
      "خفن",
      "باحال",
    ];
  }

  /**
   * تولید یک کامنت طبیعی با طول مشخص
   * @param {string} category - دسته‌بندی محتوا
   * @param {number} minLength - حداقل طول کامنت
   * @param {number} maxLength - حداکثر طول کامنت
   * @param {boolean} includeEmoji - آیا از ایموجی استفاده شود
   * @param {boolean} includeQuestion - آیا سوال اضافه شود
   * @returns {string} - کامنت تولید شده
   */
  generateComment(
    category = "general",
    minLength = 4,
    maxLength = 30,
    includeEmoji = true,
    includeQuestion = true
  ) {
    // دریافت کامنت‌های پیش‌فرض از interactionService
    const interactionService = require("../services/interactionService");

    let comments;
    if (
      interactionService.predefinedComments &&
      interactionService.predefinedComments[category]
    ) {
      comments = interactionService.predefinedComments[category];
    } else {
      comments = interactionService.predefinedComments.general;
    }

    // انتخاب یک کامنت تصادفی
    let comment = comments[Math.floor(Math.random() * comments.length)];

    // بررسی آیا کامنت حداقل طول را دارد
    if (comment.length < minLength) {
      // اضافه کردن یک کلمه تمجیدی
      const praiseWord =
        this.praiseWords[Math.floor(Math.random() * this.praiseWords.length)];
      comment = `${comment} خیلی ${praiseWord}!`;
    }

    // افزودن سوال اگر درخواست شده باشد و کامنت از قبل سوالی نباشد
    if (
      includeQuestion &&
      humanizer.shouldDoAction(0.4) &&
      !comment.includes("?") &&
      !comment.includes("؟")
    ) {
      const question =
        this.commonQuestions[
          Math.floor(Math.random() * this.commonQuestions.length)
        ];
      comment = `${comment} ${question}`;
    }

    // کوتاه کردن کامنت اگر بیش از حد طولانی باشد
    if (comment.length > maxLength) {
      comment = comment.substring(0, maxLength);
      // اطمینان از پایان کامل جمله
      const lastPunctuation = Math.max(
        comment.lastIndexOf("."),
        comment.lastIndexOf("؟"),
        comment.lastIndexOf("!")
      );
      if (lastPunctuation > 0) {
        comment = comment.substring(0, lastPunctuation + 1);
      }
    }

    // افزودن ایموجی اگر درخواست شده باشد
    if (includeEmoji && humanizer.shouldDoAction(0.7)) {
      const numEmojis = humanizer.getRandomInt(1, 2);
      for (let i = 0; i < numEmojis; i++) {
        const emoji =
          this.commonEmojis[
            Math.floor(Math.random() * this.commonEmojis.length)
          ];

        // گاهی ایموجی را در وسط متن قرار دهید، گاهی در انتها
        if (humanizer.shouldDoAction(0.3) && comment.length > 10) {
          const position = humanizer.getRandomInt(5, comment.length - 5);
          comment =
            comment.substring(0, position) +
            " " +
            emoji +
            " " +
            comment.substring(position);
        } else {
          comment = comment + " " + emoji;
        }
      }
    }

    return comment;
  }

  /**
   * تولید یک پیام مستقیم طبیعی
   * @param {string} username - نام کاربری گیرنده
   * @param {string} subject - موضوع پیام
   * @param {number} minLength - حداقل طول پیام
   * @param {number} maxLength - حداکثر طول پیام
   * @param {boolean} includeEmoji - آیا از ایموجی استفاده شود
   * @returns {string} - پیام تولید شده
   */
  generateDirectMessage(
    username,
    subject = null,
    minLength = 20,
    maxLength = 150,
    includeEmoji = true
  ) {
    // دریافت پیام‌های پیش‌فرض از interactionService
    const interactionService = require("../services/interactionService");

    // پیدا کردن الگوهای پیام مناسب برای موضوع
    let messageTemplates;
    let selectedSubject = subject || "معرفی و آشنایی";

    const subjectData = interactionService.predefinedDMs.find(
      (dm) => dm.subject === selectedSubject
    );

    if (subjectData) {
      messageTemplates = subjectData.templates;
    } else {
      // استفاده از اولین دسته اگر موضوع پیدا نشد
      messageTemplates = interactionService.predefinedDMs[0].templates;
    }

    // انتخاب یک الگوی تصادفی
    let message =
      messageTemplates[Math.floor(Math.random() * messageTemplates.length)];

    // جایگزینی نام کاربری
    message = message.replace(/{username}/g, username);

    // جایگزینی موضوع
    if (message.includes("{subject}")) {
      const subjectTopics = [
        "محتوای دیجیتال",
        "سبک زندگی",
        "هنر",
        "عکاسی",
        "موسیقی",
        "آشپزی",
        "سفر",
        "تکنولوژی",
        "ورزش",
        "کتاب",
        "فیلم",
        "طبیعت",
      ];

      const randomSubject =
        subjectTopics[Math.floor(Math.random() * subjectTopics.length)];
      message = message.replace(/{subject}/g, randomSubject);
    }

    // بررسی آیا پیام حداقل طول را دارد
    if (message.length < minLength) {
      // اضافه کردن سلام یا عبارت پایانی
      if (humanizer.shouldDoAction(0.5)) {
        const greeting =
          this.greetingPatterns[
            Math.floor(Math.random() * this.greetingPatterns.length)
          ];
        greeting.replace("{username}", username);
        message = `${greeting}، ${message}`;
      } else {
        const closing =
          this.closingPatterns[
            Math.floor(Math.random() * this.closingPatterns.length)
          ];
        message = `${message}\n\n${closing}.`;
      }
    }

    // کوتاه کردن پیام اگر بیش از حد طولانی باشد
    if (message.length > maxLength) {
      message = message.substring(0, maxLength);
      // اطمینان از پایان کامل جمله
      const lastPunctuation = Math.max(
        message.lastIndexOf("."),
        message.lastIndexOf("؟"),
        message.lastIndexOf("!")
      );
      if (lastPunctuation > 0) {
        message = message.substring(0, lastPunctuation + 1);
      }
    }

    // افزودن ایموجی اگر درخواست شده باشد
    if (includeEmoji && humanizer.shouldDoAction(0.8)) {
      const numEmojis = humanizer.getRandomInt(1, 3);
      for (let i = 0; i < numEmojis; i++) {
        const emoji =
          this.commonEmojis[
            Math.floor(Math.random() * this.commonEmojis.length)
          ];

        // پیدا کردن یک نقطه مناسب برای افزودن ایموجی
        const sentences = message.split(/(?<=[.!?])\s+/);
        if (sentences.length > 1 && humanizer.shouldDoAction(0.7)) {
          // افزودن ایموجی به پایان یک جمله تصادفی
          const sentenceIndex = humanizer.getRandomInt(0, sentences.length - 1);
          sentences[sentenceIndex] = sentences[sentenceIndex] + " " + emoji;
          message = sentences.join(" ");
        } else {
          // افزودن ایموجی به پایان پیام
          message = message + " " + emoji;
        }
      }
    }

    return message;
  }

  /**
   * تولید متن با اثرات انسانی مانند اشتباهات تایپی
   * @param {string} text - متن اصلی
   * @param {number} typoProbability - احتمال اشتباه تایپی
   * @returns {string} - متن با اثرات انسانی
   */
  humanizeText(text, typoProbability = 0.05) {
    // افزودن اشتباهات تایپی تصادفی
    if (humanizer.shouldDoAction(0.3)) {
      return humanizer.addRandomTypos(text, typoProbability);
    }

    return text;
  }

  /**
   * تولید پاسخ به پیام دایرکت
   * @param {string} username - نام کاربری فرستنده
   * @param {string} incomingMessage - پیام دریافتی
   * @returns {string} - پاسخ تولید شده
   */
  generateDirectMessageReply(username, incomingMessage) {
    // تشخیص نوع پیام دریافتی
    let responseType = "general";

    if (incomingMessage.includes("?") || incomingMessage.includes("؟")) {
      responseType = "question";
    } else if (
      incomingMessage.includes("ممنون") ||
      incomingMessage.includes("تشکر")
    ) {
      responseType = "thanks";
    } else if (
      incomingMessage.includes("سلام") ||
      incomingMessage.includes("درود")
    ) {
      responseType = "greeting";
    }

    // تولید پاسخ بر اساس نوع پیام
    let reply = "";

    switch (responseType) {
      case "question":
        const questionResponses = [
          "سوال خوبی پرسیدی! به نظرم {answer}",
          "ممنون از سوالت. {answer}",
          "این سوال رو زیاد ازم میپرسن. {answer}",
          "سوال جالبیه! {answer}",
        ];

        reply =
          questionResponses[
            Math.floor(Math.random() * questionResponses.length)
          ];
        reply = reply.replace(
          "{answer}",
          "باید بیشتر در موردش فکر کنم، اما نظر اولیه‌ام اینه که بستگی به شرایط داره."
        );
        break;

      case "thanks":
        const thanksResponses = [
          "خواهش می‌کنم {username} عزیز",
          "قابلی نداشت 😊",
          "خوشحالم که تونستم کمک کنم",
          "این چه حرفیه، وظیفه بود",
        ];

        reply =
          thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
        break;

      case "greeting":
        const greetingResponses = [
          "سلام {username} عزیز، چطوری؟",
          "سلام و درود بر تو {username} جان",
          "سلام {username}، روز خوبی داشته باشی",
          "سلام، خوشحالم از آشناییت {username}",
        ];

        reply =
          greetingResponses[
            Math.floor(Math.random() * greetingResponses.length)
          ];
        break;

      default:
        const generalResponses = [
          "ممنون از پیامت {username} جان",
          "خیلی ممنون که وقت گذاشتی و پیام دادی",
          "پیامت رو دیدم و خوشحال شدم",
          "ممنون از توجهت {username} عزیز",
        ];

        reply =
          generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    // جایگزینی نام کاربری
    reply = reply.replace(/{username}/g, username);

    // افزودن ایموجی
    if (humanizer.shouldDoAction(0.7)) {
      const emoji =
        this.commonEmojis[Math.floor(Math.random() * this.commonEmojis.length)];
      reply += " " + emoji;
    }

    return reply;
  }

  /**
   * تولید کپشن برای پست
   * @param {string} topic - موضوع پست
   * @param {Array} hashtags - هشتگ‌های مرتبط
   * @returns {string} - کپشن تولید شده
   */
  generateCaption(topic, hashtags = []) {
    const captionTemplates = [
      "امروز می‌خوام در مورد {topic} صحبت کنم. نظر شما چیه؟",
      "{topic} یکی از موضوعات مورد علاقه منه. شما هم دوستش دارید؟",
      "به نظرتون {topic} چطور می‌تونه زندگی ما رو بهتر کنه؟",
      "تجربه من در مورد {topic} خیلی جالب بوده. دوست دارم نظر شما رو هم بدونم.",
      "امروز یه ایده جالب در مورد {topic} داشتم و خواستم با شما به اشتراک بذارم.",
    ];

    let caption =
      captionTemplates[Math.floor(Math.random() * captionTemplates.length)];
    caption = caption.replace(/{topic}/g, topic);

    // افزودن پاراگراف اضافی
    if (humanizer.shouldDoAction(0.6)) {
      const extraParagraphs = [
        "\n\nبه نظرم این موضوع برای همه ما مهمه و باید بیشتر بهش توجه کنیم.",
        "\n\nخوشحال میشم تجربیات شما رو هم در کامنت‌ها بخونم.",
        "\n\nاگه سوالی در این مورد دارید، خوشحال میشم کمک کنم.",
        "\n\nبه نظرتون چه جنبه‌های دیگه‌ای از این موضوع رو باید بررسی کرد؟",
      ];

      caption +=
        extraParagraphs[Math.floor(Math.random() * extraParagraphs.length)];
    }

    // افزودن ایموجی
    if (humanizer.shouldDoAction(0.8)) {
      const numEmojis = humanizer.getRandomInt(1, 3);
      for (let i = 0; i < numEmojis; i++) {
        const emoji =
          this.commonEmojis[
            Math.floor(Math.random() * this.commonEmojis.length)
          ];
        caption = caption.replace(/\.\s+/g, ". " + emoji + " ");
      }
    }

    // افزودن هشتگ‌ها
    if (hashtags && hashtags.length > 0) {
      caption += "\n\n";
      const numHashtags = Math.min(hashtags.length, 10);
      const selectedHashtags = hashtags
        .sort(() => 0.5 - Math.random())
        .slice(0, numHashtags);

      caption += selectedHashtags.map((tag) => `#${tag}`).join(" ");
    }

    return caption;
  }
}

module.exports = new TextGenerator();
