import ApiClient from '../../utils/apiClient.js';
import InputValidator from '../../utils/inputValidator.js';
import ScraperErrorHandler from '../../utils/scraperErrorHandler.js';
import Logger from '../../utils/logger.js';
import RequestManager from '../../utils/requestManager.js';

// Create CodeForces API client with circuit breaker
const codeforcesClient = ApiClient.createCodeForcesClient();

export async function fetchCodeforcesStats(username) {
  const startTime = Date.now();
  let validatedUsername;
  
  try {
    // Validate and sanitize username
    validatedUsername = InputValidator.validateUsername(username, 'CODEFORCES');
    
    Logger.debug(`Starting Codeforces scrape for user: ${validatedUsername}`);
    
    const response = await codeforcesClient.get(`/api/user.info?handles=${validatedUsername}`, {
      cacheTTL: 600, // 10 minutes cache
      cacheKey: `codeforces:${validatedUsername}`
    });
    
    // Validate Codeforces API response format
    if (response.data.status !== 'OK') {
      if (response.data.comment?.includes('not found')) {
        throw new Error('User not found');
      }
      throw new Error(response.data.comment || 'API returned error status');
    }
    
    if (!response.data.result || response.data.result.length === 0) {
      throw new Error('User not found');
    }
    
    // Validate and sanitize response data
    const userData = response.data.result[0];
    InputValidator.validateApiResponse(userData, 'Codeforces', ['handle']);
    const sanitizedData = InputValidator.sanitizeResponse(userData);
    
    const result = ScraperErrorHandler.createSuccessResponse(
      'CODEFORCES',
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
      'Codeforces',
      validatedUsername,
      startTime,
      true,
      response.fromCache
    );
    
    return result;
    
  } catch (error) {
    // Handle circuit breaker errors first
    if (ScraperErrorHandler.handleCircuitBreakerError(error, 'Codeforces')) {
      return;
    }
    
    // Log performance metrics for failed requests
    ScraperErrorHandler.logPerformanceMetrics(
      'Codeforces',
      validatedUsername || username,
      startTime,
      false
    );
    
    // Handle and standardize the error
    ScraperErrorHandler.handleScraperError(error, 'Codeforces', validatedUsername || username, {
      apiEndpoint: 'codeforces.com/api',
      circuitBreakerState: codeforcesClient.getCircuitBreakerState()
    });
  }
}