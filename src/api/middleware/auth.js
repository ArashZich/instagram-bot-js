const jwt = require("jsonwebtoken");
const logger = require("../../config/logger");

/**
 * میدلور احراز هویت با استفاده از JWT
 * @param {Object} req - درخواست اکسپرس
 * @param {Object} res - پاسخ اکسپرس
 * @param {Function} next - تابع بعدی میدلور
 */
const auth = (req, res, next) => {
  try {
    // گرفتن توکن از هدر
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    // جدا کردن توکن از هدر
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Token missing",
      });
    }

    try {
      // بررسی اعتبار توکن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // افزودن اطلاعات کاربر به درخواست
      req.user = decoded;

      next();
    } catch (error) {
      logger.error(`Token verification failed: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid token",
      });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * میدلور بررسی نقش ادمین
 * @param {Object} req - درخواست اکسپرس
 * @param {Object} res - پاسخ اکسپرس
 * @param {Function} next - تابع بعدی میدلور
 */
const admin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Permission denied: Admin role required",
      });
    }

    next();
  } catch (error) {
    logger.error(`Admin middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * میدلور معاف از احراز هویت برای Swagger UI
 * @param {Object} req - درخواست اکسپرس
 * @param {Object} res - پاسخ اکسپرس
 * @param {Function} next - تابع بعدی میدلور
 */
const allowSwagger = (req, res, next) => {
  if (req.originalUrl.startsWith("/api-docs")) {
    return next();
  }

  // اعمال احراز هویت برای سایر مسیرها
  return auth(req, res, next);
};

/**
 * میدلور اختیاری برای احراز هویت
 * اگر توکن موجود باشد، اطلاعات کاربر را اضافه می‌کند، در غیر این صورت ادامه می‌دهد
 * @param {Object} req - درخواست اکسپرس
 * @param {Object} res - پاسخ اکسپرس
 * @param {Function} next - تابع بعدی میدلور
 */
const optionalAuth = (req, res, next) => {
  try {
    // گرفتن توکن از هدر
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // اگر توکن وجود ندارد، ادامه بده بدون افزودن اطلاعات کاربر
      return next();
    }

    // جدا کردن توکن از هدر
    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    try {
      // بررسی اعتبار توکن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // افزودن اطلاعات کاربر به درخواست
      req.user = decoded;
    } catch (error) {
      // در صورت خطا در توکن، بدون اضافه کردن اطلاعات کاربر ادامه می‌دهیم
      logger.warn(`Optional auth: Invalid token: ${error.message}`);
    }

    next();
  } catch (error) {
    logger.error(`Optional auth middleware error: ${error.message}`);
    next();
  }
};

module.exports = {
  auth,
  admin,
  allowSwagger,
  optionalAuth,
};
