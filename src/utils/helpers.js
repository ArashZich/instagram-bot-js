/**
 * فایل توابع کمکی عمومی
 */

const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;
const logger = require("../config/logger");

/**
 * تولید یک رشته تصادفی
 * @param {number} length - طول رشته مورد نظر
 * @returns {string} - رشته تصادفی
 */
const generateRandomString = (length = 10) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};

/**
 * تولید نام فایل یکتا
 * @param {string} originalName - نام اصلی فایل
 * @returns {string} - نام یکتا فایل
 */
const generateUniqueFileName = (originalName) => {
  const extension = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = generateRandomString(6);

  return `${timestamp}_${randomString}${extension}`;
};

/**
 * تبدیل تاریخ به فرمت استاندارد
 * @param {Date|string} date - تاریخ ورودی
 * @returns {string} - تاریخ با فرمت استاندارد
 */
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

/**
 * تاخیر به میلی‌ثانیه
 * @param {number} ms - میلی‌ثانیه
 * @returns {Promise} - پرومیس که بعد از تاخیر مشخص شده حل می‌شود
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * بررسی آیا یک مسیر فایل وجود دارد
 * @param {string} filePath - مسیر فایل
 * @returns {Promise<boolean>} - آیا فایل وجود دارد
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * بررسی تاریخ پیش از امروز
 * @param {Date|string} date - تاریخ ورودی
 * @returns {boolean} - آیا تاریخ پیش از امروز است
 */
const isBeforeToday = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inputDate = new Date(date);
  return inputDate < today;
};

/**
 * محاسبه تعداد روزهای بین دو تاریخ
 * @param {Date|string} startDate - تاریخ شروع
 * @param {Date|string} endDate - تاریخ پایان
 * @returns {number} - تعداد روزها
 */
const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // تبدیل به مقادیر روز
  const startDay = start.setHours(0, 0, 0, 0);
  const endDay = end.setHours(0, 0, 0, 0);

  // محاسبه تفاوت میلی‌ثانیه‌ها و تبدیل به روز
  return Math.round(Math.abs((endDay - startDay) / (1000 * 60 * 60 * 24)));
};

/**
 * تبدیل متن به slug
 * @param {string} text - متن ورودی
 * @returns {string} - slug ساخته شده
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // جایگزینی فاصله‌ها با خط تیره
    .replace(/[^\w\-]+/g, "") // حذف کاراکترهای خاص
    .replace(/\-\-+/g, "-") // جایگزینی چندین خط تیره با یک خط تیره
    .replace(/^-+/, "") // حذف خط تیره از ابتدا
    .replace(/-+$/, ""); // حذف خط تیره از انتها
};

/**
 * ساخت شناسه یکتا
 * @returns {string} - شناسه یکتا
 */
const generateUniqueId = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * تبدیل نام کاربری به فرمت استاندارد اینستاگرام
 * @param {string} username - نام کاربری
 * @returns {string} - نام کاربری استاندارد
 */
const normalizeUsername = (username) => {
  // حذف @ از ابتدای نام کاربری
  if (username.startsWith("@")) {
    username = username.substring(1);
  }

  // حذف فاصله‌ها و کاراکترهای غیرمجاز
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
};

/**
 * تشخیص زبان متن (ساده)
 * @param {string} text - متن ورودی
 * @returns {string} - کد زبان ('fa', 'en', 'ar', یا 'unknown')
 */
const detectLanguage = (text) => {
  if (!text) return "unknown";

  const persianPattern = /[\u0600-\u06FF]/;
  const arabicPattern = /[\u0627-\u064A]/;
  const englishPattern = /[a-zA-Z]/;

  if (persianPattern.test(text)) return "fa";
  if (arabicPattern.test(text)) return "ar";
  if (englishPattern.test(text)) return "en";

  return "unknown";
};

/**
 * استخراج هشتگ‌ها از متن
 * @param {string} text - متن ورودی
 * @returns {Array<string>} - آرایه‌ای از هشتگ‌ها
 */
const extractHashtags = (text) => {
  if (!text) return [];

  const hashtagRegex = /#([\u0600-\u06FFa-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex);

  if (!matches) return [];

  // حذف # از ابتدای هشتگ‌ها
  return matches.map((hashtag) => hashtag.substring(1));
};

/**
 * تبدیل مقدار ورودی به عدد صحیح
 * @param {any} value - مقدار ورودی
 * @param {number} defaultValue - مقدار پیش‌فرض
 * @returns {number} - عدد صحیح
 */
const toInteger = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * کوتاه کردن متن با حفظ کلمات کامل
 * @param {string} text - متن ورودی
 * @param {number} maxLength - حداکثر طول مجاز
 * @param {string} suffix - پسوند برای متن کوتاه شده
 * @returns {string} - متن کوتاه شده
 */
const truncateText = (text, maxLength = 100, suffix = "...") => {
  if (!text || text.length <= maxLength) return text;

  // کوتاه کردن تا آخرین فضای خالی قبل از maxLength
  return `${text.substring(0, text.lastIndexOf(" ", maxLength))}${suffix}`;
};

/**
 * پاکسازی متن از کاراکترهای غیرمتنی
 * @param {string} text - متن ورودی
 * @returns {string} - متن پاکسازی شده
 */
const sanitizeText = (text) => {
  if (!text) return "";

  // حذف تگ‌های HTML، کد و کاراکترهای کنترلی
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * تولید گزارش خطا با جزئیات
 * @param {Error} error - آبجکت خطا
 * @param {string} context - توضیح مربوط به محل وقوع خطا
 * @returns {Object} - گزارش خطا
 */
const formatError = (error, context = "") => {
  const errorDetails = {
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  logger.error(`Error in ${context}: ${error.message}`);

  return errorDetails;
};

module.exports = {
  generateRandomString,
  generateUniqueFileName,
  formatDate,
  sleep,
  fileExists,
  isBeforeToday,
  daysBetween,
  slugify,
  generateUniqueId,
  normalizeUsername,
  detectLanguage,
  extractHashtags,
  toInteger,
  truncateText,
  sanitizeText,
  formatError,
};
