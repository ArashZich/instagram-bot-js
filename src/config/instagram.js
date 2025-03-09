/**
 * Instagram configuration settings
 * These settings control the bot behavior to mimic human activity
 */

module.exports = {
  // Daily Limits - Stay well below Instagram limits to avoid detection
  limits: {
    likes: {
      maxPerHour: 20,
      maxPerDay: 100,
      minDelaySeconds: 24,
      maxDelaySeconds: 55,
    },
    comments: {
      maxPerHour: 10,
      maxPerDay: 50,
      minDelaySeconds: 60,
      maxDelaySeconds: 120,
    },
    follows: {
      maxPerHour: 10,
      maxPerDay: 50,
      minDelaySeconds: 45,
      maxDelaySeconds: 90,
    },
    unfollows: {
      maxPerHour: 10,
      maxPerDay: 50,
      minDelaySeconds: 45,
      maxDelaySeconds: 90,
    },
    directMessages: {
      maxPerHour: 8,
      maxPerDay: 40,
      minDelaySeconds: 60,
      maxDelaySeconds: 180,
    },
    storyInteractions: {
      maxPerHour: 20,
      maxPerDay: 100,
      minDelaySeconds: 5,
      maxDelaySeconds: 25,
    },
  },

  // Time ranges for activity (to mimic human sleep patterns - in 24h format)
  activityTimeRanges: {
    weekday: { start: 8, end: 23 },
    weekend: { start: 10, end: 24 },
  },

  // Search related settings
  search: {
    // How many posts to analyze for each hashtag
    postsPerHashtag: 15,

    // Maximum hashtags to search in one session
    maxHashtagsPerSession: 5,

    // Types of content to prioritize
    contentPriorities: ["posts", "reels", "stories"],

    // Minimum engagement rate to interact with (likes+comments / followers)
    minEngagementRate: 0.01,

    // Maximum followers to consider an account "too big" for interaction
    maxFollowers: 100000,
  },

  // Comment generation settings
  comments: {
    // Minimum and maximum comment length
    minLength: 4,
    maxLength: 25,

    // Include emoji probability (0-1)
    emojiProbability: 0.7,

    // Maximum emoji per comment
    maxEmojis: 2,
  },

  // Direct message settings
  directMessages: {
    // Minimum and maximum DM length
    minLength: 10,
    maxLength: 80,

    // Include emoji probability (0-1)
    emojiProbability: 0.5,

    // Maximum emoji per DM
    maxEmojis: 2,

    // Probability of including a question (0-1)
    questionProbability: 0.7,
  },

  // Human simulation settings
  humanization: {
    // Random delay between actions
    randomDelayEnabled: true,

    // Typing simulation (ms per character)
    typingSpeedMinMs: 100,
    typingSpeedMaxMs: 300,

    // Probability of making a typo (0-1)
    typoProbability: 0.05,

    // Probability of immediately correcting a typo (0-1)
    typoFixProbability: 0.9,

    // Randomize capitalization and punctuation slightly
    textRandomizationEnabled: true,

    // Simulate scrolling behavior
    scrollingEnabled: true,

    // View profile before interacting probability (0-1)
    viewProfileBeforeInteractProbability: 0.7,
  },
};
