import { AppError, ERROR_CODES } from './appError.js';
import Logger from './logger.js';

class ScraperErrorHandler {
  /**
   * Handle and standardize scraper errors
   */
  static handleScraperError(error, platform, username, context = {}) {
    const errorContext = {
      platform,
      username,
      timestamp: new Date().toISOString(),
      ...context
    };

    // Log the original error for debugging
    Logger.error(`Scraper error for ${platform}:${username}`, {
      error: error.message,
      stack: error.stack,
      ...errorContext
    });

    // Determine error type and create standardized response
    if (error instanceof AppError) {
      // Already a standardized error, just re-throw
      throw error;
    }

    // Network and timeout errors
    if (this.isNetworkError(error)) {
      throw new AppError(
        `Network error while fetching ${platform} data. Please try again later.`,
        503,
        ERROR_CODES.NETWORK_ERROR,
        errorContext
      );
    }

    // Rate limiting errors
    if (this.isRateLimitError(error)) {
      throw new AppError(
        `Rate limit exceeded for ${platform}. Please wait before trying again.`,
        429,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        errorContext
      );
    }

    // Authentication/Authorization errors
    if (this.isAuthError(error)) {
      throw new AppError(
        `Authentication failed for ${platform}. Please check your credentials.`,
        401,
        ERROR_CODES.AUTHENTICATION_ERROR,
        errorContext
      );
    }

    // User not found errors
    if (this.isUserNotFoundError(error)) {
      throw new AppError(
        `User '${username}' not found on ${platform}. Please check the username.`,
        404,
        ERROR_CODES.USER_NOT_FOUND,
        errorContext
      );
    }

    // API/Server errors
    if (this.isServerError(error)) {
      throw new AppError(
        `${platform} service is temporarily unavailable. Please try again later.`,
        502,
        ERROR_CODES.EXTERNAL_API_ERROR,
        errorContext
      );
    }

    // Parsing/Data format errors
    if (this.isParsingError(error)) {
      throw new AppError(
        `Invalid data format received from ${platform}. The service may be experiencing issues.`,
        502,
        ERROR_CODES.DATA_PARSING_ERROR,
        errorContext
      );
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      throw new AppError(
        `Request to ${platform} timed out. Please try again later.`,
        504,
        ERROR_CODES.TIMEOUT_ERROR,
        errorContext
      );
    }

    // Generic fallback error
    throw new AppError(
      `Failed to fetch data from ${platform}. Please try again later.`,
      500,
      ERROR_CODES.SCRAPING_ERROR,
      { ...errorContext, originalError: error.message }
    );
  }

  /**
   * Check if error is network-related
   */
  static isNetworkError(error) {
    const networkCodes = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'NETWORK_ERROR'];
    const networkMessages = ['network error', 'connection refused', 'dns lookup failed'];
    
    return networkCodes.includes(error.code) ||
           networkMessages.some(msg => error.message?.toLowerCase().includes(msg));
  }

  /**
   * Check if error is rate limiting
   */
  static isRateLimitError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();
    
    return status === 429 ||
           error.code === 'RATE_LIMITED' ||
           message?.includes('rate limit') ||
           message?.includes('too many requests');
  }

  /**
   * Check if error is authentication-related
   */
  static isAuthError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();
    
    return status === 401 ||
           status === 403 ||
           message?.includes('unauthorized') ||
           message?.includes('forbidden') ||
           message?.includes('authentication');
  }

  /**
   * Check if error indicates user not found
   */
  static isUserNotFoundError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();
    
    return status === 404 ||
           message?.includes('user not found') ||
           message?.includes('profile not found') ||
           message?.includes('does not exist');
  }

  /**
   * Check if error is server-related
   */
  static isServerError(error) {
    const status = error.response?.status;
    
    return (status >= 500 && status < 600) ||
           error.code === 'SERVER_ERROR';
  }

  /**
   * Check if error is parsing-related
   */
  static isParsingError(error) {
    const message = error.message?.toLowerCase();
    
    return message?.includes('json') ||
           message?.includes('parse') ||
           message?.includes('invalid response') ||
           message?.includes('malformed');
  }

  /**
   * Check if error is timeout-related
   */
  static isTimeoutError(error) {
    const message = error.message?.toLowerCase();
    
    return error.code === 'ETIMEDOUT' ||
           message?.includes('timeout') ||
           message?.includes('timed out');
  }

  /**
   * Create standardized success response
   */
  static createSuccessResponse(platform, username, data, metadata = {}) {
    return {
      success: true,
      platform,
      username,
      data: data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'scraper',
        ...metadata
      }
    };
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(platform, username, error, metadata = {}) {
    return {
      success: false,
      platform,
      username,
      error: {
        message: error.message,
        code: error.code || ERROR_CODES.SCRAPING_ERROR,
        statusCode: error.statusCode || 500
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'scraper',
        ...metadata
      }
    };
  }

  /**
   * Validate scraper response format
   */
  static validateScraperResponse(response, platform) {
    if (!response) {
      throw new AppError(
        `Empty response from ${platform} scraper`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }

    if (typeof response !== 'object') {
      throw new AppError(
        `Invalid response format from ${platform} scraper`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }

    // Check required fields
    const requiredFields = ['platform', 'username'];
    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new AppError(
          `Missing required field '${field}' in ${platform} scraper response`,
          500,
          ERROR_CODES.SCRAPING_ERROR
        );
      }
    }

    return true;
  }

  /**
   * Handle circuit breaker errors
   */
  static handleCircuitBreakerError(error, platform) {
    if (error.message?.includes('Circuit breaker') && error.message?.includes('OPEN')) {
      throw new AppError(
        `${platform} service is temporarily unavailable due to repeated failures. Please try again in a few minutes.`,
        503,
        ERROR_CODES.SERVICE_UNAVAILABLE,
        { circuitBreakerOpen: true }
      );
    }
    
    return false;
  }

  /**
   * Log scraper performance metrics
   */
  static logPerformanceMetrics(platform, username, startTime, success, fromCache = false) {
    const duration = Date.now() - startTime;
    
    Logger.info(`Scraper performance: ${platform}`, {
      username,
      duration: `${duration}ms`,
      success,
      fromCache,
      timestamp: new Date().toISOString()
    });

    // Log warning for slow requests
    if (duration > 10000 && !fromCache) {
      Logger.warn(`Slow scraper response: ${platform}`, {
        username,
        duration: `${duration}ms`
      });
    }
  }
}

export default ScraperErrorHandler;