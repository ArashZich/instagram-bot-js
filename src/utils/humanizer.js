/**
 * ماژول شبیه‌سازی رفتار انسانی
 * این ماژول توابعی را برای ایجاد تاخیرها و رفتارهای تصادفی فراهم می‌کند
 * تا بات طبیعی‌تر به نظر برسد
 */

const logger = require("../config/logger");

class Humanizer {
  /**
   * ایجاد تاخیر تصادفی بین حداقل و حداکثر زمان مشخص شده (بر حسب ثانیه)
   */
  async simulateHumanDelay(minSeconds, maxSeconds) {
    const delay = this.getRandomInt(minSeconds * 1000, maxSeconds * 1000);
    logger.debug(`Adding human delay of ${delay / 1000} seconds`);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * شبیه‌سازی زمان تایپ کردن بر اساس طول متن
   */
  async simulateTyping(textLength) {
    // میانگین سرعت تایپ یک انسان حدود 200 میلی‌ثانیه برای هر کاراکتر است
    // اما با کمی تغییرات تصادفی
    const baseTypingTime = textLength * 200;
    const randomVariation = baseTypingTime * 0.3 * (Math.random() - 0.5);
    const typingTime = baseTypingTime + randomVariation;

    logger.debug(
      `Simulating typing for ${typingTime / 1000} seconds (${textLength} chars)`
    );
    return new Promise((resolve) => setTimeout(resolve, typingTime));
  }

  /**
   * ایجاد یک عدد تصادفی بین حداقل و حداکثر
   */
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * تصمیم‌گیری برای انجام یک عمل بر اساس احتمال مشخص شده
   * @param {number} probability - احتمال انجام عمل (بین 0 و 1)
   * @returns {boolean} - آیا عمل باید انجام شود
   */
  shouldDoAction(probability) {
    return Math.random() < probability;
  }

  /**
   * افزودن تایپوهای تصادفی به متن
   * @param {string} text - متن اصلی
   * @param {number} typoProbability - احتمال ایجاد تایپو (بین 0 و 1)
   * @returns {string} - متن با تایپوهای تصادفی
   */
  addRandomTypos(text, typoProbability = 0.05) {
    if (text.length < 10) return text; // برای متون کوتاه تایپو اضافه نکنید

    const chars = text.split("");
    const result = [];

    for (let i = 0; i < chars.length; i++) {
      if (Math.random() < typoProbability) {
        const typoType = Math.floor(Math.random() * 3);

        switch (typoType) {
          case 0: // حذف کاراکتر
            // فقط ادامه دهید (کاراکتر را اضافه نکنید)
            break;

          case 1: // جابجایی دو کاراکتر
            if (i < chars.length - 1) {
              result.push(chars[i + 1]);
              result.push(chars[i]);
              i++; // پرش از کاراکتر بعدی
            } else {
              result.push(chars[i]);
            }
            break;

          case 2: // تکرار کاراکتر
            result.push(chars[i]);
            result.push(chars[i]);
            break;
        }
      } else {
        result.push(chars[i]);
      }
    }

    return result.join("");
  }

  /**
   * شبیه‌سازی اصلاح تایپو
   * @param {string} originalText - متن با تایپو
   * @param {string} correctedText - متن اصلاح شده
   * @returns {Promise<string>} - متن نهایی پس از تاخیر
   */
  async simulateTypoCorrection(originalText, correctedText) {
    // شبیه‌سازی تشخیص تایپو و تاخیر برای اصلاح آن
    await this.simulateHumanDelay(0.8, 1.5);
    return correctedText;
  }

  /**
   * شبیه‌سازی اسکرول کردن
   * @param {number} minScrolls - حداقل تعداد اسکرول
   * @param {number} maxScrolls - حداکثر تعداد اسکرول
   */
  async simulateScrolling(minScrolls = 2, maxScrolls = 5) {
    const numScrolls = this.getRandomInt(minScrolls, maxScrolls);

    logger.debug(`Simulating ${numScrolls} scrolls`);

    for (let i = 0; i < numScrolls; i++) {
      await this.simulateHumanDelay(0.5, 2);
    }
  }

  /**
   * شبیه‌سازی مکث برای خواندن محتوا
   * @param {number} contentLength - طول تقریبی محتوا (کاراکتر یا تعداد آیتم‌ها)
   */
  async simulateReading(contentLength) {
    // میانگین سرعت خواندن حدود 200 کلمه در دقیقه است
    // هر کلمه حدود 5 کاراکتر است
    const words = contentLength / 5;
    const readingTimeMs = (words / 200) * 60 * 1000;

    // اضافه کردن مقداری تصادفی بودن
    const actualReadingTime = readingTimeMs * (0.7 + Math.random() * 0.6);

    logger.debug(`Simulating reading for ${actualReadingTime / 1000} seconds`);
    return new Promise((resolve) => setTimeout(resolve, actualReadingTime));
  }

  /**
   * شبیه‌سازی تغییر نگاه به جزئیات مختلف (برای مثال، در یک پروفایل یا پست)
   * @param {number} numElements - تعداد عناصر برای مشاهده
   */
  async simulateBrowsing(numElements = 3) {
    for (let i = 0; i < numElements; i++) {
      // زمان مشاهده هر عنصر
      await this.simulateHumanDelay(1, 4);
    }
  }

  /**
   * تولید یک الگوی تعامل انسانی
   * این تابع یک برنامه زمانی تصادفی برای تعاملات در طول روز ایجاد می‌کند
   * @param {number} totalActions - تعداد کل اقدامات در روز
   * @param {number} startHour - ساعت شروع
   * @param {number} endHour - ساعت پایان
   * @returns {Array} - آرایه‌ای از زمان‌های تعامل (به دقیقه)
   */
  generateHumanInteractionPattern(totalActions, startHour = 9, endHour = 23) {
    const totalMinutes = (endHour - startHour) * 60;
    const interactionTimes = [];

    // ایجاد توزیع طبیعی‌تر از زمان‌ها
    for (let i = 0; i < totalActions; i++) {
      // افزودن تصادفی بودن با تمرکز بیشتر در زمان‌های پیک (ظهر و عصر)
      let timeOffset;
      const peakSelector = Math.random();

      if (peakSelector < 0.3) {
        // پیک صبح (~30% از تعاملات)
        timeOffset = this.getRandomInt(60, 180);
      } else if (peakSelector < 0.7) {
        // پیک عصر (~40% از تعاملات)
        timeOffset = this.getRandomInt(420, 540);
      } else {
        // سایر زمان‌ها (~30% از تعاملات)
        timeOffset = this.getRandomInt(0, totalMinutes);
      }

      interactionTimes.push(timeOffset);
    }

    // مرتب‌سازی زمان‌ها
    interactionTimes.sort((a, b) => a - b);

    // تبدیل به ساعت و دقیقه
    return interactionTimes.map((minutes) => {
      const hour = Math.floor(minutes / 60) + startHour;
      const minute = minutes % 60;
      return { hour, minute };
    });
  }
}

module.exports = new Humanizer();
