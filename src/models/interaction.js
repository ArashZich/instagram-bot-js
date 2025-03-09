const mongoose = require("mongoose");

const InteractionSchema = new mongoose.Schema({
  targetUsername: {
    type: String,
    required: true,
    index: true,
  },
  targetUserId: {
    type: String,
    required: true,
    index: true,
  },
  mediaId: {
    type: String,
    default: null,
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  mediaType: {
    type: String,
    enum: ["post", "story", "reel", "comment", "direct"],
    required: true,
  },
  interactionType: {
    type: String,
    enum: ["like", "comment", "view", "direct", "follow", "unfollow"],
    required: true,
  },
  content: {
    type: String,
    default: null,
  },
  hashtags: [
    {
      type: String,
    },
  ],
  successful: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  engagementRate: {
    type: Number,
    default: null,
  },
  botAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Create compound index for queries
InteractionSchema.index({ targetUserId: 1, interactionType: 1, createdAt: -1 });

// Get stats for a specific date range
InteractionSchema.statics.getStats = async function (
  accountId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        botAccount: mongoose.Types.ObjectId(accountId),
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$interactionType",
        count: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ["$successful", true] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ["$successful", false] }, 1, 0] },
        },
      },
    },
  ]);
};

// Check if user was previously interacted with
InteractionSchema.statics.checkPreviousInteraction = async function (
  accountId,
  targetUserId,
  interactionType,
  withinHours = 24
) {
  const date = new Date();
  date.setHours(date.getHours() - withinHours);

  return this.findOne({
    botAccount: accountId,
    targetUserId: targetUserId,
    interactionType: interactionType,
    createdAt: { $gte: date },
  }).sort({ createdAt: -1 });
};

// Record a new interaction
InteractionSchema.statics.recordInteraction = async function (data) {
  return this.create(data);
};

// Get most engaged users (received multiple interactions)
InteractionSchema.statics.getMostEngagedUsers = async function (
  accountId,
  limit = 10
) {
  return this.aggregate([
    {
      $match: {
        botAccount: mongoose.Types.ObjectId(accountId),
        successful: true,
      },
    },
    {
      $group: {
        _id: "$targetUserId",
        username: { $first: "$targetUsername" },
        interactionCount: { $sum: 1 },
        lastInteraction: { $max: "$createdAt" },
        interactionTypes: { $addToSet: "$interactionType" },
      },
    },
    {
      $sort: { interactionCount: -1 },
    },
    {
      $limit: limit,
    },
  ]);
};

module.exports = mongoose.model("Interaction", InteractionSchema);
