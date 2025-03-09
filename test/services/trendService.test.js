const trendService = require("../../src/services/trendService");
const Trend = require("../../src/models/trend");
const humanizer = require("../../src/utils/humanizer");

// Mock dependencies
jest.mock("../../src/models/trend");
jest.mock("../../src/utils/humanizer");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe("Trend Service", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock global.ig
    global.ig = {
      feed: {
        tags: jest.fn().mockReturnValue({
          items: jest.fn().mockResolvedValue([
            {
              id: "test-post-id-1",
              code: "abc123",
              like_count: 100,
              comment_count: 10,
              caption: { text: "Test post #تست #ایران #عکاسی" },
              user: {
                username: "test_user",
                pk: "123456",
                full_name: "Test User",
              },
              image_versions2: {
                candidates: [{ url: "https://example.com/image1.jpg" }],
              },
            },
            {
              id: "test-post-id-2",
              code: "def456",
              like_count: 200,
              comment_count: 20,
              caption: { text: "Another post #عکاسی #هنر #طبیعت" },
              user: {
                username: "another_user",
                pk: "654321",
                full_name: "Another User",
              },
              image_versions2: {
                candidates: [{ url: "https://example.com/image2.jpg" }],
              },
            },
          ]),
        }),
      },
    };

    // Mock Trend model
    Trend.getActiveTrends = jest.fn().mockResolvedValue([
      {
        _id: "trend-id-1",
        keyword: "عکاسی",
        hashtag: "عکاسی",
        category: "هنری",
        postCount: 1000,
        engagementScore: 150,
        relatedHashtags: ["دوربین", "فوتوگرافی", "هنر"],
        isActive: true,
        lastFetchDate: new Date(),
      },
      {
        _id: "trend-id-2",
        keyword: "طبیعت گردی",
        hashtag: "طبیعت_ایران",
        category: "عمومی",
        postCount: 800,
        engagementScore: 120,
        relatedHashtags: ["ایران_زیبا", "سفر", "طبیعت"],
        isActive: true,
        lastFetchDate: new Date(),
      },
    ]);

    Trend.defaultTrends = [
      {
        keyword: "طبیعت گردی",
        hashtag: "طبیعت_ایران",
        category: "عمومی",
        language: "fa",
        description: "مکان‌های زیبای طبیعی ایران، طبیعت‌گردی و گردشگری",
        relatedHashtags: [
          "ایران_زیبا",
          "طبیعت_گردی",
          "کوهنوردی",
          "جنگل",
          "دریا",
        ],
      },
      {
        keyword: "آشپزی ایرانی",
        hashtag: "آشپزی_ایرانی",
        category: "آشپزی",
        language: "fa",
        description: "دستور پخت غذاهای سنتی و مدرن ایرانی",
        relatedHashtags: [
          "دستپخت",
          "آشپزباشی",
          "غذای_خانگی",
          "آشپزخانه",
          "فودبلاگر",
        ],
      },
    ];

    Trend.find = jest.fn().mockReturnThis();
    Trend.sort = jest.fn().mockReturnThis();
    Trend.limit = jest.fn().mockResolvedValue([
      {
        _id: "trend-id-1",
        keyword: "عکاسی",
        hashtag: "عکاسی",
        category: "هنری",
        postCount: 1000,
        engagementScore: 150,
        relatedHashtags: ["دوربین", "فوتوگرافی", "هنر"],
        isActive: true,
        lastFetchDate: new Date(),
      },
    ]);

    Trend.findOne = jest.fn().mockResolvedValue({
      _id: "trend-id-1",
      keyword: "عکاسی",
      hashtag: "عکاسی",
      category: "هنری",
      postCount: 1000,
      engagementScore: 150,
      relatedHashtags: ["دوربین", "فوتوگرافی", "هنر"],
      isActive: true,
      lastFetchDate: new Date(),
      updateStats: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    });

    Trend.findById = jest.fn().mockResolvedValue({
      _id: "trend-id-1",
      keyword: "عکاسی",
      hashtag: "عکاسی",
      category: "هنری",
      postCount: 1000,
      engagementScore: 150,
      relatedHashtags: ["دوربین", "فوتوگرافی", "هنر"],
      samplePosts: [],
      isActive: true,
      lastFetchDate: new Date(),
      updateStats: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    });

    Trend.create = jest.fn().mockResolvedValue({
      _id: "new-trend-id",
      keyword: "تکنولوژی",
      hashtag: "تکنولوژی_روز",
      category: "تکنولوژی",
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
    });

    Trend.countDocuments = jest.fn().mockResolvedValue(2);
    Trend.distinct = jest
      .fn()
      .mockResolvedValue(["عمومی", "هنری", "آشپزی", "تکنولوژی"]);

    // Mock humanizer
    humanizer.simulateHumanDelay.mockResolvedValue(true);
  });

  describe("getTrendingHashtags", () => {
    it("should retrieve active trends", async () => {
      const trends = await trendService.getTrendingHashtags(5);

      expect(trends).toHaveLength(2);
      expect(Trend.getActiveTrends).toHaveBeenCalledWith(5, null);
      expect(trends[0].hashtag).toBe("عکاسی");
      expect(trends[1].hashtag).toBe("طبیعت_ایران");
    });

    it("should initialize default trends if none exist", async () => {
      // Mock empty trends first call, then return values after initialization
      Trend.getActiveTrends.mockResolvedValueOnce([]);

      // Mock initializeDefaultTrends
      const originalInitializeDefaultTrends =
        trendService.initializeDefaultTrends;
      trendService.initializeDefaultTrends = jest.fn().mockResolvedValue(true);

      await trendService.getTrendingHashtags();

      expect(trendService.initializeDefaultTrends).toHaveBeenCalled();
      expect(Trend.getActiveTrends).toHaveBeenCalledTimes(2);

      // Restore original method
      trendService.initializeDefaultTrends = originalInitializeDefaultTrends;
    });

    it("should filter by category if provided", async () => {
      await trendService.getTrendingHashtags(5, "هنری");

      expect(Trend.getActiveTrends).toHaveBeenCalledWith(5, "هنری");
    });
  });

  describe("initializeDefaultTrends", () => {
    it("should create default trends if none exist", async () => {
      // Mock no existing trends
      Trend.countDocuments.mockResolvedValueOnce(0);

      await trendService.initializeDefaultTrends();

      expect(Trend.create).toHaveBeenCalledTimes(Trend.defaultTrends.length);
    });

    it("should not create default trends if some already exist", async () => {
      // Mock existing trends
      Trend.countDocuments.mockResolvedValueOnce(5);

      await trendService.initializeDefaultTrends();

      expect(Trend.create).not.toHaveBeenCalled();
    });
  });

  describe("searchRelatedHashtags", () => {
    it("should find related hashtags from post captions", async () => {
      const relatedHashtags = await trendService.searchRelatedHashtags("عکاسی");

      expect(relatedHashtags).toContain("تست");
      expect(relatedHashtags).toContain("ایران");
      expect(relatedHashtags).toContain("هنر");
      expect(relatedHashtags).toContain("طبیعت");
      expect(global.ig.feed.tags).toHaveBeenCalledWith("عکاسی");
    });

    it("should handle empty results", async () => {
      // Mock empty posts
      global.ig.feed.tags.mockReturnValueOnce({
        items: jest.fn().mockResolvedValue([]),
      });

      const relatedHashtags = await trendService.searchRelatedHashtags(
        "نامعتبر"
      );

      expect(relatedHashtags).toEqual([]);
    });

    it("should handle posts without captions", async () => {
      // Mock posts without captions
      global.ig.feed.tags.mockReturnValueOnce({
        items: jest.fn().mockResolvedValue([
          {
            id: "test-post-id-1",
            caption: null,
          },
          {
            id: "test-post-id-2",
            caption: { text: null },
          },
        ]),
      });

      const relatedHashtags = await trendService.searchRelatedHashtags("تست");

      expect(relatedHashtags).toEqual([]);
    });
  });

  describe("updateTrendStats", () => {
    it("should update trend statistics successfully", async () => {
      const result = await trendService.updateTrendStats("trend-id-1");

      expect(result).toBe(true);
      expect(Trend.findById).toHaveBeenCalledWith("trend-id-1");
      expect(global.ig.feed.tags).toHaveBeenCalledWith("عکاسی");
      expect(Trend.findById().updateStats).toHaveBeenCalled();
      expect(Trend.findById().save).toHaveBeenCalled();
    });

    it("should handle trend not found", async () => {
      // Mock trend not found
      Trend.findById.mockResolvedValueOnce(null);

      await expect(
        trendService.updateTrendStats("nonexistent-id")
      ).rejects.toThrow("not found");
    });

    it("should handle no posts for hashtag", async () => {
      // Mock empty posts
      global.ig.feed.tags.mockReturnValueOnce({
        items: jest.fn().mockResolvedValue([]),
      });

      const result = await trendService.updateTrendStats("trend-id-1");

      expect(result).toBe(false);
    });
  });

  describe("findActiveUsersInTrend", () => {
    it("should find active users in a trending hashtag", async () => {
      const users = await trendService.findActiveUsersInTrend("عکاسی", 10);

      expect(users).toHaveLength(2);
      expect(users[0].username).toBe("another_user"); // Sorted by engagement
      expect(users[1].username).toBe("test_user");
      expect(global.ig.feed.tags).toHaveBeenCalledWith("عکاسی");
    });

    it("should handle empty results", async () => {
      // Mock empty posts
      global.ig.feed.tags.mockReturnValueOnce({
        items: jest.fn().mockResolvedValue([]),
      });

      const users = await trendService.findActiveUsersInTrend("نامعتبر");

      expect(users).toEqual([]);
    });

    it("should respect the limit parameter", async () => {
      const users = await trendService.findActiveUsersInTrend("عکاسی", 1);

      expect(users).toHaveLength(1);
      expect(users[0].username).toBe("another_user"); // Highest engagement
    });
  });

  describe("discoverNewTrends", () => {
    it("should discover new trends", async () => {
      // Mock searchRelatedHashtags to return controlled results
      const originalSearchRelatedHashtags = trendService.searchRelatedHashtags;
      trendService.searchRelatedHashtags = jest
        .fn()
        .mockResolvedValue(["تکنولوژی_روز", "موبایل", "لپتاپ"]);

      // Mock finding existing trend (not found first time, then found for update)
      Trend.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        _id: "trend-id-3",
        updateStats: jest.fn().mockResolvedValue(true),
      });

      // Mock posts with high engagement
      global.ig.feed.tags.mockReturnValueOnce({
        items: jest.fn().mockResolvedValue(
          Array(20)
            .fill()
            .map(() => ({
              id: `test-post-id-${Math.random()}`,
              like_count: 500,
              comment_count: 50,
            }))
        ),
      });

      const newTrendsFound = await trendService.discoverNewTrends();

      expect(newTrendsFound).toBeGreaterThan(0);
      expect(Trend.create).toHaveBeenCalled();

      // Restore original method
      trendService.searchRelatedHashtags = originalSearchRelatedHashtags;
    });

    it("should update existing trends rather than creating duplicates", async () => {
      // Mock searchRelatedHashtags
      const originalSearchRelatedHashtags = trendService.searchRelatedHashtags;
      trendService.searchRelatedHashtags = jest
        .fn()
        .mockResolvedValue(["عکاسی", "دوربین"]);

      // Mock updateTrendStats
      const originalUpdateTrendStats = trendService.updateTrendStats;
      trendService.updateTrendStats = jest.fn().mockResolvedValue(true);

      // Mock find existing trend
      Trend.findOne.mockResolvedValueOnce({
        _id: "trend-id-1",
        hashtag: "عکاسی",
      });

      await trendService.discoverNewTrends();

      expect(trendService.updateTrendStats).toHaveBeenCalled();
      expect(Trend.create).not.toHaveBeenCalled();

      // Restore original methods
      trendService.searchRelatedHashtags = originalSearchRelatedHashtags;
      trendService.updateTrendStats = originalUpdateTrendStats;
    });
  });

  describe("findUsersToInteract", () => {
    it("should find users to interact with from multiple trends", async () => {
      // Mock findActiveUsersInTrend to return controlled results
      const originalFindActiveUsersInTrend =
        trendService.findActiveUsersInTrend;
      trendService.findActiveUsersInTrend = jest
        .fn()
        .mockResolvedValueOnce([
          { userId: "123", username: "user1", engagement: 100 },
          { userId: "456", username: "user2", engagement: 80 },
        ])
        .mockResolvedValueOnce([
          { userId: "789", username: "user3", engagement: 150 },
          { userId: "123", username: "user1", engagement: 90 }, // Duplicate user with different engagement
        ]);

      const users = await trendService.findUsersToInteract(3);

      // Should contain 3 users, with the duplicate removed
      expect(users).toHaveLength(3);

      // Should be sorted by engagement
      expect(users[0].username).toBe("user3");
      expect(users[0].engagement).toBe(150);

      // The duplicate user should use the higher engagement score
      const user1 = users.find((u) => u.username === "user1");
      expect(user1.engagement).toBe(100);

      // Restore original method
      trendService.findActiveUsersInTrend = originalFindActiveUsersInTrend;
    });

    it("should handle case with no active trends", async () => {
      // Mock no active trends
      Trend.getActiveTrends.mockResolvedValueOnce([]);

      const users = await trendService.findUsersToInteract();

      expect(users).toEqual([]);
    });
  });

  describe("updateAllTrends", () => {
    it("should update all active trends and discover new ones", async () => {
      // Mock updateTrendStats
      const originalUpdateTrendStats = trendService.updateTrendStats;
      trendService.updateTrendStats = jest.fn().mockResolvedValue(true);

      // Mock discoverNewTrends
      const originalDiscoverNewTrends = trendService.discoverNewTrends;
      trendService.discoverNewTrends = jest.fn().mockResolvedValue(3);

      const result = await trendService.updateAllTrends();

      expect(result.updatedCount).toBe(2); // 2 existing trends
      expect(result.newTrendsCount).toBe(3); // 3 new trends
      expect(result.totalTrends).toBe(5); // 2 existing + 3 new
      expect(trendService.updateTrendStats).toHaveBeenCalledTimes(2);
      expect(trendService.discoverNewTrends).toHaveBeenCalled();

      // Restore original methods
      trendService.updateTrendStats = originalUpdateTrendStats;
      trendService.discoverNewTrends = originalDiscoverNewTrends;
    });
  });

  describe("getCategoryForTopic", () => {
    it("should return correct category for known topics", () => {
      expect(trendService.getCategoryForTopic("عکاسی")).toBe("هنری");
      expect(trendService.getCategoryForTopic("آشپزی")).toBe("آشپزی");
      expect(trendService.getCategoryForTopic("طبیعت گردی")).toBe("عمومی");
    });

    it("should return default category for unknown topics", () => {
      expect(trendService.getCategoryForTopic("ناشناخته")).toBe("عمومی");
    });
  });
});
