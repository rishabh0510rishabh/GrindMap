import ApiClient from '../../utils/apiClient.js';
import BaseScraper from './baseScraper.js';

// Create LeetCode API client with circuit breaker
const leetcodeClient = ApiClient.createLeetCodeClient();

class LeetCodeScraper extends BaseScraper {
  constructor() {
    super('LEETCODE', {
      enableRetry: true,
      enableFallback: true,
      cacheTTL: 300
    });
  }

  async _executeScrape(validatedUsername) {
    // Use retry logic for the API call
    const response = await this._withRetry(
      async () => {
        return await leetcodeClient.get(`https://leetcode-stats.tashif.codes/${validatedUsername}`, {
          cacheTTL: this.options.cacheTTL,
          cacheKey: this._getCacheKey(validatedUsername)
        });
      },
      validatedUsername,
      { apiEndpoint: 'leetcode-stats.tashif.codes' }
    );

    return response;
  }

  _validateResponse(data) {
    // Validate API response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from LeetCode API: response data is missing or not an object');
    }

    if (data.message === 'User not found') {
      throw new Error('User not found on LeetCode');
    }

    if (data.totalSolved === undefined || data.totalQuestions === undefined) {
      throw new Error('Invalid response from LeetCode API: required fields missing');
    }
  }

  _getErrorContext() {
    return {
      apiEndpoint: 'leetcode-stats.tashif.codes',
      circuitBreakerState: leetcodeClient.getCircuitBreakerState()
    };
  }
}

// Create singleton instance
const leetCodeScraper = new LeetCodeScraper();

export async function scrapeLeetCode(username) {
  return await leetCodeScraper.scrape(username);
}
