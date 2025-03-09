const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

/**
 * @swagger
 * /api/stats/account:
 *   get:
 *     summary: Get account statistics
 *     description: Retrieve general statistics about the Instagram account
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Account statistics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/account", statsController.getAccountStats);

/**
 * @swagger
 * /api/stats/interactions:
 *   get:
 *     summary: Get interaction statistics
 *     description: Retrieve statistics about interactions (likes, comments, etc.)
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for stats (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for stats (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Interaction statistics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/interactions", statsController.getInteractionStats);

/**
 * @swagger
 * /api/stats/trends:
 *   get:
 *     summary: Get trend statistics
 *     description: Retrieve statistics about trending hashtags
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter trends by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of trends returned
 *     responses:
 *       200:
 *         description: Trend statistics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/trends", statsController.getTrendStats);

/**
 * @swagger
 * /api/stats/follows:
 *   get:
 *     summary: Get follow statistics
 *     description: Retrieve statistics about follows and unfollows
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for stats (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for stats (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Follow statistics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/follows", statsController.getFollowStats);

/**
 * @swagger
 * /api/stats/top-users:
 *   get:
 *     summary: Get top engaged users
 *     description: Retrieve users with highest engagement
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of users returned
 *     responses:
 *       200:
 *         description: Top users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/top-users", statsController.getTopEngagedUsers);

module.exports = router;
