const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get settings
 *     description: Retrieve current bot settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update settings
 *     description: Update bot settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Settings object with properties to update
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.put("/", settingsController.updateSettings);

/**
 * @swagger
 * /api/settings/toggle-feature:
 *   post:
 *     summary: Toggle feature
 *     description: Enable or disable a specific feature
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featureName
 *               - enabled
 *             properties:
 *               featureName:
 *                 type: string
 *                 description: Name of the feature to toggle
 *                 enum: [like, comment, follow, unfollow, directMessage, viewStory]
 *               enabled:
 *                 type: boolean
 *                 description: Whether to enable or disable the feature
 *     responses:
 *       200:
 *         description: Feature toggled successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/toggle-feature", settingsController.toggleFeature);

/**
 * @swagger
 * /api/settings/bot-mode:
 *   post:
 *     summary: Change bot mode
 *     description: Change the operating mode of the bot
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 description: Bot operating mode
 *                 enum: [active, passive, maintenance, stealth]
 *     responses:
 *       200:
 *         description: Bot mode changed successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/bot-mode", settingsController.changeBotMode);

/**
 * @swagger
 * /api/settings/limits:
 *   post:
 *     summary: Update limits
 *     description: Update daily interaction limits
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - limits
 *             properties:
 *               limits:
 *                 type: object
 *                 properties:
 *                   dailyLikes:
 *                     type: integer
 *                   dailyComments:
 *                     type: integer
 *                   dailyFollows:
 *                     type: integer
 *                   dailyUnfollows:
 *                     type: integer
 *                   dailyDirectMessages:
 *                     type: integer
 *                   dailyStoryViews:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Limits updated successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/limits", settingsController.updateLimits);

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     summary: Reset to defaults
 *     description: Reset all settings to default values
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       500:
 *         description: Server error
 */
router.post("/reset", settingsController.resetToDefaults);

/**
 * @swagger
 * /api/settings/accounts:
 *   get:
 *     summary: Get accounts
 *     description: Retrieve all Instagram accounts
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/accounts", settingsController.getAccounts);

/**
 * @swagger
 * /api/settings/accounts:
 *   post:
 *     summary: Add account
 *     description: Add a new Instagram account
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account added successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/accounts", settingsController.addAccount);

/**
 * @swagger
 * /api/settings/accounts/active:
 *   post:
 *     summary: Set active account
 *     description: Set an account as the active account
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *             properties:
 *               accountId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Active account set successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.post("/accounts/active", settingsController.setActiveAccount);

/**
 * @swagger
 * /api/settings/accounts/{accountId}:
 *   put:
 *     summary: Update account
 *     description: Update an Instagram account
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the account to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.put("/accounts/:accountId", settingsController.updateAccount);

/**
 * @swagger
 * /api/settings/accounts/{accountId}:
 *   delete:
 *     summary: Delete account
 *     description: Delete an Instagram account
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the account to delete
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Invalid request parameters or account is active
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.delete("/accounts/:accountId", settingsController.deleteAccount);

module.exports = router;
