import ApiClient from '../../utils/apiClient.js';
import ScraperValidator from '../../utils/scraperValidator.js';
import Logger from '../../utils/logger.js';

// Create CodeForces API client with circuit breaker
const codeforcesClient = ApiClient.createCodeForcesClient();

export async function fetchCodeforcesStats(username) {
  const validatedUsername = ScraperValidator.validateUsername(username, 'CODEFORCES');
  
  try {
    const response = await codeforcesClient.get(`/api/user.info?handles=${validatedUsername}`, {
      cacheTTL: 600, // 10 minutes cache
      cacheKey: `codeforces:${validatedUsername}`
    });
    
    if (response.data.status !== 'OK') {
      throw new Error(response.data.comment || 'API returned error status');
    }
    
    if (!response.data.result || response.data.result.length === 0) {
      throw new Error('User not found');
    }
    
    const sanitizedData = ScraperValidator.sanitizeResponse(response.data.result[0]);
    
    return {
      platform: 'CODEFORCES',
      username: validatedUsername,
      data: sanitizedData,
      fromCache: response.fromCache,
      fromFallback: response.fromFallback
    };
  } catch (error) {
    Logger.error('Codeforces scraping failed', { 
      username: validatedUsername, 
      error: error.message,
      circuitBreakerState: codeforcesClient.getCircuitBreakerState()
    });
    throw new Error(`Failed to fetch Codeforces data: ${error.message}`);
  }
}