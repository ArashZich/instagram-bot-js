const Setting = require("../../models/setting");
const Account = require("../../models/account");
const logger = require("../../config/logger");

/**
 * دریافت تنظیمات فعلی
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.getActiveSettings();

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    logger.error(`Error getting settings: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error retrieving settings",
      error: error.message,
    });
  }
};

/**
 * به‌روزرسانی تنظیمات
 */
exports.updateSettings = async (req, res) => {
  try {
    const updatedSettings = req.body;

    if (!updatedSettings || Object.keys(updatedSettings).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No settings provided for update",
      });
    }

    // دریافت نام کاربری برای ثبت تغییرات
    const updatedBy = req.user ? req.user.username : "API request";

    // به‌روزرسانی تنظیمات
    const result = await Setting.updateSettings(updatedSettings, updatedBy);

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings: result,
    });
  } catch (error) {
    logger.error(`Error updating settings: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error updating settings",
      error: error.message,
    });
  }
};

/**
 * فعال/غیرفعال کردن یک ویژگی
 */
exports.toggleFeature = async (req, res) => {
  try {
    const { featureName, enabled } = req.body;

    if (!featureName) {
      return res.status(400).json({
        success: false,
        message: "Feature name is required",
      });
    }

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Enabled status must be a boolean",
      });
    }

    // دریافت نام کاربری برای ثبت تغییرات
    const updatedBy = req.user ? req.user.username : "API request";

    // به‌روزرسانی وضعیت ویژگی
    const settings = await Setting.toggleFeature(
      featureName,
      enabled,
      updatedBy
    );

    res.status(200).json({
      success: true,
      message: `Feature ${featureName} ${
        enabled ? "enabled" : "disabled"
      } successfully`,
      settings,
    });
  } catch (error) {
    logger.error(`Error toggling feature: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error toggling feature",
      error: error.message,
    });
  }
};

/**
 * تغییر حالت بات
 */
exports.changeBotMode = async (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode) {
      return res.status(400).json({
        success: false,
        message: "Bot mode is required",
      });
    }

    // بررسی معتبر بودن حالت
    const validModes = ["active", "passive", "maintenance", "stealth"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid bot mode: ${mode}. Valid modes are: ${validModes.join(
          ", "
        )}`,
      });
    }

    // دریافت نام کاربری برای ثبت تغییرات
    const updatedBy = req.user ? req.user.username : "API request";

    // به‌روزرسانی حالت بات
    const settings = await Setting.changeBotMode(mode, updatedBy);

    res.status(200).json({
      success: true,
      message: `Bot mode changed to ${mode} successfully`,
      settings,
    });
  } catch (error) {
    logger.error(`Error changing bot mode: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error changing bot mode",
      error: error.message,
    });
  }
};

/**
 * به‌روزرسانی محدودیت‌ها
 */
exports.updateLimits = async (req, res) => {
  try {
    const { limits } = req.body;

    if (!limits || Object.keys(limits).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No limits provided for update",
      });
    }

    // دریافت نام کاربری برای ثبت تغییرات
    const updatedBy = req.user ? req.user.username : "API request";

    // به‌روزرسانی محدودیت‌ها
    const settings = await Setting.updateLimits(limits, updatedBy);

    res.status(200).json({
      success: true,
      message: "Limits updated successfully",
      settings,
    });
  } catch (error) {
    logger.error(`Error updating limits: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error updating limits",
      error: error.message,
    });
  }
};

/**
 * بازنشانی به تنظیمات پیش‌فرض
 */
exports.resetToDefaults = async (req, res) => {
  try {
    // دریافت نام کاربری برای ثبت تغییرات
    const updatedBy = req.user ? req.user.username : "API request";

    // بازنشانی به تنظیمات پیش‌فرض
    const settings = await Setting.resetToDefaults(updatedBy);

    res.status(200).json({
      success: true,
      message: "Settings reset to defaults successfully",
      settings,
    });
  } catch (error) {
    logger.error(`Error resetting settings: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error resetting settings",
      error: error.message,
    });
  }
};

/**
 * دریافت اطلاعات حساب‌های کاربری
 */
exports.getAccounts = async (req, res) => {
  try {
    // دریافت همه حساب‌ها با حذف اطلاعات حساس
    const accounts = await Account.find().select("-password -sessionData");

    res.status(200).json({
      success: true,
      accounts,
    });
  } catch (error) {
    logger.error(`Error getting accounts: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error retrieving accounts",
      error: error.message,
    });
  }
};

/**
 * افزودن حساب کاربری جدید
 */
exports.addAccount = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // بررسی تکراری نبودن حساب
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Account with this username already exists",
      });
    }

    // ایجاد حساب جدید
    const newAccount = new Account({
      username,
      password,
      email,
      isActive: false, // حساب جدید به صورت پیش‌فرض غیرفعال است
    });

    await newAccount.save();

    res.status(201).json({
      success: true,
      message: "Account added successfully",
      account: {
        id: newAccount._id,
        username: newAccount.username,
        email: newAccount.email,
        isActive: newAccount.isActive,
        createdAt: newAccount.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error adding account: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error adding account",
      error: error.message,
    });
  }
};

/**
 * تغییر حساب کاربری فعال
 */
exports.setActiveAccount = async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    // یافتن حساب با شناسه مورد نظر
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // غیرفعال کردن همه حساب‌ها
    await Account.updateMany({}, { isActive: false });

    // فعال کردن حساب مورد نظر
    account.isActive = true;
    await account.save();

    res.status(200).json({
      success: true,
      message: `Account ${account.username} set as active`,
      account: {
        id: account._id,
        username: account.username,
        email: account.email,
        isActive: account.isActive,
      },
    });
  } catch (error) {
    logger.error(`Error setting active account: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error setting active account",
      error: error.message,
    });
  }
};

/**
 * به‌روزرسانی اطلاعات حساب کاربری
 */
exports.updateAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { password, email } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    // یافتن حساب با شناسه مورد نظر
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // به‌روزرسانی اطلاعات حساب
    if (password) {
      account.password = password;
    }

    if (email) {
      account.email = email;
    }

    account.updatedAt = new Date();
    await account.save();

    res.status(200).json({
      success: true,
      message: `Account ${account.username} updated successfully`,
      account: {
        id: account._id,
        username: account.username,
        email: account.email,
        isActive: account.isActive,
        updatedAt: account.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating account: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error updating account",
      error: error.message,
    });
  }
};

/**
 * حذف حساب کاربری
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    // یافتن حساب با شناسه مورد نظر
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // بررسی فعال بودن حساب
    if (account.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete active account. Please set another account as active first.",
      });
    }

    // حذف حساب
    await account.remove();

    res.status(200).json({
      success: true,
      message: `Account ${account.username} deleted successfully`,
    });
  } catch (error) {
    logger.error(`Error deleting account: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Error deleting account",
      error: error.message,
    });
  }
};
