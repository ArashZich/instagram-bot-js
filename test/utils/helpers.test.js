const fs = require("fs").promises;
const path = require("path");
const helpers = require("../../src/utils/helpers");

// Mock fs
jest.mock("fs", () => ({
  promises: {
    access: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

// Mock logger
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe("Helpers Utility Functions", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe("generateRandomString", () => {
    it("should generate string of specified length", () => {
      const result1 = helpers.generateRandomString(10);
      const result2 = helpers.generateRandomString(20);

      expect(result1.length).toBe(10);
      expect(result2.length).toBe(20);
    });

    it("should generate different strings on each call", () => {
      const result1 = helpers.generateRandomString(10);
      const result2 = helpers.generateRandomString(10);

      expect(result1).not.toEqual(result2);
    });
  });

  describe("generateUniqueFileName", () => {
    it("should generate unique filename with original extension", () => {
      const originalName = "test-file.jpg";
      const result = helpers.generateUniqueFileName(originalName);

      // Check format: timestamp_randomstring.extension
      expect(result).toMatch(/^\d+_[a-zA-Z0-9]+\.jpg$/);
    });

    it("should handle filenames without extension", () => {
      const originalName = "test-file";
      const result = helpers.generateUniqueFileName(originalName);

      // Should still generate a unique name
      expect(result).toMatch(/^\d+_[a-zA-Z0-9]+$/);
    });
  });

  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2023-05-15T12:30:45Z");
      const formattedDate = helpers.formatDate(date);

      expect(formattedDate).toBe("2023-05-15");
    });

    it("should handle string date input", () => {
      const dateString = "2023-05-15T12:30:45Z";
      const formattedDate = helpers.formatDate(dateString);

      expect(formattedDate).toBe("2023-05-15");
    });
  });

  describe("sleep", () => {
    it("should delay execution for specified time", async () => {
      jest.useFakeTimers();

      const sleepPromise = helpers.sleep(1000);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      await sleepPromise;

      // If we get here without errors, the test passes
      expect(true).toBe(true);

      jest.useRealTimers();
    });
  });

  describe("fileExists", () => {
    it("should return true if file exists", async () => {
      // Mock successful fs.access
      fs.access.mockResolvedValueOnce();

      const result = await helpers.fileExists("/path/to/file.txt");

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should return false if file does not exist", async () => {
      // Mock fs.access error
      fs.access.mockRejectedValueOnce(new Error("File not found"));

      const result = await helpers.fileExists("/path/to/nonexistent.txt");

      expect(result).toBe(false);
      expect(fs.access).toHaveBeenCalledWith("/path/to/nonexistent.txt");
    });
  });

  describe("isBeforeToday", () => {
    it("should return true for dates before today", () => {
      // Yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(helpers.isBeforeToday(yesterday)).toBe(true);
    });

    it("should return false for today", () => {
      // Today
      const today = new Date();

      expect(helpers.isBeforeToday(today)).toBe(false);
    });

    it("should return false for future dates", () => {
      // Tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(helpers.isBeforeToday(tomorrow)).toBe(false);
    });
  });

  describe("daysBetween", () => {
    it("should calculate correct number of days between dates", () => {
      const start = new Date("2023-05-01");
      const end = new Date("2023-05-10");

      expect(helpers.daysBetween(start, end)).toBe(9);
    });

    it("should handle string date inputs", () => {
      expect(helpers.daysBetween("2023-05-01", "2023-05-10")).toBe(9);
    });

    it("should return absolute difference regardless of order", () => {
      expect(helpers.daysBetween("2023-05-10", "2023-05-01")).toBe(9);
    });
  });

  describe("slugify", () => {
    it("should convert text to slug format", () => {
      expect(helpers.slugify("Hello World")).toBe("hello-world");
      expect(helpers.slugify("Test String With Spaces")).toBe(
        "test-string-with-spaces"
      );
      expect(helpers.slugify("Special $%^ Characters")).toBe(
        "special-characters"
      );
    });

    it("should handle persian text", () => {
      expect(helpers.slugify("سلام دنیا")).toBe("");
    });

    it("should handle mixed text", () => {
      expect(helpers.slugify("Hello سلام World دنیا")).toBe("hello-world");
    });
  });

  describe("normalizeUsername", () => {
    it("should remove @ from beginning of username", () => {
      expect(helpers.normalizeUsername("@test_user")).toBe("test_user");
    });

    it("should convert to lowercase", () => {
      expect(helpers.normalizeUsername("TestUser")).toBe("testuser");
    });

    it("should remove invalid characters", () => {
      expect(helpers.normalizeUsername("test user!")).toBe("testuser");
    });

    it("should allow dots and underscores", () => {
      expect(helpers.normalizeUsername("test.user_")).toBe("test.user_");
    });
  });

  describe("detectLanguage", () => {
    it("should detect Persian language", () => {
      expect(helpers.detectLanguage("سلام دنیا")).toBe("fa");
    });

    it("should detect English language", () => {
      expect(helpers.detectLanguage("Hello World")).toBe("en");
    });

    it("should detect Arabic language", () => {
      expect(helpers.detectLanguage("مرحبا بالعالم")).toBe("ar");
    });

    it("should return unknown for non-text input", () => {
      expect(helpers.detectLanguage("12345")).toBe("unknown");
      expect(helpers.detectLanguage("")).toBe("unknown");
      expect(helpers.detectLanguage(null)).toBe("unknown");
    });
  });

  describe("extractHashtags", () => {
    it("should extract hashtags from text", () => {
      const text = "Check out this #awesome #photo from my #trip to #ایران";
      const hashtags = helpers.extractHashtags(text);

      expect(hashtags).toContain("awesome");
      expect(hashtags).toContain("photo");
      expect(hashtags).toContain("trip");
      expect(hashtags).toContain("ایران");
      expect(hashtags.length).toBe(4);
    });

    it("should handle text without hashtags", () => {
      expect(helpers.extractHashtags("No hashtags here")).toEqual([]);
    });

    it("should handle null or empty input", () => {
      expect(helpers.extractHashtags("")).toEqual([]);
      expect(helpers.extractHashtags(null)).toEqual([]);
    });
  });

  describe("toInteger", () => {
    it("should convert valid string to integer", () => {
      expect(helpers.toInteger("123")).toBe(123);
    });

    it("should use default value for invalid input", () => {
      expect(helpers.toInteger("abc")).toBe(0);
      expect(helpers.toInteger("abc", 10)).toBe(10);
    });

    it("should handle null and undefined", () => {
      expect(helpers.toInteger(null, 5)).toBe(5);
      expect(helpers.toInteger(undefined, 5)).toBe(5);
    });
  });

  describe("truncateText", () => {
    it("should truncate text to specified length with ellipsis", () => {
      const longText =
        "This is a very long text that needs to be truncated to a shorter length";
      const truncated = helpers.truncateText(longText, 20);

      expect(truncated.length).toBeLessThan(longText.length);
      expect(truncated.endsWith("...")).toBe(true);
    });

    it("should truncate at word boundaries", () => {
      const longText = "This is a very long text";
      const truncated = helpers.truncateText(longText, 10);

      // Should truncate at "This is a" + "..."
      expect(truncated).toBe("This is a...");
    });

    it("should not truncate text that is shorter than max length", () => {
      const shortText = "Short text";
      const result = helpers.truncateText(shortText, 20);

      expect(result).toBe(shortText);
    });
  });

  describe("sanitizeText", () => {
    it("should remove HTML tags", () => {
      const htmlText = "<p>This is <strong>bold</strong> text</p>";
      const sanitized = helpers.sanitizeText(htmlText);

      expect(sanitized).toBe("This is bold text");
    });

    it("should remove HTML entities", () => {
      const text = "Text with &lt;brackets&gt; and &amp; symbol";
      const sanitized = helpers.sanitizeText(text);

      expect(sanitized).not.toContain("&lt;");
      expect(sanitized).not.toContain("&gt;");
      expect(sanitized).not.toContain("&amp;");
    });

    it("should handle null or empty input", () => {
      expect(helpers.sanitizeText("")).toBe("");
      expect(helpers.sanitizeText(null)).toBe("");
    });
  });
});
