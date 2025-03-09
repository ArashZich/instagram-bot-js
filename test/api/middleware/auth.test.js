const jwt = require("jsonwebtoken");
const {
  auth,
  admin,
  allowSwagger,
  optionalAuth,
} = require("../../../src/api/middleware/auth");

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request, response and next function
    req = {
      headers: {},
      originalUrl: "/api/actions/status",
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    // Set JWT environment variable
    process.env.JWT_SECRET = "test-secret";
  });

  describe("auth middleware", () => {
    it("should call next if token is valid", () => {
      // Set Authorization header
      req.headers.authorization = "Bearer valid-token";

      // Mock successful verification
      jwt.verify.mockReturnValueOnce({ id: "user-id", username: "test_user" });

      // Call middleware
      auth(req, res, next);

      // Verify behavior
      expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
      expect(req.user).toEqual({ id: "user-id", username: "test_user" });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 if Authorization header is missing", () => {
      // Call middleware with no Authorization header
      auth(req, res, next);

      // Verify behavior
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("No authentication token"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token format is invalid", () => {
      // Set invalid Authorization header
      req.headers.authorization = "InvalidFormat";

      // Call middleware
      auth(req, res, next);

      // Verify behavior
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("No authentication token"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is empty", () => {
      // Set empty token
      req.headers.authorization = "Bearer ";

      // Call middleware
      auth(req, res, next);

      // Verify behavior
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Token missing"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token verification fails", () => {
      // Set Authorization header
      req.headers.authorization = "Bearer invalid-token";

      // Mock failed verification
      jwt.verify.mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });

      // Call middleware
      auth(req, res, next);

      // Verify behavior
      expect(jwt.verify).toHaveBeenCalledWith("invalid-token", "test-secret");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Invalid token"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("admin middleware", () => {
    it("should call next if user is admin", () => {
      // Set user with admin role
      req.user = { id: "user-id", username: "admin_user", role: "admin" };

      // Call middleware
      admin(req, res, next);

      // Verify behavior
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", () => {
      // No user set in request

      // Call middleware
      admin(req, res, next);

      // Verify behavior
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Authentication required"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not admin", () => {
      // Set user with non-admin role
      req.user = { id: "user-id", username: "regular_user", role: "user" };

      // Call middleware
      admin(req, res, next);

      // Verify behavior
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Permission denied"),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("allowSwagger middleware", () => {
    it("should call next without authentication for Swagger endpoints", () => {
      // Set Swagger URL
      req.originalUrl = "/api-docs/swagger-ui.css";

      // Call middleware
      allowSwagger(req, res, next);

      // Verify behavior
      expect(next).toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should use auth middleware for non-Swagger endpoints", () => {
      // Mock auth function
      const originalAuth = auth;
      auth = jest.fn().mockImplementation((req, res, next) => next());

      // Call middleware
      allowSwagger(req, res, next);

      // Verify behavior
      expect(auth).toHaveBeenCalledWith(req, res, next);

      // Restore original auth function
      auth = originalAuth;
    });
  });

  describe("optionalAuth middleware", () => {
    it("should add user to request if token is valid", () => {
      // Set Authorization header
      req.headers.authorization = "Bearer valid-token";

      // Mock successful verification
      jwt.verify.mockReturnValueOnce({ id: "user-id", username: "test_user" });

      // Call middleware
      optionalAuth(req, res, next);

      // Verify behavior
      expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
      expect(req.user).toEqual({ id: "user-id", username: "test_user" });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next without user if token is missing", () => {
      // Call middleware with no Authorization header
      optionalAuth(req, res, next);

      // Verify behavior
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next without user if token is invalid", () => {
      // Set Authorization header
      req.headers.authorization = "Bearer invalid-token";

      // Mock failed verification
      jwt.verify.mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });

      // Call middleware
      optionalAuth(req, res, next);

      // Verify behavior
      expect(jwt.verify).toHaveBeenCalledWith("invalid-token", "test-secret");
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
