const mongoose = require("mongoose");

const FollowSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ["following", "unfollowed", "pending", "rejected"],
    default: "following",
  },
  followedAt: {
    type: Date,
    default: Date.now,
  },
  unfollowedAt: {
    type: Date,
    default: null,
  },
  engagementRate: {
    type: Number,
    default: null,
  },
  followerCount: {
    type: Number,
    default: null,
  },
  followingCount: {
    type: Number,
    default: null,
  },
  didFollowBack: {
    type: Boolean,
    default: false,
  },
  followBackDate: {
    type: Date,
    default: null,
  },
  discoveryMethod: {
    type: String,
    enum: [
      "hashtag",
      "location",
      "explore",
      "suggestion",
      "followers",
      "manual",
    ],
    default: "hashtag",
  },
  discoverySource: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: null,
  },
  interactions: {
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    directMessages: {
      type: Number,
      default: 0,
    },
  },
  botAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
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

// Create compound indexes for common queries
FollowSchema.index({ botAccount: 1, status: 1, followedAt: -1 });
FollowSchema.index({ botAccount: 1, didFollowBack: 1 });

// Find users to unfollow (followed for X days with no follow back)
FollowSchema.statics.findUsersToUnfollow = async function (
  accountId,
  olderThanDays = 3,
  limit = 10
) {
  const date = new Date();
  date.setDate(date.getDate() - olderThanDays);

  return this.find({
    botAccount: accountId,
    status: "following",
    didFollowBack: false,
    followedAt: { $lte: date },
  })
    .sort({ followedAt: 1 })
    .limit(limit);
};

// Get follow/unfollow stats
FollowSchema.statics.getFollowStats = async function (
  accountId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        botAccount: mongoose.Types.ObjectId(accountId),
        $or: [
          { followedAt: { $gte: startDate, $lte: endDate } },
          { unfollowedAt: { $gte: startDate, $lte: endDate } },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalFollowed: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$followedAt", startDate] },
                  { $lte: ["$followedAt", endDate] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalUnfollowed: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$unfollowedAt", null] },
                  { $gte: ["$unfollowedAt", startDate] },
                  { $lte: ["$unfollowedAt", endDate] },
                ],
              },
              1,
              0,
            ],
          },
        },
        followBackRate: {
          $avg: { $cond: [{ $eq: ["$didFollowBack", true] }, 1, 0] },
        },
      },
    },
  ]);
};

// Update follow status
FollowSchema.methods.updateStatus = function (status) {
  this.status = status;

  if (status === "unfollowed") {
    this.unfollowedAt = new Date();
  }

  this.updatedAt = new Date();
  return this.save();
};

// Mark as followed back
FollowSchema.methods.markFollowedBack = function () {
  this.didFollowBack = true;
  this.followBackDate = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Record interaction with followed user
FollowSchema.methods.recordInteraction = function (type) {
  if (this.interactions[type] !== undefined) {
    this.interactions[type] += 1;
    this.updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model("Follow", FollowSchema);
