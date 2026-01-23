/**
 * Async error wrapper for middleware functions
 * Catches async errors and passes them to error handler
 */
export const asyncMiddleware = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Timeout wrapper for async operations
 */
export const withTimeout = (fn, timeoutMs = 30000) => {
  return async (req, res, next) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    try {
      await Promise.race([
        Promise.resolve(fn(req, res, next)),
        timeoutPromise
      ]);
    } catch (error) {
      next(error);
    }
  };
};