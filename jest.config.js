module.exports = {
  // The test environment that will be used for testing
  testEnvironment: "node",

  // Directory containing test files
  testMatch: ["**/test/**/*.test.js"],

  // Ignore certain directories
  testPathIgnorePatterns: ["/node_modules/"],

  // Automatically clear mock calls and instances between tests
  clearMocks: true,

  // Indicates whether the coverage information should be collected
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of glob patterns indicating files to skip coverage for
  coveragePathIgnorePatterns: ["/node_modules/", "/test/"],

  // A list of reporter names for coverage
  coverageReporters: ["text", "lcov"],

  // A preset configuration for jest
  preset: "@shelf/jest-mongodb",

  // Setup files that will run before each test
  setupFilesAfterEnv: ["./test/setup.js"],

  // Maximum time in milliseconds before test is considered slow
  slowTestThreshold: 5000,

  // Timeout for async operations
  testTimeout: 30000,

  // Verbose output
  verbose: true,
};
