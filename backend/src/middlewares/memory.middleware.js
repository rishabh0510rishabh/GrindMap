import { asyncMiddleware } from '../utils/asyncWrapper.js';

/**
 * Memory monitoring middleware with async error handling
 */
const memoryMonitor = asyncMiddleware(async (req, res, next) => {
  try {
    const memUsage = process.memoryUsage();
    const memoryThreshold = 500 * 1024 * 1024; // 500MB

    // Log memory usage if above threshold
    if (memUsage.heapUsed > memoryThreshold) {
      console.warn('⚠️ HIGH MEMORY USAGE:', {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        timestamp: new Date().toISOString()
      });
    }

    // Force garbage collection if memory is critically high
    if (memUsage.heapUsed > memoryThreshold * 2 && global.gc) {
      global.gc();
    }

    next();
  } catch (error) {
    console.error('Memory monitoring error:', error);
    next(); // Continue even if monitoring fails
  }
});

export { memoryMonitor };