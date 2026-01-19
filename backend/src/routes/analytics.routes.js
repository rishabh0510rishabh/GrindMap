import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { query, param, body } from 'express-validator';

const router = express.Router();

/**
 * @route   GET /api/analytics/trends
 * @desc    Get user progress trends with moving averages
 * @access  Private
 */
router.get(
  '/trends',
  protect,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  AnalyticsController.getTrends
);

/**
 * @route   GET /api/analytics/comparison
 * @desc    Get platform comparison analytics
 * @access  Private
 */
router.get(
  '/comparison',
  protect,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  AnalyticsController.getComparison
);

/**
 * @route   GET /api/analytics/performance
 * @desc    Get performance metrics and growth rates
 * @access  Private
 */
router.get(
  '/performance',
  protect,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  AnalyticsController.getPerformance
);

/**
 * @route   GET /api/analytics/streaks
 * @desc    Get streak analytics (current and longest)
 * @access  Private
 */
router.get('/streaks', protect, AnalyticsController.getStreaks);

/**
 * @route   GET /api/analytics/leaderboard
 * @desc    Get global leaderboard
 * @access  Private
 */
router.get(
  '/leaderboard',
  protect,
  [
    query('platform')
      .optional()
      .isIn(['LEETCODE', 'CODEFORCES', 'CODECHEF', 'ATCODER', 'GITHUB', 'SKILLRACK'])
      .withMessage('Invalid platform'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000')
  ],
  AnalyticsController.getLeaderboard
);

/**
 * @route   GET /api/analytics/summary
 * @desc    Get comprehensive analytics summary
 * @access  Private
 */
router.get(
  '/summary',
  protect,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  AnalyticsController.getSummary
);

/**
 * @route   GET /api/analytics/platform/:platform
 * @desc    Get analytics for specific platform
 * @access  Private
 */
router.get(
  '/platform/:platform',
  protect,
  [
    param('platform')
      .isIn(['leetcode', 'codeforces', 'codechef', 'atcoder', 'github', 'skillrack'])
      .withMessage('Invalid platform'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  AnalyticsController.getPlatformAnalytics
);

/**
 * @route   POST /api/analytics/record
 * @desc    Record analytics data (internal use)
 * @access  Private
 */
router.post(
  '/record',
  protect,
  [
    body('platform')
      .isIn(['LEETCODE', 'CODEFORCES', 'CODECHEF', 'ATCODER', 'GITHUB', 'SKILLRACK'])
      .withMessage('Invalid platform'),
    body('metrics')
      .isObject()
      .withMessage('Metrics must be an object'),
    body('metrics.problemsSolved')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Problems solved must be a non-negative integer'),
    body('metrics.rating')
      .optional()
      .isNumeric()
      .withMessage('Rating must be a number')
  ],
  AnalyticsController.recordAnalytics
);

export default router;