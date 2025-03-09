const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Account = require("../../src/models/account");

// Mock bcrypt
jest.mock("bcryptjs");

describe("Account Model", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGO_URI_TEST ||
        "mongodb://localhost:27017/instagram-bot-test",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Account.deleteMany({});

    // Mock bcrypt functions
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashed_password");
    bcrypt.compare.mockResolvedValue(true);
  });

  it("should create a new account successfully", async () => {
    const accountData = {
      username: "test_user",
      password: "password123",
      email: "test@example.com",
      isActive: true,
    };

    const account = new Account(accountData);
    const savedAccount = await account.save();

    // Check that account was saved
    expect(savedAccount._id).toBeDefined();
    expect(savedAccount.username).toBe(accountData.username);
    expect(savedAccount.email).toBe(accountData.email);
    expect(savedAccount.isActive).toBe(true);

    // Check defaults
    expect(savedAccount.dailyStats.likes).toBe(0);
    expect(savedAccount.dailyStats.comments).toBe(0);
    expect(savedAccount.errorCount).toBe(0);
    expect(savedAccount.lastError).toBe(null);
  });

  it("should hash password before saving", async () => {
    const account = new Account({
      username: "password_test",
      password: "original_password",
      email: "password@example.com",
    });

    await account.save();

    // Check if bcrypt was called
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith("original_password", "salt");

    // Check if password was replaced with hash
    expect(account.password).toBe("hashed_password");
  });

  it("should not hash password if not modified", async () => {
    // Create account first
    const account = new Account({
      username: "existing_user",
      password: "existing_password",
      email: "existing@example.com",
    });

    await account.save();

    // Reset mock counts
    bcrypt.genSalt.mockClear();
    bcrypt.hash.mockClear();

    // Update account without changing password
    account.email = "updated@example.com";
    await account.save();

    // Verify bcrypt not called
    expect(bcrypt.genSalt).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("should verify password correctly", async () => {
    const account = new Account({
      username: "verify_user",
      password: "test_password",
      email: "verify@example.com",
    });

    await account.save();

    // Test password verification
    const isMatch = await account.matchPassword("test_password");

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "test_password",
      "hashed_password"
    );
    expect(isMatch).toBe(true);
  });

  it("should update stats correctly", async () => {
    const account = new Account({
      username: "stats_user",
      password: "password",
      dailyStats: {
        likes: 10,
        comments: 5,
        follows: 3,
        unfollows: 1,
        directMessages: 2,
        storyViews: 15,
      },
    });

    await account.save();

    // Update likes
    await account.updateStats("likes");

    // Reload account
    const updatedAccount = await Account.findOne({ username: "stats_user" });

    expect(updatedAccount.dailyStats.likes).toBe(11);
    expect(updatedAccount.dailyStats.comments).toBe(5); // unchanged
  });

  it("should reset daily stats correctly", async () => {
    const account = new Account({
      username: "reset_user",
      password: "password",
      dailyStats: {
        likes: 10,
        comments: 5,
        follows: 3,
        unfollows: 1,
        directMessages: 2,
        storyViews: 15,
      },
    });

    await account.save();

    // Reset stats
    await account.resetDailyStats();

    // Reload account
    const updatedAccount = await Account.findOne({ username: "reset_user" });

    // All daily stats should be reset to 0
    expect(updatedAccount.dailyStats.likes).toBe(0);
    expect(updatedAccount.dailyStats.comments).toBe(0);
    expect(updatedAccount.dailyStats.follows).toBe(0);
    expect(updatedAccount.dailyStats.unfollows).toBe(0);
    expect(updatedAccount.dailyStats.directMessages).toBe(0);
    expect(updatedAccount.dailyStats.storyViews).toBe(0);
  });

  it("should record errors correctly", async () => {
    const account = new Account({
      username: "error_user",
      password: "password",
      errorCount: 0,
      lastError: null,
    });

    await account.save();

    // Record error
    const errorMessage = "Test error message";
    await account.recordError(errorMessage);

    // Reload account
    const updatedAccount = await Account.findOne({ username: "error_user" });

    expect(updatedAccount.errorCount).toBe(1);
    expect(updatedAccount.lastError).toBe(errorMessage);
  });

  it("should enforce required fields", async () => {
    const accountWithoutUsername = new Account({
      password: "password123",
      email: "nouser@example.com",
    });

    // Expect validation error
    await expect(accountWithoutUsername.save()).rejects.toThrow();

    const accountWithoutPassword = new Account({
      username: "nopassword_user",
      email: "nopassword@example.com",
    });

    // Expect validation error
    await expect(accountWithoutPassword.save()).rejects.toThrow();
  });

  it("should enforce unique username", async () => {
    // Create first account
    const account1 = new Account({
      username: "duplicate_user",
      password: "password1",
      email: "dup1@example.com",
    });

    await account1.save();

    // Try to create account with same username
    const account2 = new Account({
      username: "duplicate_user",
      password: "password2",
      email: "dup2@example.com",
    });

    // Expect duplicate key error
    await expect(account2.save()).rejects.toThrow();
  });

  it("should validate email format", async () => {
    const accountWithInvalidEmail = new Account({
      username: "email_user",
      password: "password",
      email: "invalid-email",
    });

    // Expect validation error
    await expect(accountWithInvalidEmail.save()).rejects.toThrow();
  });
});
