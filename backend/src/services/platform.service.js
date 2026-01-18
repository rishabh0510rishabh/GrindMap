import { scrapeLeetCode } from './scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from './scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from './scraping/codechef.scraper.js';
import { normalizeCodeforces } from './normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from './normalization/codechef.normalizer.js';
import { PLATFORMS, MESSAGES } from '../constants/app.constants.js';
import { AppError, ERROR_CODES } from '../utils/appError.js';

/**
 * Platform scraping service - handles all platform data fetching
 * NO DIRECT SERVICE DEPENDENCIES - uses DI container
 */
class PlatformService {
  constructor(container = null) {
    this.container = container;
  }

  /**
   * Fetch user data from LeetCode
   */
  async fetchLeetCodeData(username) {
    try {
      const data = await scrapeLeetCode(username);
      return {
        platform: PLATFORMS.LEETCODE,
        username,
        ...data,
      };
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: LeetCode`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from Codeforces
   */
  async fetchCodeforcesData(username) {
    try {
      const rawData = await fetchCodeforcesStats(username);
      const normalizedData = normalizeCodeforces({ ...rawData, username });
      
      return {
        platform: PLATFORMS.CODEFORCES,
        username,
        ...normalizedData,
      };
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: Codeforces`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from CodeChef
   */
  async fetchCodeChefData(username) {
    try {
      const rawData = await fetchCodeChefStats(username);
      const normalizedData = normalizeCodeChef({ ...rawData, username });
      
      return {
        platform: PLATFORMS.CODECHEF,
        username,
        ...normalizedData,
      };
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: CodeChef`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Get supported platforms list
   */
  getSupportedPlatforms() {
    return Object.values(PLATFORMS);
  }

  /**
   * Get activity service (lazy loaded)
   */
  getActivityService() {
    return this.container?.get('activityService');
  }
}

export default PlatformService;