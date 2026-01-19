import AnalyticsService from '../services/analytics.service.js';
import { sendSuccess } from '../utils/response.helper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

class AnalyticsController {
  /**
   * Get user progress trends
   * @route GET /api/analytics/trends
   */
  getTrends = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    if (days < 1 || days > 365) {
      throw new AppError('Days must be between 1 and 365', 400);
    }

    const trends = await AnalyticsService.getUserTrends(userId, parseInt(days));
    sendSuccess(res, trends, 'Trends retrieved successfully');
  });

  /**
   * Get platform comparison
   * @route GET /api/analytics/comparison
   */
  getComparison = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const comparison = await AnalyticsService.getPlatformComparison(userId, parseInt(days));
    sendSuccess(res, comparison, 'Platform comparison retrieved successfully');
  });

  /**
   * Get performance metrics
   * @route GET /api/analytics/performance
   */
  getPerformance = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const performance = await AnalyticsService.getPerformanceMetrics(userId, parseInt(days));
    sendSuccess(res, performance, 'Performance metrics retrieved successfully');
  });

  /**
   * Get streak analytics
   * @route GET /api/analytics/streaks
   */
  getStreaks = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const streaks = await AnalyticsService.getStreakAnalytics(userId);
    sendSuccess(res, streaks, 'Streak analytics retrieved successfully');
  });

  /**
   * Get global leaderboard
   * @route GET /api/analytics/leaderboard
   */
  getLeaderboard = asyncHandler(async (req, res) => {
    const { platform, limit = 100 } = req.query;

    if (limit < 1 || limit > 1000) {
      throw new AppError('Limit must be between 1 and 1000', 400);
    }

    const leaderboard = await AnalyticsService.getGlobalLeaderboard(platform, parseInt(limit));
    sendSuccess(res, leaderboard, 'Leaderboard retrieved successfully');
  });

  /**
   * Get analytics summary
   * @route GET /api/analytics/summary
   */
  getSummary = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const [trends, comparison, performance, streaks] = await Promise.all([
      AnalyticsService.getUserTrends(userId, parseInt(days)),
      AnalyticsService.getPlatformComparison(userId, parseInt(days)),
      AnalyticsService.getPerformanceMetrics(userId, parseInt(days)),
      AnalyticsService.getStreakAnalytics(userId)
    ]);

    const summary = {
      trends: trends.slice(-7), // Last 7 days
      topPlatforms: comparison.slice(0, 3),
      performance,
      streaks,
      period: `${days} days`
    };

    sendSuccess(res, summary, 'Analytics summary retrieved successfully');
  });

  /**
   * Get analytics for specific platform
   * @route GET /api/analytics/platform/:platform
   */
  getPlatformAnalytics = asyncHandler(async (req, res) => {
    const { platform } = req.params;
    const { days = 30 } = req.query;
    const userId = req.user.id;

    // Get platform-specific trends
    const trends = await AnalyticsService.getUserTrends(userId, parseInt(days));
    const platformTrends = trends.map(day => ({
      date: day._id,
      data: day.platforms.find(p => p.platform === platform.toUpperCase()) || {}
    })).filter(day => day.data.platform);

    sendSuccess(res, platformTrends, `${platform} analytics retrieved successfully`);
  });

  /**
   * Record analytics data (internal endpoint)
   * @route POST /api/analytics/record
   */
  recordAnalytics = asyncHandler(async (req, res) => {
    const { platform, metrics } = req.body;
    const userId = req.user.id;

    await AnalyticsService.recordAnalytics(userId, platform, metrics);
    sendSuccess(res, null, 'Analytics recorded successfully');
  });
}

export default new AnalyticsController();