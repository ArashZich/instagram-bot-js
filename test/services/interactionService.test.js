const interactionService = require("../../src/services/interactionService");
const Account = require("../../src/models/account");
const Setting = require("../../src/models/setting");
const Interaction = require("../../src/models/interaction");
const humanizer = require("../../src/utils/humanizer");

// Mock dependencies
jest.mock("../../src/models/account");
jest.mock("../../src/models/setting");
jest.mock("../../src/models/interaction");
jest.mock("../../src/utils/humanizer");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe("Interaction Service", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock global.ig
    global.ig = {
      media: {
        like: jest.fn().mockResolvedValue({ status: "ok" }),
        comment: jest
          .fn()
          .mockResolvedValue({ id: "test-comment-id", text: "Test comment" }),
        info: jest.fn().mockResolvedValue({
          items: [
            {
              id: "test-media-id",
              like_count: 100,
              comment_count: 10,
              user: { username: "test_user", pk: "123456" },
            },
          ],
        }),
      },
      user: {
        searchExact: jest
          .fn()
          .mockResolvedValue({ pk: "123456", username: "test_user" }),
        info: jest.fn().mockResolvedValue({
          pk: "123456",
          username: "test_user",
          full_name: "Test User",
          follower_count: 500,
          following_count: 300,
          media_count: 50,
          is_private: false,
        }),
      },
      feed: {
        user: jest.fn().mockReturnValue({
          items: jest.fn().mockResolvedValue([
            {
              id: "test-media-id-1",
              code: "abc123",
              like_count: 100,
              comment_count: 10,
              caption: { text: "Test post #تست" },
              user: { username: "test_user", pk: "123456" },
              media_type: 1,
            },
          ]),
        }),
        userStory: jest.fn().mockReturnValue({
          items: jest
            .fn()
            .mockResolvedValue([
              { id: "test-story-id-1", taken_at: Date.now() / 1000 },
            ]),
        }),
      },
      story: {
        seen: jest.fn().mockResolvedValue({ status: "ok" }),
      },
      entity: {
        directThread: jest.fn().mockReturnValue({
          broadcastText: jest
            .fn()
            .mockResolvedValue({ thread_id: "test-thread-id", status: "ok" }),
        }),
      },
      friendship: {
        show: jest.fn().mockResolvedValue({ followed_by: true }),
      },
    };

    // Mock active settings
    Setting.getActiveSettings.mockResolvedValue({
      enabledFeatures: {
        like: true,
        comment: true,
        follow: false,
        unfollow: false,
        directMessage: true,
        viewStory: true,
      },
      limits: {
        dailyLikes: 50,
        dailyComments: 20,
        dailyDirectMessages: 5,
        dailyStoryViews: 50,
      },
      humanization: {
        randomizeTimeBetweenActions: true,
        simulateTypingSpeed: true,
      },
    });

    // Mock active account
    Account.findOne.mockResolvedValue({
      _id: "test-account-id",
      username: "bot_account",
      dailyStats: {
        likes: 10,
        comments: 5,
        directMessages: 2,
        storyViews: 15,
      },
      updateStats: jest.fn().mockResolvedValue(true),
      recordError: jest.fn().mockResolvedValue(true),
    });

    // Mock Interaction model
    Interaction.recordInteraction = jest.fn().mockResolvedValue({
      _id: "test-interaction-id",
      targetUsername: "test_user",
      targetUserId: "123456",
      mediaId: "test-media-id",
      mediaType: "post",
      interactionType: "like",
      botAccount: "test-account-id",
      successful: true,
      createdAt: new Date(),
    });

    Interaction.checkPreviousInteraction = jest.fn().mockResolvedValue(null);

    // Mock humanizer
    humanizer.simulateHumanDelay.mockResolvedValue(true);
    humanizer.simulateTyping.mockResolvedValue(true);
    humanizer.shouldDoAction.mockReturnValue(true);
  });

  describe("likeMedia", () => {
    it("should like media successfully", async () => {
      const result = await interactionService.likeMedia(
        "test-media-id",
        "test_user",
        "post"
      );

      expect(result).toBe(true);
      expect(global.ig.media.like).toHaveBeenCalledWith({
        mediaId: "test-media-id",
        moduleInfo: { module_name: "profile" },
      });
      expect(Account.findOne().updateStats).toHaveBeenCalledWith("likes");
      expect(Interaction.recordInteraction).toHaveBeenCalled();
    });

    it("should not like when liking is disabled", async () => {
      // Override settings to disable likes
      Setting.getActiveSettings.mockResolvedValueOnce({
        enabledFeatures: { like: false },
        humanization: { randomizeTimeBetweenActions: true },
      });

      const result = await interactionService.likeMedia(
        "test-media-id",
        "test_user",
        "post"
      );

      expect(result).toBe(false);
      expect(global.ig.media.like).not.toHaveBeenCalled();
    });

    it("should handle errors when liking media", async () => {
      // Mock like failure
      global.ig.media.like.mockRejectedValueOnce(new Error("API error"));

      const result = await interactionService.likeMedia(
        "test-media-id",
        "test_user",
        "post"
      );

      expect(result).toBe(false);
      expect(Account.findOne().recordError).toHaveBeenCalled();
    });
  });

  describe("commentOnMedia", () => {
    it("should comment on media successfully", async () => {
      const result = await interactionService.commentOnMedia(
        "test-media-id",
        "test_user",
        "general",
        "post"
      );

      expect(result.success).toBe(true);
      expect(global.ig.media.comment).toHaveBeenCalled();
      expect(humanizer.simulateTyping).toHaveBeenCalled();
      expect(Account.findOne().updateStats).toHaveBeenCalledWith("comments");
      expect(Interaction.recordInteraction).toHaveBeenCalled();
    });

    it("should not comment when commenting is disabled", async () => {
      // Override settings to disable comments
      Setting.getActiveSettings.mockResolvedValueOnce({
        enabledFeatures: { comment: false },
        humanization: { randomizeTimeBetweenActions: true },
      });

      const result = await interactionService.commentOnMedia(
        "test-media-id",
        "test_user",
        "general",
        "post"
      );

      expect(result.success).toBe(false);
      expect(global.ig.media.comment).not.toHaveBeenCalled();
    });

    it("should handle errors when commenting on media", async () => {
      // Mock comment failure
      global.ig.media.comment.mockRejectedValueOnce(new Error("API error"));

      const result = await interactionService.commentOnMedia(
        "test-media-id",
        "test_user",
        "general",
        "post"
      );

      expect(result.success).toBe(false);
      expect(Account.findOne().recordError).toHaveBeenCalled();
    });
  });

  describe("sendDirectMessage", () => {
    it("should send direct message successfully", async () => {
      const result = await interactionService.sendDirectMessage(
        "123456",
        "test_user",
        "معرفی و آشنایی"
      );

      expect(result.success).toBe(true);
      expect(global.ig.entity.directThread).toHaveBeenCalledWith(["123456"]);
      expect(global.ig.entity.directThread().broadcastText).toHaveBeenCalled();
      expect(humanizer.simulateTyping).toHaveBeenCalled();
      expect(Account.findOne().updateStats).toHaveBeenCalledWith(
        "directMessages"
      );
      expect(Interaction.recordInteraction).toHaveBeenCalled();
    });

    it("should not send DM when direct messaging is disabled", async () => {
      // Override settings to disable direct messages
      Setting.getActiveSettings.mockResolvedValueOnce({
        enabledFeatures: { directMessage: false },
        humanization: { randomizeTimeBetweenActions: true },
      });

      const result = await interactionService.sendDirectMessage(
        "123456",
        "test_user"
      );

      expect(result.success).toBe(false);
      expect(
        global.ig.entity.directThread().broadcastText
      ).not.toHaveBeenCalled();
    });

    it("should not send DM if already sent recently", async () => {
      // Mock existing DM
      Interaction.checkPreviousInteraction.mockResolvedValueOnce({
        _id: "test-interaction-id",
        createdAt: new Date(),
      });

      const result = await interactionService.sendDirectMessage(
        "123456",
        "test_user"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Already sent DM recently");
      expect(
        global.ig.entity.directThread().broadcastText
      ).not.toHaveBeenCalled();
    });
  });

  describe("viewStory", () => {
    it("should view stories successfully", async () => {
      const result = await interactionService.viewStory("123456", "test_user");

      expect(result.success).toBe(true);
      expect(global.ig.feed.userStory).toHaveBeenCalledWith("123456");
      expect(global.ig.story.seen).toHaveBeenCalled();
      expect(Account.findOne().updateStats).toHaveBeenCalledWith("storyViews");
      expect(Interaction.recordInteraction).toHaveBeenCalled();
    });

    it("should not view stories when feature is disabled", async () => {
      // Override settings to disable story viewing
      Setting.getActiveSettings.mockResolvedValueOnce({
        enabledFeatures: { viewStory: false },
        humanization: { randomizeTimeBetweenActions: true },
      });

      const result = await interactionService.viewStory("123456", "test_user");

      expect(result.success).toBe(false);
      expect(global.ig.story.seen).not.toHaveBeenCalled();
    });

    it("should handle case when user has no stories", async () => {
      // Mock empty stories
      global.ig.feed.userStory.mockReturnValueOnce({
        items: jest.fn().mockResolvedValue([]),
      });

      const result = await interactionService.viewStory("123456", "test_user");

      expect(result.success).toBe(false);
      expect(result.error).toBe("No stories found");
      expect(global.ig.story.seen).not.toHaveBeenCalled();
    });
  });

  describe("interactWithUser", () => {
    it("should perform complete interaction successfully", async () => {
      // Mock methods
      const originalViewStory = interactionService.viewStory;
      const originalLikeMedia = interactionService.likeMedia;
      const originalCommentOnMedia = interactionService.commentOnMedia;
      const originalSendDirectMessage = interactionService.sendDirectMessage;

      interactionService.viewStory = jest
        .fn()
        .mockResolvedValue({ success: true });
      interactionService.likeMedia = jest.fn().mockResolvedValue(true);
      interactionService.commentOnMedia = jest
        .fn()
        .mockResolvedValue({ success: true });
      interactionService.sendDirectMessage = jest
        .fn()
        .mockResolvedValue({ success: true });

      const result = await interactionService.interactWithUser(
        "test_user",
        true
      );

      expect(result.success).toBe(true);
      expect(interactionService.viewStory).toHaveBeenCalled();
      expect(interactionService.likeMedia).toHaveBeenCalled();
      expect(interactionService.commentOnMedia).toHaveBeenCalled();
      expect(interactionService.sendDirectMessage).toHaveBeenCalled();

      // Restore original methods
      interactionService.viewStory = originalViewStory;
      interactionService.likeMedia = originalLikeMedia;
      interactionService.commentOnMedia = originalCommentOnMedia;
      interactionService.sendDirectMessage = originalSendDirectMessage;
    });

    it("should handle private accounts with limited interaction", async () => {
      // Mock private account
      global.ig.user.info.mockResolvedValueOnce({
        pk: "123456",
        username: "test_user",
        is_private: true,
        friendship_status: { following: false },
      });

      // Mock methods
      const originalViewStory = interactionService.viewStory;
      interactionService.viewStory = jest
        .fn()
        .mockResolvedValue({ success: true });

      const result = await interactionService.interactWithUser(
        "test_user",
        true
      );

      expect(result.success).toBe(true);
      expect(result.limited).toBe(true);
      expect(interactionService.viewStory).toHaveBeenCalled();

      // Restore original method
      interactionService.viewStory = originalViewStory;
    });

    it("should handle user not found", async () => {
      // Mock user not found
      global.ig.user.searchExact.mockResolvedValueOnce(null);

      const result = await interactionService.interactWithUser(
        "nonexistent_user"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });
});
