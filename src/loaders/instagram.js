const { IgApiClient } = require("instagram-private-api");
const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");
const Account = require("../models/account");

// Instagram client instance
let ig = null;

/**
 * Load or create state for Instagram session
 */
const loadState = async () => {
  try {
    const account = await Account.findOne({ isActive: true });
    if (!account) {
      logger.error("No active Instagram account found in database");
      throw new Error("No active Instagram account found");
    }

    // Try to load saved state if exists
    if (account.sessionData) {
      logger.info("Loading Instagram session from database");
      return JSON.parse(account.sessionData);
    }

    return null;
  } catch (error) {
    logger.error(`Error loading Instagram state: ${error.message}`);
    return null;
  }
};

/**
 * Save state for future use to avoid login limits
 */
const saveState = async (serialized) => {
  try {
    const account = await Account.findOne({ isActive: true });
    if (account) {
      account.sessionData = JSON.stringify(serialized);
      account.lastLogin = new Date();
      await account.save();
      logger.info("Instagram session saved to database");
    }
  } catch (error) {
    logger.error(`Error saving Instagram state: ${error.message}`);
  }
};

/**
 * Initialize Instagram client and login
 */
module.exports = async () => {
  try {
    // Create a new IgApiClient instance
    ig = new IgApiClient();

    // Load account info
    const account = await Account.findOne({ isActive: true });
    if (!account) {
      throw new Error("No active Instagram account found");
    }

    // Generate device
    ig.state.generateDevice(account.username);

    // Try to restore session
    const savedState = await loadState();
    if (savedState) {
      await ig.state.deserialize(savedState);

      // Verify the session is still valid
      try {
        await ig.user.info(ig.state.cookieUserId);
        logger.info("Successfully restored Instagram session");
      } catch (sessionError) {
        logger.warn("Session expired, performing fresh login");
        await performLogin(account);
      }
    } else {
      await performLogin(account);
    }

    // Expose the Instagram client globally
    global.ig = ig;

    return ig;
  } catch (error) {
    logger.error(`Instagram initialization error: ${error.message}`);
    throw error;
  }
};

/**
 * Perform fresh login to Instagram
 */
async function performLogin(account) {
  try {
    // Perform login
    logger.info(`Logging in to Instagram as ${account.username}`);
    await ig.simulate.preLoginFlow();
    const loggedInUser = await ig.account.login(
      account.username,
      account.password
    );

    // Complete login process
    await ig.simulate.postLoginFlow();

    // Save session
    const serialized = await ig.state.serialize();
    await saveState(serialized);

    logger.info(`Successfully logged in as ${loggedInUser.username}`);
    return loggedInUser;
  } catch (error) {
    logger.error(`Login error: ${error.message}`);

    // Handle common Instagram errors
    if (error.message.includes("checkpoint")) {
      logger.error(
        "Instagram checkpoint detected. Manual verification required."
      );
    } else if (error.message.includes("bad_password")) {
      logger.error("Incorrect password. Please update your credentials.");
    } else if (error.message.includes("invalid_user")) {
      logger.error("Username not found.");
    }

    throw error;
  }
}

// Export getter for Instagram client
module.exports.getIgClient = () => {
  if (!ig) {
    throw new Error("Instagram client not initialized");
  }
  return ig;
};
