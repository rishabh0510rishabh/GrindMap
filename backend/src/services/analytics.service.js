import Analytics from '../models/analytics.model.js';
import mongoose from 'mongoose';
import redis from '../config/redis.js';
import Logger from '../utils/logger.js';

class AnalyticsService {
  /**
   * Get user progress trends with caching
   */
  async getUserTrends(userId, days = 30) {
    const cacheKey = `analytics:trends:${userId}:${days}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            platform: "$platform"
          },
          totalProblems: { $sum: "$metrics.problemsSolved" },
          dailyChange: { $sum: "$dailyChange.problemsSolved" },
          rating: { $avg: "$metrics.rating" },
          submissions: { $sum: "$metrics.submissions" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          platforms: {
            $push: {
              platform: "$_id.platform",
              problems: "$totalProblems",
              change: "$dailyChange",
              rating: "$rating",
              submissions: "$submissions"
            }
          },
          totalProblems: { $sum: "$totalProblems" },
          totalChange: { $sum: "$dailyChange" }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const trends = await Analytics.aggregate(pipeline);
    
    // Calculate moving averages
    const result = this.calculateMovingAverages(trends, 7);
    
    // Cache for 15 minutes
    await redis.set(cacheKey, JSON.stringify(result), 900);
    
    return result;
  }

  /**
   * Get platform comparison analytics
   */
  async getPlatformComparison(userId, days = 30) {
    const cacheKey = `analytics:comparison:${userId}:${days}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$platform",
          totalProblems: { $sum: "$metrics.problemsSolved" },
          avgRating: { $avg: "$metrics.rating" },
          totalSubmissions: { $sum: "$metrics.submissions" },
          avgAcceptanceRate: { $avg: "$metrics.acceptanceRate" },
          easyCount: { $sum: "$metrics.easyCount" },
          mediumCount: { $sum: "$metrics.mediumCount" },
          hardCount: { $sum: "$metrics.hardCount" },
          growthRate: {
            $avg: {
              $cond: [
                { $gt: ["$dailyChange.problemsSolved", 0] },
                "$dailyChange.problemsSolved",
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          platform: "$_id",
          difficultyDistribution: {
            easy: "$easyCount",
            medium: "$mediumCount",
            hard: "$hardCount"
          }
        }
      },
      { $sort: { totalProblems: -1 } }
    ];

    const comparison = await Analytics.aggregate(pipeline);
    
    // Cache for 15 minutes
    await redis.set(cacheKey, JSON.stringify(comparison), 900);
    
    return comparison;
  }

  /**
   * Get performance metrics with growth rates
   */
  async getPerformanceMetrics(userId, days = 30) {
    const cacheKey = `analytics:performance:${userId}:${days}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: "$metrics.problemsSolved" },
          avgDailyProblems: { $avg: "$dailyChange.problemsSolved" },
          maxDailyProblems: { $max: "$dailyChange.problemsSolved" },
          totalSubmissions: { $sum: "$metrics.submissions" },
          avgAcceptanceRate: { $avg: "$metrics.acceptanceRate" },
          activeDays: {
            $sum: {
              $cond: [{ $gt: ["$dailyChange.problemsSolved", 0] }, 1, 0]
            }
          },
          consistencyScore: {
            $avg: {
              $cond: [
                { $gt: ["$dailyChange.problemsSolved", 0] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          problemsPerDay: { $divide: ["$totalProblems", days] },
          activityRate: { $divide: ["$activeDays", days] }
        }
      }
    ];

    const metrics = await Analytics.aggregate(pipeline);
    const result = metrics[0] || {};
    
    // Calculate growth rate
    result.growthRate = await this.calculateGrowthRate(userId, days);
    
    // Cache for 15 minutes
    await redis.set(cacheKey, JSON.stringify(result), 900);
    
    return result;
  }

  /**
   * Get streak analytics
   */
  async getStreakAnalytics(userId) {
    const cacheKey = `analytics:streaks:${userId}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          "dailyChange.problemsSolved": { $gt: 0 }
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $group: {
          _id: null,
          dates: { $push: "$date" },
          totalActiveDays: { $sum: 1 }
        }
      }
    ];

    const data = await Analytics.aggregate(pipeline);
    
    if (!data[0]) {
      return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
    }

    const dates = data[0].dates;
    const streaks = this.calculateStreaks(dates);
    
    const result = {
      ...streaks,
      totalActiveDays: data[0].totalActiveDays
    };
    
    // Cache for 15 minutes
    await redis.set(cacheKey, JSON.stringify(result), 900);
    
    return result;
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(platform = null, limit = 100) {
    const cacheKey = `analytics:leaderboard:${platform || 'all'}:${limit}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const matchStage = platform 
      ? { platform, date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      : { date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$userId",
          totalProblems: { $sum: "$metrics.problemsSolved" },
          avgRating: { $avg: "$metrics.rating" },
          platforms: { $addToSet: "$platform" },
          recentActivity: { $sum: "$dailyChange.problemsSolved" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $addFields: {
          userName: { $arrayElemAt: ['$user.name', 0] },
          userEmail: { $arrayElemAt: ['$user.email', 0] }
        }
      },
      { $sort: { totalProblems: -1, avgRating: -1 } },
      { $limit: limit },
      {
        $project: {
          userId: "$_id",
          userName: 1,
          totalProblems: 1,
          avgRating: 1,
          platforms: 1,
          recentActivity: 1
        }
      }
    ];

    const leaderboard = await Analytics.aggregate(pipeline);
    
    // Cache for 15 minutes
    await redis.set(cacheKey, JSON.stringify(leaderboard), 900);
    
    return leaderboard;
  }

  /**
   * Calculate moving averages
   */
  calculateMovingAverages(data, window = 7) {
    return data.map((item, index) => {
      const start = Math.max(0, index - window + 1);
      const subset = data.slice(start, index + 1);
      
      const avgProblems = subset.reduce((sum, d) => sum + d.totalProblems, 0) / subset.length;
      const avgChange = subset.reduce((sum, d) => sum + d.totalChange, 0) / subset.length;
      
      return {
        ...item,
        movingAverage: {
          problems: Math.round(avgProblems * 100) / 100,
          change: Math.round(avgChange * 100) / 100
        }
      };
    });
  }

  /**
   * Calculate growth rate
   */
  async calculateGrowthRate(userId, days) {
    const midPoint = Math.floor(days / 2);
    const firstHalf = new Date();
    firstHalf.setDate(firstHalf.getDate() - days);
    const secondHalf = new Date();
    secondHalf.setDate(secondHalf.getDate() - midPoint);

    const [firstPeriod, secondPeriod] = await Promise.all([
      Analytics.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: firstHalf, $lt: secondHalf }
          }
        },
        { $group: { _id: null, total: { $sum: "$metrics.problemsSolved" } } }
      ]),
      Analytics.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: secondHalf }
          }
        },
        { $group: { _id: null, total: { $sum: "$metrics.problemsSolved" } } }
      ])
    ]);

    const first = firstPeriod[0]?.total || 0;
    const second = secondPeriod[0]?.total || 0;
    
    return first > 0 ? ((second - first) / first) * 100 : 0;
  }

  /**
   * Calculate streaks from dates
   */
  calculateStreaks(dates) {
    if (!dates.length) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Sort dates in descending order
    dates.sort((a, b) => new Date(b) - new Date(a));

    // Check current streak
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.isSameDay(dates[0], today) || this.isSameDay(dates[0], yesterday)) {
      currentStreak = 1;
      
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Record analytics data
   */
  async recordAnalytics(userId, platform, metrics) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Analytics.findOne({
      userId,
      platform,
      date: today
    });

    if (existing) {
      // Calculate daily change
      const dailyChange = {
        problemsSolved: metrics.problemsSolved - existing.metrics.problemsSolved,
        rating: metrics.rating - existing.metrics.rating,
        submissions: metrics.submissions - existing.metrics.submissions
      };

      existing.metrics = metrics;
      existing.dailyChange = dailyChange;
      await existing.save();
    } else {
      await Analytics.create({
        userId,
        platform,
        date: today,
        metrics,
        dailyChange: {
          problemsSolved: 0,
          rating: 0,
          submissions: 0
        }
      });
    }

    // Invalidate related caches
    await this.invalidateUserCaches(userId);
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCaches(userId) {
    const patterns = [
      `analytics:trends:${userId}:*`,
      `analytics:comparison:${userId}:*`,
      `analytics:performance:${userId}:*`,
      `analytics:streaks:${userId}`
    ];

    for (const pattern of patterns) {
      await redis.flushPattern(pattern);
    }
  }
}

export default new AnalyticsService();