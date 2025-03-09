const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema({
  botMode: {
    type: String,
    enum: ["active", "passive", "maintenance", "stealth"],
    default: "active",
  },
  enabledFeatures: {
    like: {
      type: Boolean,
      default: true,
    },
    comment: {
      type: Boolean,
      default: true,
    },
    follow: {
      type: Boolean,
      default: false,
    },
    unfollow: {
      type: Boolean,
      default: false,
    },
    directMessage: {
      type: Boolean,
      default: true,
    },
    viewStory: {
      type: Boolean,
      default: true,
    },
  },
  schedule: {
    startHour: {
      type: Number,
      default: 9,
    },
    endHour: {
      type: Number,
      default: 23,
    },
    activeOnWeekends: {
      type: Boolean,
      default: true,
    },
    customSchedule: {
      type: Map,
      of: {
        active: Boolean,
        startHour: Number,
        endHour: Number,
      },
      default: {},
    },
  },
  limits: {
    dailyLikes: {
      type: Number,
      default: 80,
    },
    dailyComments: {
      type: Number,
      default: 30,
    },
    dailyFollows: {
      type: Number,
      default: 30,
    },
    dailyUnfollows: {
      type: Number,
      default: 30,
    },
    dailyDirectMessages: {
      type: Number,
      default: 15,
    },
    dailyStoryViews: {
      type: Number,
      default: 100,
    },
  },
  humanization: {
    minActionDelay: {
      type: Number,
      default: 30, // seconds
    },
    maxActionDelay: {
      type: Number,
      default: 90, // seconds
    },
    randomizeTimeBetweenActions: {
      type: Boolean,
      default: true,
    },
    simulateTypingSpeed: {
      type: Boolean,
      default: true,
    },
    simulateScrolling: {
      type: Boolean,
      default: true,
    },
    randomizeActions: {
      type: Boolean,
      default: true,
    },
  },
  targetCriteria: {
    minFollowers: {
      type: Number,
      default: 100,
    },
    maxFollowers: {
      type: Number,
      default: 10000,
    },
    minEngagementRate: {
      type: Number,
      default: 1, // percentage
    },
    preferredLanguages: [
      {
        type: String,
        default: ["fa"],
      },
    ],
    preferredCategories: [
      {
        type: String,
        default: ["عمومی", "سرگرمی", "هنری"],
      },
    ],
    excludedKeywords: [
      {
        type: String,
      },
    ],
  },
  commentSettings: {
    minLength: {
      type: Number,
      default: 4,
    },
    maxLength: {
      type: Number,
      default: 30,
    },
    includeEmojis: {
      type: Boolean,
      default: true,
    },
    includeQuestions: {
      type: Boolean,
      default: true,
    },
  },
  dmSettings: {
    minLength: {
      type: Number,
      default: 10,
    },
    maxLength: {
      type: Number,
      default: 100,
    },
    includeEmojis: {
      type: Boolean,
      default: true,
    },
    includeUsername: {
      type: Boolean,
      default: true,
    },
    includeGreeting: {
      type: Boolean,
      default: true,
    },
  },
  lastUpdateBy: {
    type: String,
    default: "system",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Get active settings or create default
SettingSchema.statics.getActiveSettings = async function () {
  const settings = await this.findOne().sort({ updatedAt: -1 });

  if (!settings) {
    return this.create({});
  }

  return settings;
};

// Update settings
SettingSchema.statics.updateSettings = async function (
  updatedSettings,
  updatedBy = "system"
) {
  const currentSettings = await this.getActiveSettings();

  // Apply updates
  Object.keys(updatedSettings).forEach((key) => {
    if (
      typeof updatedSettings[key] === "object" &&
      !Array.isArray(updatedSettings[key])
    ) {
      // Merge nested objects
      currentSettings[key] = {
        ...currentSettings[key],
        ...updatedSettings[key],
      };
    } else {
      // Direct assignment for primitives and arrays
      currentSettings[key] = updatedSettings[key];
    }
  });

  currentSettings.lastUpdateBy = updatedBy;
  currentSettings.updatedAt = new Date();

  return currentSettings.save();
};

// Toggle feature
SettingSchema.statics.toggleFeature = async function (
  featureName,
  enabled,
  updatedBy = "system"
) {
  const settings = await this.getActiveSettings();

  if (settings.enabledFeatures.hasOwnProperty(featureName)) {
    settings.enabledFeatures[featureName] = enabled;
    settings.lastUpdateBy = updatedBy;
    settings.updatedAt = new Date();

    return settings.save();
  }

  throw new Error(`Feature "${featureName}" not found`);
};

// Change bot mode
SettingSchema.statics.changeBotMode = async function (
  mode,
  updatedBy = "system"
) {
  const validModes = ["active", "passive", "maintenance", "stealth"];

  if (!validModes.includes(mode)) {
    throw new Error(`Invalid bot mode: ${mode}`);
  }

  const settings = await this.getActiveSettings();
  settings.botMode = mode;
  settings.lastUpdateBy = updatedBy;
  settings.updatedAt = new Date();

  return settings.save();
};

// Update limits
SettingSchema.statics.updateLimits = async function (
  newLimits,
  updatedBy = "system"
) {
  const settings = await this.getActiveSettings();

  // Apply limit updates
  Object.keys(newLimits).forEach((key) => {
    if (settings.limits.hasOwnProperty(key)) {
      settings.limits[key] = newLimits[key];
    }
  });

  settings.lastUpdateBy = updatedBy;
  settings.updatedAt = new Date();

  return settings.save();
};

// Reset to default settings
SettingSchema.statics.resetToDefaults = async function (updatedBy = "system") {
  const defaultSettings = new this();
  defaultSettings.lastUpdateBy = updatedBy;

  // Remove old settings and save new defaults
  await this.deleteMany({});
  return defaultSettings.save();
};

module.exports = mongoose.model("Setting", SettingSchema);
