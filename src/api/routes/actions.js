const express = require("express");
const router = express.Router();
const actionsController = require("../controllers/actionsController");

/**
 * @swagger
 * /api/actions/start:
 *   post:
 *     summary: Start the bot
 *     description: Start the Instagram bot's automated activities
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Bot started successfully
 *       400:
 *         description: Bot could not be started
 *       500:
 *         description: Server error
 */
router.post("/start", actionsController.startBot);

/**
 * @swagger
 * /api/actions/stop:
 *   post:
 *     summary: Stop the bot
 *     description: Stop the Instagram bot's automated activities
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Bot stopped successfully
 *       400:
 *         description: Bot could not be stopped
 *       500:
 *         description: Server error
 */
router.post("/stop", actionsController.stopBot);

/**
 * @swagger
 * /api/actions/status:
 *   get:
 *     summary: Get bot status
 *     description: Retrieve the current status of the bot
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Bot status retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/status", actionsController.getBotStatus);

/**
 * @swagger
 * /api/actions/run-task:
 *   post:
 *     summary: Run a specific task
 *     description: Execute a specific task manually
 *     tags: [Bot Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskName
 *             properties:
 *               taskName:
 *                 type: string
 *                 description: Name of the task to run
 *                 enum: [update_trends, follow_users, unfollow_users, interact_with_user, follow_back]
 *               options:
 *                 type: object
 *                 description: Options for the task
 *     responses:
 *       200:
 *         description: Task executed successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/run-task", actionsController.runSpecificTask);

/**
 * @swagger
 * /api/actions/interact:
 *   post:
 *     summary: Interact with user
 *     description: Perform interactions with a specific Instagram user
 *     tags: [Bot Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Instagram username to interact with
 *               fullInteraction:
 *                 type: boolean
 *                 description: Whether to perform a full interaction (incl. comments and DMs)
 *     responses:
 *       200:
 *         description: Interaction performed successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/interact", actionsController.interactWithUser);

/**
 * @swagger
 * /api/actions/follow:
 *   post:
 *     summary: Follow user
 *     description: Follow a specific Instagram user
 *     tags: [Bot Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Instagram username to follow
 *     responses:
 *       200:
 *         description: User followed successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/follow", actionsController.followUser);

/**
 * @swagger
 * /api/actions/unfollow:
 *   post:
 *     summary: Unfollow user
 *     description: Unfollow a specific Instagram user
 *     tags: [Bot Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Instagram username to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/unfollow", actionsController.unfollowUser);

/**
 * @swagger
 * /api/actions/process-follow-backs:
 *   post:
 *     summary: Process follow backs
 *     description: Process follow back checks for all users
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Follow backs processed successfully
 *       500:
 *         description: Server error
 */
router.post("/process-follow-backs", actionsController.processFollowBacks);

/**
 * @swagger
 * /api/actions/reset-daily-stats:
 *   post:
 *     summary: Reset daily stats
 *     description: Reset all daily statistics counters
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Daily stats reset successfully
 *       500:
 *         description: Server error
 */
router.post("/reset-daily-stats", actionsController.resetDailyStats);

/**
 * @swagger
 * /api/actions/update-trends:
 *   post:
 *     summary: Update trends
 *     description: Update trending hashtags data
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Trends updated successfully
 *       500:
 *         description: Server error
 */
router.post("/update-trends", actionsController.updateTrends);

/**
 * @swagger
 * /api/actions/find-active-users:
 *   get:
 *     summary: Find active users
 *     description: Find active users in trending hashtags
 *     tags: [Bot Actions]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of users returned
 *     responses:
 *       200:
 *         description: Active users found successfully
 *       500:
 *         description: Server error
 */
router.get("/find-active-users", actionsController.findActiveUsers);

/**
 * @swagger
 * /api/actions/account-health:
 *   get:
 *     summary: Check account health
 *     description: Check the health and restrictions status of the Instagram account
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Account health retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/account-health", actionsController.checkAccountHealth);

/**
 * @swagger
 * /api/actions/account-status:
 *   get:
 *     summary: Get account status
 *     description: Get detailed information about the Instagram account
 *     tags: [Bot Actions]
 *     responses:
 *       200:
 *         description: Account status retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/account-status", actionsController.getAccountStatus);

module.exports = router;
