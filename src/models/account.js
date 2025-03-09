const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false, // Don't return password in queries
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  sessionData: {
    type: String,
    select: false, // Keep session data private
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  errorCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
    default: null,
  },
  dailyStats: {
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    follows: {
      type: Number,
      default: 0,
    },
    unfollows: {
      type: Number,
      default: 0,
    },
    directMessages: {
      type: Number,
      default: 0,
    },
    storyViews: {
      type: Number,
      default: 0,
    },
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

// Reset daily stats at midnight
AccountSchema.methods.resetDailyStats = function () {
  this.dailyStats = {
    likes: 0,
    comments: 0,
    follows: 0,
    unfollows: 0,
    directMessages: 0,
    storyViews: 0,
  };
  return this.save();
};

// Update account stats after activity
AccountSchema.methods.updateStats = function (activityType) {
  if (this.dailyStats[activityType] !== undefined) {
    this.dailyStats[activityType] += 1;
    this.updatedAt = Date.now();
    return this.save();
  }
  return Promise.resolve(this);
};

// Record error
AccountSchema.methods.recordError = function (errorMessage) {
  this.errorCount += 1;
  this.lastError = errorMessage;
  this.updatedAt = Date.now();
  return this.save();
};

// Encrypt password using bcrypt
AccountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Check if password matches
AccountSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Account", AccountSchema);
