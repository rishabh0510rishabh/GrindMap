import ApiClient from '../../utils/apiClient.js';
import ScraperValidator from '../../utils/scraperValidator.js';
import Logger from '../../utils/logger.js';

// Create LeetCode API client with circuit breaker
const leetcodeClient = ApiClient.createLeetCodeClient();

export async function scrapeLeetCode(username) {
  const validatedUsername = ScraperValidator.validateUsername(username, 'LEETCODE');
  
  try {
    const response = await leetcodeClient.get(`https://leetcode-stats.tashif.codes/${validatedUsername}`, {
      cacheTTL: 300, // 5 minutes cache
      cacheKey: `leetcode:${validatedUsername}`
    });
    
    if (!response.data) {
      throw new Error('No data received from LeetCode API');
    }
    
    const sanitizedData = ScraperValidator.sanitizeResponse(response.data);
    
    return {
      platform: "LEETCODE",
      username: validatedUsername,
      data: sanitizedData,
      fromCache: response.fromCache,
      fromFallback: response.fromFallback
    };
  } catch (error) {
    Logger.error('LeetCode scraping failed', { 
      username: validatedUsername, 
      error: error.message,
      circuitBreakerState: leetcodeClient.getCircuitBreakerState()
    });
    throw new Error(`Failed to fetch LeetCode data: ${error.message}`);
  }
}