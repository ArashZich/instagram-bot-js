/**
 * تنظیمات اولیه برای اجرای تمامی تست‌ها
 */

// Set test environment variable
process.env.NODE_ENV = "test";

// Set test JWT secret
process.env.JWT_SECRET = "test-jwt-secret";

// Set test MongoDB URI - will be overridden by @shelf/jest-mongodb if used
process.env.MONGO_URI_TEST = "mongodb://localhost:27017/instagram-bot-test";

// Add log level to avoid console noise
process.env.LOG_LEVEL = "error";

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global before all hook
beforeAll(() => {
  // Any global setup can go here
});

// Global after all hook
afterAll(() => {
  // Any global teardown can go here
});
