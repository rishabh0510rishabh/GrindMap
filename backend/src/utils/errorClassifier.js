import Logger from './logger.js';

/**
 * ErrorClassifier - Handles error type detection and classification
 * Follows Single Responsibility Principle for error classification logic
 */
class ErrorClassifier {
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
   * Get error type for metrics
   */
  static getErrorType(error) {
    if (this.isNetworkError(error)) return 'network';
    if (this.isRateLimitError(error)) return 'rate_limit';
    if (this.isAuthError(error)) return 'auth';
    if (this.isUserNotFoundError(error)) return 'user_not_found';
    if (this.isServerError(error)) return 'server';
    if (this.isParsingError(error)) return 'parsing';
    if (this.isTimeoutError(error)) return 'timeout';
    return 'unknown';
  }

  /**
   * Check if error should not be retried
   */
  static isNonRetryableError(error) {
    const status = error.response?.status;
    const message = error.message?.toLowerCase();

    // Don't retry on client errors (4xx) except rate limits
    if (status >= 400 && status < 500 && status !== 429) {
      return true;
    }

    // Don't retry on authentication errors
    if (this.isAuthError(error) || this.isUserNotFoundError(error)) {
      return true;
    }

    return false;
  }
}

export default ErrorClassifier;
