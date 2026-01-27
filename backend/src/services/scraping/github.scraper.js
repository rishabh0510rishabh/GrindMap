import ApiClient from '../../utils/apiClient.js';
import InputValidator from '../../utils/inputValidator.js';
import ScraperErrorHandler from '../../utils/scraperErrorHandler.js';
import Logger from '../../utils/logger.js';

// Create GitHub API client with circuit breaker
const githubClient = ApiClient.createGitHubClient();

export async function scrapeGitHub(username) {
  const startTime = Date.now();
  let validatedUsername;
  
  try {
    // Validate and sanitize username
    validatedUsername = InputValidator.validateUsername(username, 'GITHUB');
    
    Logger.debug(`Starting GitHub scrape for user: ${validatedUsername}`);
    
    const response = await githubClient.get(`/users/${validatedUsername}/events/public`, {
      cacheTTL: 300, // 5 minutes cache
      cacheKey: `github:${validatedUsername}`
    });
    
    const events = response.data;
    
    // Validate response is an array
    if (!Array.isArray(events)) {
      throw new Error('Invalid response format: expected array of events');
    }
    
    const today = new Date();
    
    // Count events in the last 7 days (simple activity metric)
    const recentActivity = events.filter(event => {
      try {
        const eventDate = new Date(event.created_at);
        const diffDays = (today - eventDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      } catch (dateError) {
        Logger.warn('Invalid date in GitHub event', { event: event.id });
        return false;
      }
    });
    
    const activityData = {
      totalEvents: events.length,
      recentActivityCount: recentActivity.length,
      status: "success"
    };
    
    // Sanitize the data
    const sanitizedData = InputValidator.sanitizeResponse(activityData);
    
    const result = ScraperErrorHandler.createSuccessResponse(
      'GITHUB',
      validatedUsername,
      sanitizedData,
      {
        fromCache: response.fromCache,
        fromFallback: response.fromFallback,
        responseTime: Date.now() - startTime
      }
    );
    
    // Log performance metrics
    ScraperErrorHandler.logPerformanceMetrics(
      'GitHub',
      validatedUsername,
      startTime,
      true,
      response.fromCache
    );
    
    return result;
    
  } catch (error) {
    // Handle circuit breaker errors first
    if (ScraperErrorHandler.handleCircuitBreakerError(error, 'GitHub')) {
      return;
    }
    
    // Log performance metrics for failed requests
    ScraperErrorHandler.logPerformanceMetrics(
      'GitHub',
      validatedUsername || username,
      startTime,
      false
    );
    
    // For GitHub, return error response instead of throwing
    return ScraperErrorHandler.createErrorResponse(
      'GITHUB',
      validatedUsername || username,
      error,
      {
        apiEndpoint: 'api.github.com',
        responseTime: Date.now() - startTime
      }
    );
  }
}